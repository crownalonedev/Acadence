import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Calculator,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import {
  SyncedAssignment,
  SyncedAssignmentGroup,
  SyncedCourse,
  SyncedGrade,
  useCanvasData,
} from '@/context/CanvasDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

const round = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.max(0, Math.min(100, n));

type SimRow = {
  assignment: SyncedAssignment;
  grade?: SyncedGrade;
  score: number | null;
};

function letterFor(course: SyncedCourse, score: number | null) {
  if (score == null) return null;
  const scheme = [...(course.gradingScheme || [])].sort((a, b) => b.value - a.value);
  const hit = scheme.find((entry) => score >= entry.value);
  if (hit) return hit.name;
  if (
    course.currentGrade &&
    course.currentScore != null &&
    Math.abs(score - course.currentScore) < 0.05
  )
    return course.currentGrade;
  return null;
}

function applyDropRules(rows: SimRow[], group?: SyncedAssignmentGroup) {
  const valid = rows.filter(
    (row) =>
      row.score != null &&
      Number(row.assignment.pointsPossible || 0) > 0 &&
      !row.assignment.omitFromFinalGrade,
  );
  const rules = group?.rules || {};
  const never = new Set((rules.never_drop || []).map(String));
  const candidates = valid
    .filter((row) => !never.has(String(row.assignment.id)))
    .sort((a, b) => {
      const aPct = Number(a.score || 0) / Number(a.assignment.pointsPossible || 1);
      const bPct = Number(b.score || 0) / Number(b.assignment.pointsPossible || 1);
      return aPct - bPct;
    });
  const dropped = new Set<string>();
  const low = Math.max(0, Number(rules.drop_lowest) || 0);
  const high = Math.max(0, Number(rules.drop_highest) || 0);
  candidates.slice(0, low).forEach((row) => dropped.add(String(row.assignment.id)));
  candidates
    .filter((row) => !dropped.has(String(row.assignment.id)))
    .slice(Math.max(0, candidates.length - high))
    .forEach((row) => dropped.add(String(row.assignment.id)));
  return valid.filter((row) => !dropped.has(String(row.assignment.id)));
}

function scoreRows(
  course: SyncedCourse,
  rows: SimRow[],
  groups: SyncedAssignmentGroup[],
) {
  const weighted =
    !!course.applyAssignmentGroupWeights && groups.some((group) => group.weight > 0);
  if (weighted) {
    let total = 0;
    let used = 0;
    for (const group of groups) {
      if (group.weight <= 0) continue;
      const kept = applyDropRules(
        rows.filter(
          (row) => String(row.assignment.assignmentGroupId) === String(group.id),
        ),
        group,
      );
      const earned = kept.reduce((sum, row) => sum + Number(row.score || 0), 0);
      const possible = kept.reduce(
        (sum, row) => sum + Number(row.assignment.pointsPossible || 0),
        0,
      );
      if (possible > 0) {
        total += (earned / possible) * group.weight;
        used += group.weight;
      }
    }
    return used ? round((total / used) * 100) : null;
  }

  const kept = applyDropRules(rows);
  const earned = kept.reduce((sum, row) => sum + Number(row.score || 0), 0);
  const possible = kept.reduce(
    (sum, row) => sum + Number(row.assignment.pointsPossible || 0),
    0,
  );
  return possible ? round((earned / possible) * 100) : null;
}

export default function Grades() {
  const { courses, assignments, grades, assignmentGroups, connected } = useCanvasData();
  const { colors } = useAppTheme();
  const [course, setCourse] = useState<SyncedCourse | null>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});

  const simulate = (next: SyncedCourse) => {
    setCourse(next);
    setChanges({});
  };

  const selectedAssignments = useMemo(
    () =>
      course
        ? assignments.filter(
            (assignment) =>
              String(assignment.courseId) === String(course.id) &&
              !assignment.omitFromFinalGrade &&
              Number(assignment.pointsPossible || 0) > 0,
          )
        : [],
    [assignments, course],
  );
  const selectedGrades = useMemo(
    () =>
      course
        ? grades.filter(
            (grade) => String(grade.courseId) === String(course.id) && !grade.excused,
          )
        : [],
    [grades, course],
  );
  const selectedGroups = useMemo(
    () =>
      course
        ? assignmentGroups
            .filter((group) => String(group.courseId) === String(course.id))
            .sort((a, b) => (a.position || 0) - (b.position || 0))
        : [],
    [assignmentGroups, course],
  );

  const simRows = useMemo<SimRow[]>(() => {
    if (!course) return [];
    const gradeByAssignment = new Map(
      selectedGrades.map((grade) => [String(grade.assignmentId), grade]),
    );
    return selectedAssignments.map((assignment) => {
      const grade = gradeByAssignment.get(String(assignment.id));
      const raw = changes[String(assignment.id)];
      const changed = raw !== undefined && raw !== '';
      const value = changed ? Number(raw) : grade?.score;
      return {
        assignment,
        grade,
        score: value != null && Number.isFinite(Number(value)) ? Number(value) : null,
      };
    });
  }, [course, selectedAssignments, selectedGrades, changes]);

  const projected = useMemo(
    () => (course ? scoreRows(course, simRows, selectedGroups) : null),
    [course, simRows, selectedGroups],
  );
  const projectedLetter = course ? letterFor(course, projected) : null;

  const groupStats = useMemo(() => {
    if (!course) return [];
    return selectedGroups.map((group) => {
      const groupRows = simRows.filter(
        (row) => String(row.assignment.assignmentGroupId) === String(group.id),
      );
      const kept = applyDropRules(groupRows, group);
      const earned = kept.reduce((sum, row) => sum + Number(row.score || 0), 0);
      const possible = kept.reduce(
        (sum, row) => sum + Number(row.assignment.pointsPossible || 0),
        0,
      );
      return {
        ...group,
        percent: possible ? round((earned / possible) * 100) : null,
        itemCount: groupRows.length,
      };
    });
  }, [course, selectedGroups, simRows]);

  return (
    <Screen>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Grades</Text>
        <Text style={[s.sub, { color: colors.muted }]}> 
          {connected
            ? 'Canvas grades, assignment weights, and private What-If projections.'
            : 'Connect Canvas to see your grades.'}
        </Text>
      </View>

      <View style={s.grid}>
        {courses.map((c, index) => {
          const rows = grades.filter(
            (grade) => String(grade.courseId) === String(c.id) && !grade.excused,
          );
          const courseAssignments = assignments.filter(
            (assignment) =>
              String(assignment.courseId) === String(c.id) &&
              !assignment.omitFromFinalGrade,
          );
          const gradeByAssignment = new Map(
            rows.map((grade) => [String(grade.assignmentId), grade]),
          );
          const currentRows: SimRow[] = courseAssignments.map((assignment) => ({
            assignment,
            grade: gradeByAssignment.get(String(assignment.id)),
            score: gradeByAssignment.get(String(assignment.id))?.score ?? null,
          }));
          const groups = assignmentGroups.filter(
            (group) => String(group.courseId) === String(c.id),
          );
          const fallback = scoreRows(c, currentRows, groups);
          const score = c.currentScore ?? fallback;
          const letter = c.currentGrade || letterFor(c, score);
          const weighted = !!c.applyAssignmentGroupWeights && groups.some((g) => g.weight > 0);
          return (
            <Animated.View
              key={String(c.id)}
              entering={FadeInDown.delay(index * 35).duration(260)}
              layout={Layout.springify().damping(22).stiffness(260)}
              style={[
                s.courseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={s.courseHead}>
                <View style={[s.icon, { backgroundColor: colors.accentSoft }]}> 
                  <GraduationCap size={19} color={colors.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={[s.code, { color: colors.muted }]}> 
                    {c.courseCode || 'Canvas course'}
                  </Text>
                  <Text numberOfLines={2} style={[s.courseName, { color: colors.text }]}> 
                    {c.name}
                  </Text>
                </View>
                <View style={s.score}>
                  <Text style={[s.scoreNumber, { color: colors.text }]}> 
                    {score != null ? `${round(score)}%` : '—'}
                  </Text>
                  <View style={[s.letterPill, { backgroundColor: colors.accentSoft }]}> 
                    <Text style={[s.letter, { color: colors.accent }]}>{letter || '—'}</Text>
                  </View>
                </View>
              </View>
              <View style={s.cardBottom}>
                <View>
                  <Text style={[s.metaStrong, { color: colors.text }]}> 
                    {weighted ? `${groups.filter((g) => g.weight > 0).length} weighted groups` : 'Points-based grading'}
                  </Text>
                  <Text style={[s.meta, { color: colors.muted }]}> 
                    {rows.length} graded item{rows.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => simulate(c)}
                  style={({ hovered, pressed }: any) => [
                    s.whatIf,
                    { backgroundColor: colors.accentSoft },
                    hovered && s.hoverLift,
                    pressed && s.pressDown,
                  ]}
                >
                  <Calculator size={14} color={colors.accent} />
                  <Text style={[s.whatIfText, { color: colors.accent }]}>What-If</Text>
                </Pressable>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Text style={[s.section, { color: colors.text }]}>Graded work</Text>
      {grades.map((grade, index) => {
        const c = courses.find((item) => String(item.id) === String(grade.courseId));
        return (
          <Animated.View
            key={grade.id}
            entering={FadeInDown.delay(Math.min(index, 8) * 18).duration(220)}
            style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[s.status, { backgroundColor: colors.accentSoft }]}> 
              <CheckCircle2 size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[s.assignment, { color: colors.text }]}> 
                {grade.name}
              </Text>
              <Text numberOfLines={1} style={[s.meta, { color: colors.muted }]}> 
                {c?.courseCode || c?.name || 'Canvas'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.points, { color: colors.text }]}> 
                {grade.excused
                  ? 'Excused'
                  : grade.score != null
                    ? `${grade.score}${grade.pointsPossible != null ? ` / ${grade.pointsPossible}` : ''}`
                    : grade.grade || '—'}
              </Text>
              {grade.grade ? (
                <Text style={[s.gradeLetter, { color: colors.accent }]}>{grade.grade}</Text>
              ) : null}
            </View>
          </Animated.View>
        );
      })}

      <Modal
        transparent
        visible={!!course}
        animationType="fade"
        onRequestClose={() => setCourse(null)}
      >
        <View style={s.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCourse(null)} />
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={[s.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={s.modalHead}>
              <View style={[s.calcIcon, { backgroundColor: colors.accentSoft }]}> 
                <Calculator size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.modalTitle, { color: colors.text }]}>What-If Grades</Text>
                <Text numberOfLines={1} style={[s.meta, { color: colors.muted }]}> 
                  {course?.courseCode || course?.name}
                </Text>
              </View>
              <Pressable onPress={() => setCourse(null)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={[s.projection, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View>
                <Text style={[s.projectionLabel, { color: colors.muted }]}>CURRENT</Text>
                <View style={s.scoreLine}>
                  <Text style={[s.bigScore, { color: colors.text }]}> 
                    {course?.currentScore != null ? `${round(course.currentScore)}%` : '—'}
                  </Text>
                  {course?.currentGrade ? (
                    <View style={[s.bigLetterPill, { backgroundColor: colors.accentSoft }]}> 
                      <Text style={[s.bigLetter, { color: colors.accent }]}>{course.currentGrade}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={[s.arrow, { color: colors.muted }]}>→</Text>
              <View>
                <Text style={[s.projectionLabel, { color: colors.muted }]}>WHAT-IF</Text>
                <View style={s.scoreLine}>
                  <Text style={[s.bigScore, { color: colors.accent }]}> 
                    {projected != null ? `${projected}%` : '—'}
                  </Text>
                  {projectedLetter ? (
                    <View style={[s.bigLetterPill, { backgroundColor: colors.accentSoft }]}> 
                      <Text style={[s.bigLetter, { color: colors.accent }]}>{projectedLetter}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {projected != null && course?.currentScore != null ? (
                <Text
                  style={[
                    s.delta,
                    { color: projected >= course.currentScore ? colors.accent : colors.danger },
                  ]}
                >
                  {projected >= course.currentScore ? '+' : ''}
                  {round(projected - course.currentScore)}%
                </Text>
              ) : null}
            </View>

            <View style={s.infoRow}>
              <Sparkles size={14} color={colors.accent} />
              <Text style={[s.hint, { color: colors.muted }]}> 
                {course?.applyAssignmentGroupWeights
                  ? 'Using Canvas assignment-group weights and drop rules where available.'
                  : 'Using points earned ÷ points possible for this course.'}
                {course?.gradingScheme?.length
                  ? ' Letter grades use the Canvas grading scheme.'
                  : ''}
              </Text>
            </View>

            {groupStats.some((group) => group.weight > 0) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.weightStrip}>
                {groupStats
                  .filter((group) => group.weight > 0)
                  .map((group) => (
                    <View
                      key={group.id}
                      style={[s.weightCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <View style={s.weightTop}>
                        <Text numberOfLines={1} style={[s.weightName, { color: colors.text }]}>{group.name}</Text>
                        <Text style={[s.weightValue, { color: colors.accent }]}>{round(group.weight)}%</Text>
                      </View>
                      <View style={[s.track, { backgroundColor: colors.border }]}> 
                        <View
                          style={[
                            s.fill,
                            {
                              backgroundColor: colors.accent,
                              width: `${clamp(group.percent || 0)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[s.weightMeta, { color: colors.muted }]}> 
                        {group.percent != null ? `${group.percent}% now` : 'No graded items yet'} · {group.itemCount} item{group.itemCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                  ))}
              </ScrollView>
            ) : null}

            <ScrollView style={s.scroll} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {selectedAssignments.map((assignment) => {
                const grade = selectedGrades.find(
                  (item) => String(item.assignmentId) === String(assignment.id),
                );
                const group = selectedGroups.find(
                  (item) => String(item.id) === String(assignment.assignmentGroupId),
                );
                return (
                  <View
                    key={String(assignment.id)}
                    style={[s.simRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={[s.assignment, { color: colors.text }]}> 
                        {assignment.name}
                      </Text>
                      <Text style={[s.meta, { color: colors.muted }]}> 
                        {group?.name || 'Ungrouped'}
                        {group?.weight ? ` · ${round(group.weight)}% weight` : ''}
                        {grade?.score != null ? ` · ${grade.score} currently` : ' · ungraded'}
                      </Text>
                    </View>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={changes[String(assignment.id)] ?? ''}
                      onChangeText={(value) =>
                        setChanges((old) => ({
                          ...old,
                          [String(assignment.id)]: value.replace(/[^0-9.]/g, ''),
                        }))
                      }
                      placeholder={grade?.score != null ? String(grade.score) : 'Try'}
                      placeholderTextColor={colors.muted}
                      style={[
                        s.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    />
                    <Text style={[s.outOf, { color: colors.muted }]}>/ {assignment.pointsPossible ?? '—'}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={[s.modalFooter, { borderTopColor: colors.border }]}> 
              <Pressable onPress={() => setChanges({})} style={s.reset}>
                <RotateCcw size={14} color={colors.muted} />
                <Text style={[s.resetText, { color: colors.muted }]}>Reset</Text>
              </Pressable>
              <Text style={[s.private, { color: colors.muted }]}>Simulation only · nothing is sent to Canvas</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { marginTop: 14 },
  title: { fontSize: 30, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 5, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  courseCard: {
    minWidth: 270,
    flexGrow: 1,
    flexBasis: 310,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
  },
  courseHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  code: { fontSize: 10, fontWeight: '800' },
  courseName: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  score: { alignItems: 'flex-end', paddingLeft: 8, gap: 4 },
  scoreNumber: { fontSize: 20, fontWeight: '900' },
  letterPill: { minWidth: 31, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  letter: { fontSize: 11, fontWeight: '900' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  metaStrong: { fontSize: 11, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 3 },
  whatIf: { height: 32, borderRadius: 10, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  whatIfText: { fontSize: 11, fontWeight: '800' },
  hoverLift: { transform: [{ translateY: -2 }, { scale: 1.02 }] },
  pressDown: { transform: [{ translateY: 1 }, { scale: 0.98 }] },
  section: { fontSize: 19, fontWeight: '800', marginTop: 28, marginBottom: 11 },
  row: { minHeight: 60, borderWidth: 1, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  status: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  assignment: { fontSize: 13, fontWeight: '800' },
  points: { fontSize: 13, fontWeight: '800' },
  gradeLetter: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,24,19,.34)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 720, maxHeight: '88%', borderWidth: 1, borderRadius: 24, overflow: 'hidden', paddingTop: 20 },
  modalHead: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20 },
  calcIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  projection: { margin: 18, borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 18 },
  projectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  scoreLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  bigScore: { fontSize: 24, fontWeight: '900' },
  bigLetterPill: { minWidth: 36, height: 25, borderRadius: 999, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  bigLetter: { fontSize: 12, fontWeight: '900' },
  arrow: { fontSize: 20 },
  delta: { fontSize: 12, fontWeight: '800', marginLeft: 'auto' },
  infoRow: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  hint: { flex: 1, fontSize: 11, lineHeight: 16 },
  weightStrip: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  weightCard: { width: 190, borderWidth: 1, borderRadius: 13, padding: 11 },
  weightTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightName: { flex: 1, fontSize: 11, fontWeight: '800' },
  weightValue: { fontSize: 11, fontWeight: '900' },
  track: { height: 5, borderRadius: 999, overflow: 'hidden', marginTop: 9 },
  fill: { height: '100%', borderRadius: 999 },
  weightMeta: { fontSize: 9, marginTop: 7 },
  scroll: { paddingHorizontal: 20, flexShrink: 1 },
  simRow: { minHeight: 62, borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { width: 76, height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  outOf: { fontSize: 11, minWidth: 34 },
  modalFooter: { borderTopWidth: 1, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: { fontSize: 11, fontWeight: '800' },
  private: { fontSize: 10 },
});
