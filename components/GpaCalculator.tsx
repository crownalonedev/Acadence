import { useEffect, useMemo, useState } from 'react';
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
  GraduationCap,
  History,
  Plus,
  RotateCcw,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react-native';
import type { SyncedCourse } from '@/context/CanvasDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { letterForScore } from '@/utils/grading';

const GPA_POINTS: Record<string, number> = {
  'A+': 4,
  A: 4,
  'A-': 3.67,
  'B+': 3.33,
  B: 3,
  'B-': 2.67,
  'C+': 2.33,
  C: 2,
  'C-': 1.67,
  'D+': 1.33,
  D: 1,
  'D-': 0.67,
  F: 0,
};

const GRADE_OPTIONS = Object.keys(GPA_POINTS);

type GpaRow = {
  id: string;
  name: string;
  grade: string;
  credits: string;
  source: 'current' | 'previous' | 'manual';
  term?: string | null;
};

type GpaResult = {
  credits: number;
  qualityPoints: number;
  included: number;
  gpa: number | null;
};

function normalizeGrade(value: string) {
  return value.trim().toUpperCase().replace(/[^A-F+-]/g, '').slice(0, 2);
}

function courseGrade(course: SyncedCourse, previous: boolean) {
  const direct = normalizeGrade(
    previous
      ? course.finalGrade || course.currentGrade || ''
      : course.currentGrade || course.finalGrade || '',
  );
  if (GPA_POINTS[direct] != null) return direct;

  const score = previous
    ? course.finalScore ?? course.currentScore
    : course.currentScore ?? course.finalScore;
  const inferred = letterForScore(score, course).letter || '';
  return normalizeGrade(inferred);
}

function courseRow(course: SyncedCourse, source: 'current' | 'previous'): GpaRow {
  return {
    id: `${source}-${course.id}`,
    name: course.courseCode || course.name || 'Course',
    grade: courseGrade(course, source === 'previous'),
    credits: '3',
    source,
    term: course.termName,
  };
}

function seedRows(currentCourses: SyncedCourse[], historicalCourses: SyncedCourse[]) {
  const current = currentCourses.map((course) => courseRow(course, 'current'));
  const activeIds = new Set(currentCourses.map((course) => String(course.id)));
  const previous = historicalCourses
    .filter((course) => !activeIds.has(String(course.id)))
    .map((course) => courseRow(course, 'previous'));
  return [...current, ...previous];
}

function calculate(rows: GpaRow[]): GpaResult {
  let credits = 0;
  let qualityPoints = 0;
  let included = 0;
  for (const row of rows) {
    const grade = normalizeGrade(row.grade);
    const points = GPA_POINTS[grade];
    const hours = Number(row.credits);
    if (points == null || !Number.isFinite(hours) || hours <= 0) continue;
    credits += hours;
    qualityPoints += points * hours;
    included += 1;
  }
  return {
    credits,
    qualityPoints,
    included,
    gpa: credits > 0 ? qualityPoints / credits : null,
  };
}

export function GpaCalculator({
  courses,
  historicalCourses,
}: {
  courses: SyncedCourse[];
  historicalCourses: SyncedCourse[];
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<GpaRow[]>(() => seedRows(courses, historicalCourses));

  useEffect(() => {
    if (!open) setRows(seedRows(courses, historicalCourses));
  }, [courses, historicalCourses, open]);

  const currentRows = useMemo(
    () => rows.filter((row) => row.source === 'current'),
    [rows],
  );
  const previousRows = useMemo(
    () => rows.filter((row) => row.source !== 'current'),
    [rows],
  );
  const currentResult = useMemo(() => calculate(currentRows), [currentRows]);
  const previousResult = useMemo(() => calculate(previousRows), [previousRows]);
  const cumulativeResult = useMemo(() => calculate(rows), [rows]);

  const updateRow = (id: string, patch: Partial<GpaRow>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addPriorCourse = () =>
    setRows((current) => [
      ...current,
      {
        id: `manual-${Date.now()}-${current.length}`,
        name: '',
        grade: '',
        credits: '3',
        source: 'manual',
        term: 'Previous course',
      },
    ]);

  const removeRow = (id: string) =>
    setRows((current) => current.filter((row) => row.id !== id));

  const reset = () => setRows(seedRows(courses, historicalCourses));
  const fmt = (value: number | null) => (value == null ? '—' : value.toFixed(2));

  const CourseRow = ({ row }: { row: GpaRow }) => {
    const validGrade = GPA_POINTS[normalizeGrade(row.grade)] != null;
    return (
      <View style={[s.row, { backgroundColor: colors.background, borderColor: colors.border }]}> 
        <View style={{ flex: 1, minWidth: 120 }}>
          <TextInput
            value={row.name}
            onChangeText={(name) => updateRow(row.id, { name })}
            placeholder="Course name"
            placeholderTextColor={colors.muted}
            style={[s.nameInput, { color: colors.text }]}
          />
          {row.term ? (
            <Text numberOfLines={1} style={[s.term, { color: colors.muted }]}>{row.term}</Text>
          ) : null}
        </View>
        <TextInput
          value={row.grade}
          onChangeText={(grade) => updateRow(row.id, { grade: normalizeGrade(grade) })}
          autoCapitalize="characters"
          placeholder="A-"
          placeholderTextColor={colors.muted}
          style={[
            s.gradeInput,
            {
              color: validGrade || !row.grade ? colors.text : colors.danger,
              borderColor: validGrade || !row.grade ? colors.border : colors.danger,
              backgroundColor: colors.surface,
            },
          ]}
        />
        <TextInput
          value={row.credits}
          onChangeText={(credits) =>
            updateRow(row.id, {
              credits: credits.replace(/[^0-9.]/g, '').slice(0, 4),
            })
          }
          keyboardType="decimal-pad"
          placeholder="3"
          placeholderTextColor={colors.muted}
          style={[s.creditInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
        <Text style={[s.creditLabel, { color: colors.muted }]}>cr</Text>
        {row.source === 'manual' ? (
          <Pressable accessibilityLabel={`Remove ${row.name || 'course'}`} onPress={() => removeRow(row.id)} style={s.trash}>
            <Trash2 size={16} color={colors.muted} />
          </Pressable>
        ) : (
          <View style={s.trash} />
        )}
      </View>
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open GPA calculator"
        onPress={() => setOpen(true)}
        style={({ hovered, pressed }: any) => [
          s.launch,
          { backgroundColor: colors.surface, borderColor: colors.border },
          hovered && { transform: [{ translateY: -2 }] },
          pressed && { transform: [{ translateY: 1 }, { scale: 0.99 }] },
        ]}
      >
        <View style={[s.launchIcon, { backgroundColor: colors.accentSoft }]}>
          <GraduationCap size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.launchTitle, { color: colors.text }]}>GPA Calculator</Text>
          <Text style={[s.launchCopy, { color: colors.muted }]}>Uses current Canvas grades plus {historicalCourses.length} previous course{historicalCourses.length === 1 ? '' : 's'}.</Text>
        </View>
        <View style={s.launchStats}>
          <View style={[s.miniStat, { backgroundColor: colors.accentSoft }]}>
            <Text style={[s.miniLabel, { color: colors.accent }]}>CURRENT</Text>
            <Text style={[s.miniValue, { color: colors.text }]}>{fmt(currentResult.gpa)}</Text>
          </View>
          <View style={[s.miniStat, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[s.miniLabel, { color: colors.muted }]}>CUMULATIVE</Text>
            <Text style={[s.miniValue, { color: colors.text }]}>{fmt(cumulativeResult.gpa)}</Text>
          </View>
        </View>
        <View style={[s.launchButton, { backgroundColor: colors.accentSoft }]}>
          <Calculator size={14} color={colors.accent} />
          <Text style={[s.launchButtonText, { color: colors.accent }]}>Details</Text>
        </View>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={s.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[s.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={s.head}>
              <View style={[s.modalIcon, { backgroundColor: colors.accentSoft }]}>
                <GraduationCap size={21} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: colors.text }]}>GPA Calculator</Text>
                <Text style={[s.sub, { color: colors.muted }]}>Current GPA uses this semester. Cumulative GPA uses current + previous Canvas courses.</Text>
              </View>
              <Pressable accessibilityLabel="Close GPA calculator" onPress={() => setOpen(false)} style={s.close}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={s.heroRow}>
              <View style={[s.hero, { backgroundColor: colors.accentSoft }]}> 
                <Text style={[s.eyebrow, { color: colors.accent }]}>CURRENT GPA</Text>
                <Text style={[s.gpa, { color: colors.text }]}>{fmt(currentResult.gpa)}</Text>
                <Text style={[s.heroMeta, { color: colors.muted }]}>{currentResult.credits ? `${currentResult.credits} credits · ${currentResult.included} current course${currentResult.included === 1 ? '' : 's'}` : 'Waiting for current course grades'}</Text>
              </View>
              <View style={[s.hero, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}> 
                <View style={s.trendRow}><TrendingUp size={14} color={colors.accent} /><Text style={[s.eyebrow, { color: colors.muted }]}>CUMULATIVE GPA</Text></View>
                <Text style={[s.gpa, { color: colors.text }]}>{fmt(cumulativeResult.gpa)}</Text>
                <Text style={[s.heroMeta, { color: colors.muted }]}>{cumulativeResult.credits ? `${cumulativeResult.credits} total credits · ${cumulativeResult.included} courses` : 'Sync Canvas course history to calculate'}</Text>
              </View>
              <View style={[s.hero, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}> 
                <View style={s.trendRow}><History size={14} color={colors.accent} /><Text style={[s.eyebrow, { color: colors.muted }]}>PREVIOUS COURSES</Text></View>
                <Text style={[s.gpaSmall, { color: colors.text }]}>{fmt(previousResult.gpa)}</Text>
                <Text style={[s.heroMeta, { color: colors.muted }]}>{previousResult.included} previous course{previousResult.included === 1 ? '' : 's'} included</Text>
              </View>
            </View>

            <Text style={[s.help, { color: colors.muted }]}>Canvas provides the course grades, but usually does not provide university credit hours. Acadence defaults each course to 3 credits; adjust the credit field for accurate weighted GPA. Current grades can still change, so cumulative GPA is projected until the term is finalized.</Text>

            <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={s.sectionHead}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Current semester</Text>
                <Text style={[s.sectionCount, { color: colors.muted }]}>{currentRows.length}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {currentRows.length ? currentRows.map((row) => <CourseRow key={row.id} row={row} />) : (
                  <View style={[s.empty, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[s.emptyText, { color: colors.muted }]}>No current courses with GPA data yet.</Text></View>
                )}
              </View>

              <View style={[s.sectionHead, { marginTop: 20 }]}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Previous courses</Text>
                <Text style={[s.sectionCount, { color: colors.muted }]}>{previousRows.length}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {previousRows.length ? previousRows.map((row) => <CourseRow key={row.id} row={row} />) : (
                  <View style={[s.empty, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[s.emptyText, { color: colors.muted }]}>No prior Canvas courses have synced yet. Reload the extension and sync once.</Text></View>
                )}
              </View>
              <Pressable onPress={addPriorCourse} style={[s.add, { borderColor: colors.border }]}> 
                <Plus size={15} color={colors.accent} />
                <Text style={[s.addText, { color: colors.accent }]}>Add a previous course manually</Text>
              </Pressable>
            </ScrollView>

            <View style={[s.footer, { borderTopColor: colors.border }]}> 
              <Pressable onPress={reset} style={s.reset}>
                <RotateCcw size={14} color={colors.muted} />
                <Text style={[s.resetText, { color: colors.muted }]}>Reset from Canvas</Text>
              </Pressable>
              <Text style={[s.disclaimer, { color: colors.muted }]}>Common 4.0 scale · {GRADE_OPTIONS.join(' / ')}</Text>
              <Pressable onPress={() => setOpen(false)} style={[s.done, { backgroundColor: colors.accent }]}> 
                <Text style={s.doneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  launch: { minHeight: 88, borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  launchIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  launchTitle: { fontSize: 15, fontWeight: '900' },
  launchCopy: { fontSize: 11, marginTop: 3 },
  launchStats: { flexDirection: 'row', gap: 7 },
  miniStat: { minWidth: 86, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  miniLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  miniValue: { fontSize: 17, fontWeight: '900', marginTop: 1 },
  launchButton: { height: 34, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  launchButtonText: { fontSize: 11, fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,24,19,.36)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 900, maxHeight: '92%', borderWidth: 1, borderRadius: 22, overflow: 'hidden', paddingTop: 20 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20 },
  modalIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  sub: { fontSize: 11, marginTop: 3 },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 18 },
  hero: { flexGrow: 1, flexBasis: 210, minWidth: 190, borderRadius: 16, padding: 16 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  gpa: { fontSize: 34, fontWeight: '900', marginTop: 3 },
  gpaSmall: { fontSize: 28, fontWeight: '900', marginTop: 3 },
  heroMeta: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  help: { fontSize: 10, lineHeight: 15, paddingHorizontal: 20, marginTop: 12, marginBottom: 10 },
  scroll: { paddingHorizontal: 20, flexShrink: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '900' },
  sectionCount: { fontSize: 10, fontWeight: '900' },
  row: { minHeight: 58, borderWidth: 1, borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  nameInput: { height: 32, paddingHorizontal: 5, fontSize: 12, fontWeight: '800' },
  term: { fontSize: 9, marginLeft: 5, marginTop: -2 },
  gradeInput: { width: 62, height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, textAlign: 'center', fontSize: 13, fontWeight: '900' },
  creditInput: { width: 58, height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, textAlign: 'right', fontSize: 12, fontWeight: '800' },
  creditLabel: { fontSize: 10 },
  trash: { width: 30, height: 34, alignItems: 'center', justifyContent: 'center' },
  add: { minHeight: 42, marginTop: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addText: { fontSize: 11, fontWeight: '900' },
  empty: { borderWidth: 1, borderRadius: 12, padding: 14 },
  emptyText: { fontSize: 11 },
  footer: { borderTopWidth: 1, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: { fontSize: 11, fontWeight: '800' },
  disclaimer: { fontSize: 9, flex: 1, textAlign: 'center' },
  done: { minWidth: 72, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  doneText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});
