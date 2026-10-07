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
import Animated, { Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { GpaCalculator } from '@/components/GpaCalculator';
import { SyncedCourse, useCanvasData } from '@/context/CanvasDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { calculateGrade, effectiveWeights, letterForScore } from '@/utils/grading';
import { radius } from '@/constants/theme';

const round = (n: number) => Math.round(n * 10) / 10;

export default function Grades() {
  const { courses, historicalCourses, assignments, grades, assignmentGroups, connected } = useCanvasData();
  const { colors } = useAppTheme();
  const [course, setCourse] = useState<SyncedCourse | null>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});

  const simulate = (c: SyncedCourse) => {
    setCourse(c);
    setChanges({});
  };

  const courseAssignments = useMemo(
    () =>
      course
        ? assignments.filter(
            (a) =>
              String(a.courseId) === String(course.id) &&
              !a.excused &&
              !a.omitFromFinalGrade,
          )
        : [],
    [assignments, course],
  );
  const courseGrades = useMemo(
    () =>
      course
        ? grades.filter((g) => String(g.courseId) === String(course.id) && !g.excused)
        : [],
    [grades, course],
  );
  const gradeByAssignment = useMemo(
    () => new Map(courseGrades.map((g) => [String(g.assignmentId), g])),
    [courseGrades],
  );

  const projected = useMemo(() => {
    if (!course) return null;
    const rows = courseAssignments.map((a) => {
      const grade = gradeByAssignment.get(String(a.id));
      const raw = changes[String(a.id)];
      const sim = raw !== undefined && raw !== '' ? Number(raw) : grade?.score;
      return {
        id: String(a.id),
        assignmentGroupId: a.assignmentGroupId,
        score: Number.isFinite(Number(sim)) ? Number(sim) : null,
        pointsPossible: a.pointsPossible,
        excused: a.excused,
        omitFromFinalGrade: a.omitFromFinalGrade,
      };
    });
    return calculateGrade(course, rows, assignmentGroups);
  }, [course, courseAssignments, gradeByAssignment, changes, assignmentGroups]);

  const projectedLetter = course && projected?.percent != null
    ? letterForScore(projected.percent, course)
    : { letter: undefined, estimated: false, source: 'none' as const };

  return (
    <Screen>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Grades</Text>
          <Text style={[s.sub, { color: colors.muted }]}> 
            {connected
              ? 'Modern grade summaries, category weights and private What-If simulations.'
              : 'Connect Canvas to see your grades.'}
          </Text>
        </View>
      </View>

      <GpaCalculator courses={courses} historicalCourses={historicalCourses} />

      <View style={s.grid}>
        {courses.map((c) => {
          const rows = grades.filter((g) => String(g.courseId) === String(c.id) && !g.excused);
          const actual = calculateGrade(
            c,
            rows.map((g) => ({
              id: String(g.assignmentId),
              assignmentGroupId: g.assignmentGroupId,
              score: g.score,
              pointsPossible: g.pointsPossible,
              excused: g.excused,
              omitFromFinalGrade: g.omitFromFinalGrade,
            })),
            assignmentGroups,
          );
          const score = c.currentScore ?? actual.percent;
          const inferred = letterForScore(score, c);
          const letter = c.currentGrade || inferred.letter;
          const weights = effectiveWeights(c, assignmentGroups);

          return (
            <Animated.View
              key={String(c.id)}
              layout={Layout.springify().damping(22).stiffness(280)}
              style={[s.courseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={s.courseHead}>
                <View style={[s.icon, { backgroundColor: colors.accentSoft }]}> 
                  <GraduationCap size={19} color={colors.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={[s.code, { color: colors.muted }]}>{c.courseCode || 'Canvas course'}</Text>
                  <Text numberOfLines={2} style={[s.courseName, { color: colors.text }]}>{c.name}</Text>
                </View>
                <View style={s.scoreBlock}>
                  <Text style={[s.scoreNumber, { color: colors.text }]}>{score != null ? `${round(score)}%` : '—'}</Text>
                  {letter ? (
                    <View style={[s.letterPill, { backgroundColor: colors.accentSoft }]}> 
                      <Text style={[s.letter, { color: colors.accent }]}>{letter}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={s.weightPreview}>
                {weights.length ? (
                  weights.slice(0, 4).map((weight) => (
                    <View key={weight.id} style={[s.weightChip, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                      <Text numberOfLines={1} style={[s.weightChipName, { color: colors.muted }]}>{weight.name}</Text>
                      <Text style={[s.weightChipValue, { color: colors.text }]}>{weight.weight}%</Text>
                    </View>
                  ))
                ) : (
                  <View style={[s.weightChip, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                    <Text style={[s.weightChipName, { color: colors.muted }]}>Grade method</Text>
                    <Text style={[s.weightChipValue, { color: colors.text }]}>Points</Text>
                  </View>
                )}
              </View>

              <View style={s.cardBottom}>
                <View>
                  <Text style={[s.meta, { color: colors.muted }]}>{rows.length} graded item{rows.length === 1 ? '' : 's'}</Text>
                  {weights.length ? <Text style={[s.meta, { color: colors.muted }]}>{weights[0].source === 'canvas' ? 'Canvas weights' : 'Weights matched from syllabus'}</Text> : null}
                </View>
                <Pressable
                  onPress={() => simulate(c)}
                  style={({ hovered, pressed }: any) => [
                    s.whatIf,
                    { backgroundColor: colors.accentSoft },
                    hovered && { transform: [{ translateY: -1 }] },
                    pressed && { transform: [{ translateY: 1 }] },
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

      <View style={s.sectionHead}>
        <Text style={[s.section, { color: colors.text }]}>Recent graded work</Text>
        <View style={[s.sectionIcon, { backgroundColor: colors.accentSoft }]}><Sparkles size={14} color={colors.accent} /></View>
      </View>
      {grades
        .slice()
        .sort((a, b) => new Date(b.gradedAt || 0).getTime() - new Date(a.gradedAt || 0).getTime())
        .map((g) => {
          const c = courses.find((x) => String(x.id) === String(g.courseId));
          const pct = g.score != null && g.pointsPossible ? round((Number(g.score) / Number(g.pointsPossible)) * 100) : null;
          return (
            <View key={g.id} style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={[s.status, { backgroundColor: colors.accentSoft }]}><CheckCircle2 size={16} color={colors.accent} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[s.assignment, { color: colors.text }]}>{g.name}</Text>
                <Text numberOfLines={1} style={[s.meta, { color: colors.muted }]}>{c?.courseCode || c?.name || 'Canvas'}{g.gradedAt ? ` · ${new Date(g.gradedAt).toLocaleDateString()}` : ''}</Text>
              </View>
              <View style={s.pointsBlock}>
                <Text style={[s.points, { color: colors.text }]}>{g.excused ? 'Excused' : g.score != null ? `${g.score}${g.pointsPossible != null ? ` / ${g.pointsPossible}` : ''}` : g.grade || '—'}</Text>
                {pct != null ? <Text style={[s.meta, { color: colors.accent }]}>{pct}%</Text> : null}
              </View>
            </View>
          );
        })}

      <Modal transparent visible={!!course} animationType="fade" onRequestClose={() => setCourse(null)}>
        <View style={s.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCourse(null)} />
          <View style={[s.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={s.modalHead}>
              <View style={[s.calcIcon, { backgroundColor: colors.accentSoft }]}><Calculator size={20} color={colors.accent} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.modalTitle, { color: colors.text }]}>What-If Grades</Text>
                <Text numberOfLines={1} style={[s.meta, { color: colors.muted }]}>{course?.courseCode || course?.name}</Text>
              </View>
              <Pressable onPress={() => setCourse(null)}><X size={20} color={colors.muted} /></Pressable>
            </View>

            <View style={[s.projection, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View>
                <Text style={[s.projectionLabel, { color: colors.muted }]}>CURRENT</Text>
                <Text style={[s.bigScore, { color: colors.text }]}>{course?.currentScore != null ? `${round(course.currentScore)}%` : '—'}</Text>
                {course?.currentGrade ? <Text style={[s.projectionLetter, { color: colors.accent }]}>{course.currentGrade}</Text> : null}
              </View>
              <Text style={[s.arrow, { color: colors.muted }]}>→</Text>
              <View>
                <Text style={[s.projectionLabel, { color: colors.muted }]}>WHAT-IF</Text>
                <Text style={[s.bigScore, { color: colors.accent }]}>{projected?.percent != null ? `${projected.percent}%` : '—'}</Text>
                {projectedLetter.letter ? <Text style={[s.projectionLetter, { color: colors.accent }]}>{projectedLetter.estimated ? '~' : ''}{projectedLetter.letter}</Text> : null}
              </View>
              {projected?.percent != null && course?.currentScore != null ? (
                <Text style={[s.delta, { color: projected.percent >= course.currentScore ? colors.accent : colors.danger }]}> 
                  {projected.percent >= course.currentScore ? '+' : ''}{round(projected.percent - course.currentScore)}%
                </Text>
              ) : null}
            </View>

            <View style={[s.modalWeights, { borderColor: colors.border }]}> 
              <Text style={[s.modalWeightsTitle, { color: colors.text }]}>Grade weights</Text>
              {course && effectiveWeights(course, assignmentGroups).length ? (
                effectiveWeights(course, assignmentGroups).map((weight) => (
                  <View key={weight.id} style={s.modalWeightRow}>
                    <Text style={[s.modalWeightName, { color: colors.muted }]}>{weight.name}</Text>
                    <View style={[s.modalWeightTrack, { backgroundColor: colors.accentSoft }]}><View style={[s.modalWeightFill, { width: `${Math.min(100, weight.weight)}%`, backgroundColor: colors.accent }]} /></View>
                    <Text style={[s.modalWeightValue, { color: colors.text }]}>{weight.weight}%</Text>
                  </View>
                ))
              ) : <Text style={[s.hint, { color: colors.muted }]}>Points earned ÷ points possible.</Text>}
            </View>

            <Text style={[s.hint, { color: colors.muted }]}>Enter a score for any assignment to preview the overall grade. Ungraded assignments do not count until you enter a What-If score. {projectedLetter.estimated ? 'A ~ before the letter means the scale was inferred from the syllabus or a standard estimate.' : ''}</Text>

            <ScrollView style={s.scroll} contentContainerStyle={{ gap: 7 }}>
              {courseAssignments.map((a) => {
                const g = gradeByAssignment.get(String(a.id));
                return (
                  <View key={String(a.id)} style={[s.simRow, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={[s.assignment, { color: colors.text }]}>{a.name}</Text>
                      <Text style={[s.meta, { color: colors.muted }]}>{g?.score ?? 'Not graded'} / {a.pointsPossible ?? '—'}{a.assignmentGroupId ? ` · ${assignmentGroups.find((group) => String(group.id) === String(a.assignmentGroupId))?.name || 'Group'}` : ''}</Text>
                    </View>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={changes[String(a.id)] ?? ''}
                      onChangeText={(v) => setChanges((x) => ({ ...x, [String(a.id)]: v.replace(/[^0-9.]/g, '') }))}
                      placeholder={g?.score != null ? String(g.score) : 'Score'}
                      placeholderTextColor={colors.muted}
                      style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                    />
                    <Text style={[s.outOf, { color: colors.muted }]}>/ {a.pointsPossible ?? '—'}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={[s.modalFooter, { borderTopColor: colors.border }]}> 
              <Pressable onPress={() => setChanges({})} style={s.reset}><RotateCcw size={14} color={colors.muted} /><Text style={[s.resetText, { color: colors.muted }]}>Reset</Text></Pressable>
              <Text style={[s.private, { color: colors.muted }]}>Simulation only · nothing is sent to Canvas</Text>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { marginTop: 14 },
  title: { fontSize: 30, fontWeight: '900' },
  sub: { fontSize: 14, marginTop: 5, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  courseCard: { minWidth: 300, flexGrow: 1, flexBasis: 350, borderWidth: 1, borderRadius: 18, padding: 17 },
  courseHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  code: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  courseName: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  scoreBlock: { alignItems: 'flex-end', paddingLeft: 8 },
  scoreNumber: { fontSize: 23, fontWeight: '900' },
  letterPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  letter: { fontSize: 11, fontWeight: '900' },
  weightPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  weightChip: { minWidth: 88, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  weightChipName: { fontSize: 9, fontWeight: '800' },
  weightChipValue: { fontSize: 12, fontWeight: '900', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  meta: { fontSize: 10, marginTop: 2 },
  whatIf: { height: 32, borderRadius: 10, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  whatIfText: { fontSize: 11, fontWeight: '900' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 30, marginBottom: 11 },
  section: { fontSize: 20, fontWeight: '900' },
  sectionIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 64, borderWidth: 1, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  status: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  assignment: { fontSize: 13, fontWeight: '900' },
  pointsBlock: { alignItems: 'flex-end' },
  points: { fontSize: 13, fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,24,19,.34)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 720, maxHeight: '88%', borderWidth: 1, borderRadius: 22, overflow: 'hidden', paddingTop: 20 },
  modalHead: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20 },
  calcIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  projection: { margin: 18, borderWidth: 1, borderRadius: 15, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 18 },
  projectionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  bigScore: { fontSize: 26, fontWeight: '900', marginTop: 2 },
  projectionLetter: { fontSize: 13, fontWeight: '900', marginTop: 2 },
  arrow: { fontSize: 20 },
  delta: { fontSize: 12, fontWeight: '900', marginLeft: 'auto' },
  modalWeights: { marginHorizontal: 18, borderWidth: 1, borderRadius: 14, padding: 13 },
  modalWeightsTitle: { fontSize: 12, fontWeight: '900', marginBottom: 7 },
  modalWeightRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalWeightName: { width: 120, fontSize: 10, fontWeight: '800' },
  modalWeightTrack: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  modalWeightFill: { height: '100%', borderRadius: 999 },
  modalWeightValue: { width: 38, textAlign: 'right', fontSize: 10, fontWeight: '900' },
  hint: { fontSize: 11, lineHeight: 16, paddingHorizontal: 20, marginTop: 12, marginBottom: 12 },
  scroll: { paddingHorizontal: 20, flexShrink: 1 },
  simRow: { minHeight: 60, borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { width: 76, height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  outOf: { fontSize: 11, minWidth: 34 },
  modalFooter: { borderTopWidth: 1, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: { fontSize: 11, fontWeight: '800' },
  private: { fontSize: 10 },
});
