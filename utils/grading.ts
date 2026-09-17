import type {
  SyncedAssignmentGroup,
  SyncedCourse,
  SyncedGradingSchemeEntry,
} from '@/context/CanvasDataContext';

export type GradeRow = {
  id: string;
  assignmentGroupId?: string;
  score?: number | null;
  pointsPossible?: number | null;
  excused?: boolean;
  omitFromFinalGrade?: boolean;
};

export type EffectiveWeight = {
  id: string;
  name: string;
  weight: number;
  source: 'canvas' | 'syllabus';
  rules?: any;
};

const round = (n: number) => Math.round(n * 10) / 10;
const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const syllabusText = (html?: string) =>
  String(html || '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();

export function parseSyllabusGradingScheme(html?: string): SyncedGradingSchemeEntry[] {
  const text = syllabusText(html);
  if (!text) return [];

  const letters = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
  const found = new Map<string, number>();
  const add = (name: string, value: number) => {
    const label = name.toUpperCase();
    if (!letters.includes(label) || !Number.isFinite(value) || value < 0 || value > 100) return;
    const prior = found.get(label);
    if (prior == null || value > prior) found.set(label, value);
  };

  for (const letter of letters) {
    const escaped = letter.replace(/[+\-]/g, '\\$&');
    const lead = `(?:^|[\\s,(])${escaped}(?=[\\s,:=≥>]|$)`;
    const tail = `(?:^|[\\s,(])${escaped}(?=[\\s,.;)]|$)`;
    const patterns = [
      new RegExp(`${lead}\\s*(?:[:=]|is|>=|≥)?\\s*(\\d{1,3}(?:\\.\\d+)?)\\s*%?`, 'im'),
      new RegExp(`${lead}\\s*(\\d{1,3}(?:\\.\\d+)?)\\s*(?:-|–|—|to)\\s*\\d{1,3}(?:\\.\\d+)?\\s*%?`, 'im'),
      new RegExp(`(\\d{1,3}(?:\\.\\d+)?)\\s*(?:-|–|—|to)\\s*\\d{1,3}(?:\\.\\d+)?\\s*%?\\s*${tail}`, 'im'),
      new RegExp(`(?:>=|≥)\\s*(\\d{1,3}(?:\\.\\d+)?)\\s*%?\\s*${tail}`, 'im'),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        add(letter, Number(match[1]));
        break;
      }
    }
  }

  return [...found.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function effectiveGradingScheme(course?: SyncedCourse | null) {
  if (!course) return { scheme: [] as SyncedGradingSchemeEntry[], estimated: false, source: 'none' as const };
  const canvas = (course.gradingScheme || []).filter(
    (entry) => entry?.name && Number.isFinite(Number(entry.value)),
  );
  if (canvas.length) {
    return {
      scheme: [...canvas].sort((a, b) => Number(b.value) - Number(a.value)),
      estimated: false,
      source: 'canvas' as const,
    };
  }

  const syllabus = parseSyllabusGradingScheme(course.syllabusBody);
  if (syllabus.length >= 4) {
    return { scheme: syllabus, estimated: true, source: 'syllabus' as const };
  }

  return {
    scheme: [
      { name: 'A', value: 93 },
      { name: 'A-', value: 90 },
      { name: 'B+', value: 87 },
      { name: 'B', value: 83 },
      { name: 'B-', value: 80 },
      { name: 'C+', value: 77 },
      { name: 'C', value: 73 },
      { name: 'C-', value: 70 },
      { name: 'D+', value: 67 },
      { name: 'D', value: 63 },
      { name: 'D-', value: 60 },
      { name: 'F', value: 0 },
    ],
    estimated: true,
    source: 'standard' as const,
  };
}

export function letterForScore(score: number | null | undefined, course?: SyncedCourse | null) {
  if (score == null || !Number.isFinite(Number(score))) return { letter: undefined, estimated: false, source: 'none' as const };
  const { scheme, estimated, source } = effectiveGradingScheme(course);
  const value = Number(score);
  const entry = scheme.find((item) => value >= Number(item.value)) || scheme[scheme.length - 1];
  return { letter: entry?.name, estimated, source };
}

export function effectiveWeights(course: SyncedCourse, groups: SyncedAssignmentGroup[]): EffectiveWeight[] {
  const courseGroups = groups
    .filter((group) => String(group.courseId) === String(course.id))
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const canvasWeights = courseGroups.filter((group) => Number(group.weight) > 0);
  if (course.applyAssignmentGroupWeights && canvasWeights.length) {
    return canvasWeights.map((group) => ({
      id: String(group.id),
      name: group.name,
      weight: Number(group.weight),
      source: 'canvas' as const,
      rules: group.rules,
    }));
  }

  const hints = course.syllabusWeights || [];
  if (!hints.length || !courseGroups.length) return [];
  const matched: EffectiveWeight[] = [];
  for (const group of courseGroups) {
    const g = norm(group.name);
    const hint = hints.find((candidate) => {
      const h = norm(candidate.name);
      return h === g || h.includes(g) || g.includes(h);
    });
    if (hint && Number(hint.weight) > 0) {
      matched.push({
        id: String(group.id),
        name: group.name,
        weight: Number(hint.weight),
        source: 'syllabus',
        rules: group.rules,
      });
    }
  }
  const total = matched.reduce((sum, item) => sum + item.weight, 0);
  return total >= 99 && total <= 101 ? matched : [];
}

function applyDropRules(rows: GradeRow[], rules: any) {
  if (!rows.length || !rules) return rows;
  const never = new Set((Array.isArray(rules?.never_drop) ? rules.never_drop : []).map(String));
  const ranked = rows
    .filter((row) => !never.has(String(row.id)) && row.pointsPossible && Number(row.pointsPossible) > 0 && row.score != null)
    .map((row) => ({ row, pct: Number(row.score) / Number(row.pointsPossible) }));
  const dropped = new Set<string>();
  const low = Math.max(0, Number(rules?.drop_lowest) || 0);
  const high = Math.max(0, Number(rules?.drop_highest) || 0);
  ranked
    .slice()
    .sort((a, b) => a.pct - b.pct)
    .slice(0, low)
    .forEach((item) => dropped.add(String(item.row.id)));
  ranked
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .filter((item) => !dropped.has(String(item.row.id)))
    .slice(0, high)
    .forEach((item) => dropped.add(String(item.row.id)));
  return rows.filter((row) => !dropped.has(String(row.id)));
}

export function calculateGrade(
  course: SyncedCourse,
  rows: GradeRow[],
  groups: SyncedAssignmentGroup[],
) {
  const validRows = rows.filter(
    (row) =>
      !row.excused &&
      !row.omitFromFinalGrade &&
      row.score != null &&
      row.pointsPossible != null &&
      Number(row.pointsPossible) > 0,
  );
  const weights = effectiveWeights(course, groups);

  if (weights.length) {
    let weighted = 0;
    let usedWeight = 0;
    const breakdown = weights.map((weight) => {
      const groupRows = applyDropRules(
        validRows.filter((row) => String(row.assignmentGroupId || '') === String(weight.id)),
        weight.rules,
      );
      const earned = groupRows.reduce((sum, row) => sum + Number(row.score || 0), 0);
      const possible = groupRows.reduce((sum, row) => sum + Number(row.pointsPossible || 0), 0);
      const percent = possible > 0 ? (earned / possible) * 100 : null;
      if (percent != null) {
        weighted += (percent / 100) * weight.weight;
        usedWeight += weight.weight;
      }
      return { ...weight, earned, possible, percent: percent == null ? null : round(percent) };
    });
    return {
      percent: usedWeight > 0 ? round((weighted / usedWeight) * 100) : null,
      weighted: true,
      source: weights[0]?.source || 'canvas',
      breakdown,
    };
  }

  const earned = validRows.reduce((sum, row) => sum + Number(row.score || 0), 0);
  const possible = validRows.reduce((sum, row) => sum + Number(row.pointsPossible || 0), 0);
  return {
    percent: possible > 0 ? round((earned / possible) * 100) : null,
    weighted: false,
    source: 'points' as const,
    breakdown: [],
  };
}
