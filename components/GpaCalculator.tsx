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
};

function normalizeGrade(value: string) {
  return value.trim().toUpperCase().replace(/[^A-F+-]/g, '').slice(0, 2);
}

function seedRows(courses: SyncedCourse[]): GpaRow[] {
  const seeded = courses.map((course) => {
    const inferred = letterForScore(course.currentScore, course).letter;
    return {
      id: `course-${course.id}`,
      name: course.courseCode || course.name || 'Course',
      grade: normalizeGrade(course.currentGrade || inferred || ''),
      credits: '3',
    };
  });
  return seeded.length
    ? seeded
    : [{ id: `custom-${Date.now()}`, name: '', grade: '', credits: '3' }];
}

export function GpaCalculator({ courses }: { courses: SyncedCourse[] }) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<GpaRow[]>(() => seedRows(courses));
  const [cumulativeGpa, setCumulativeGpa] = useState('');
  const [completedCredits, setCompletedCredits] = useState('');

  useEffect(() => {
    if (!open) return;
    setRows((current) => {
      if (current.some((row) => row.name || row.grade)) return current;
      return seedRows(courses);
    });
  }, [open, courses]);

  const result = useMemo(() => {
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
    const semesterGpa = credits > 0 ? qualityPoints / credits : null;
    const priorGpa = Number(cumulativeGpa);
    const priorCredits = Number(completedCredits);
    const projectedCumulative =
      semesterGpa != null &&
      Number.isFinite(priorGpa) &&
      priorGpa >= 0 &&
      priorGpa <= 4.5 &&
      Number.isFinite(priorCredits) &&
      priorCredits > 0
        ? (priorGpa * priorCredits + qualityPoints) / (priorCredits + credits)
        : null;
    return { credits, qualityPoints, included, semesterGpa, projectedCumulative };
  }, [rows, cumulativeGpa, completedCredits]);

  const updateRow = (id: string, patch: Partial<GpaRow>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    setRows((current) => [
      ...current,
      { id: `custom-${Date.now()}-${current.length}`, name: '', grade: '', credits: '3' },
    ]);

  const removeRow = (id: string) =>
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length ? next : [{ id: `custom-${Date.now()}`, name: '', grade: '', credits: '3' }];
    });

  const reset = () => {
    setRows(seedRows(courses));
    setCumulativeGpa('');
    setCompletedCredits('');
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
          <Text style={[s.launchCopy, { color: colors.muted }]}>Plan semester GPA and project your cumulative GPA.</Text>
        </View>
        <View style={[s.launchButton, { backgroundColor: colors.accentSoft }]}>
          <Calculator size={14} color={colors.accent} />
          <Text style={[s.launchButtonText, { color: colors.accent }]}>Calculate</Text>
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
                <Text style={[s.sub, { color: colors.muted }]}>Common 4.0 scale · edit any grade or credit value.</Text>
              </View>
              <Pressable accessibilityLabel="Close GPA calculator" onPress={() => setOpen(false)} style={s.close}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={s.heroRow}>
              <View style={[s.hero, { backgroundColor: colors.accentSoft }]}> 
                <Text style={[s.eyebrow, { color: colors.accent }]}>SEMESTER GPA</Text>
                <Text style={[s.gpa, { color: colors.text }]}>{result.semesterGpa != null ? result.semesterGpa.toFixed(2) : '—'}</Text>
                <Text style={[s.heroMeta, { color: colors.muted }]}>{result.credits ? `${result.credits} credits · ${result.included} course${result.included === 1 ? '' : 's'}` : 'Add grades to calculate'}</Text>
              </View>
              <View style={[s.hero, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}> 
                <View style={s.trendRow}><TrendingUp size={14} color={colors.accent} /><Text style={[s.eyebrow, { color: colors.muted }]}>PROJECTED CUMULATIVE</Text></View>
                <Text style={[s.gpa, { color: colors.text }]}>{result.projectedCumulative != null ? result.projectedCumulative.toFixed(2) : '—'}</Text>
                <Text style={[s.heroMeta, { color: colors.muted }]}>Optional: enter your current GPA and completed credits below.</Text>
              </View>
            </View>

            <View style={[s.priorCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: colors.muted }]}>CURRENT CUMULATIVE GPA</Text>
                <TextInput
                  value={cumulativeGpa}
                  onChangeText={(value) => setCumulativeGpa(value.replace(/[^0-9.]/g, '').slice(0, 4))}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 3.45"
                  placeholderTextColor={colors.muted}
                  style={[s.priorInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: colors.muted }]}>COMPLETED CREDITS</Text>
                <TextInput
                  value={completedCredits}
                  onChangeText={(value) => setCompletedCredits(value.replace(/[^0-9.]/g, '').slice(0, 4))}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 45"
                  placeholderTextColor={colors.muted}
                  style={[s.priorInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            </View>

            <Text style={[s.help, { color: colors.muted }]}>Accepted grades: {GRADE_OPTIONS.join(', ')}. Canvas course grades are prefilled when available; credit hours default to 3 because Canvas usually does not expose course credits.</Text>

            <ScrollView style={s.scroll} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {rows.map((row) => {
                const validGrade = GPA_POINTS[normalizeGrade(row.grade)] != null;
                return (
                  <View key={row.id} style={[s.row, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                    <TextInput
                      value={row.name}
                      onChangeText={(name) => updateRow(row.id, { name })}
                      placeholder="Course name"
                      placeholderTextColor={colors.muted}
                      style={[s.nameInput, { color: colors.text }]}
                    />
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
                      onChangeText={(credits) => updateRow(row.id, { credits: credits.replace(/[^0-9.]/g, '').slice(0, 4) })}
                      keyboardType="decimal-pad"
                      placeholder="3"
                      placeholderTextColor={colors.muted}
                      style={[s.creditInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                    />
                    <Text style={[s.creditLabel, { color: colors.muted }]}>cr</Text>
                    <Pressable accessibilityLabel={`Remove ${row.name || 'course'}`} onPress={() => removeRow(row.id)} style={s.trash}>
                      <Trash2 size={16} color={colors.muted} />
                    </Pressable>
                  </View>
                );
              })}
              <Pressable onPress={addRow} style={[s.add, { borderColor: colors.border }]}> 
                <Plus size={15} color={colors.accent} />
                <Text style={[s.addText, { color: colors.accent }]}>Add another course</Text>
              </Pressable>
            </ScrollView>

            <View style={[s.footer, { borderTopColor: colors.border }]}> 
              <Pressable onPress={reset} style={s.reset}>
                <RotateCcw size={14} color={colors.muted} />
                <Text style={[s.resetText, { color: colors.muted }]}>Reset from Canvas</Text>
              </Pressable>
              <Text style={[s.disclaimer, { color: colors.muted }]}>Planning estimate only · GPA policies vary by school</Text>
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
  launch: { minHeight: 78, borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  launchIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  launchTitle: { fontSize: 15, fontWeight: '900' },
  launchCopy: { fontSize: 11, marginTop: 3 },
  launchButton: { height: 34, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  launchButtonText: { fontSize: 11, fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,24,19,.36)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { width: '100%', maxWidth: 820, maxHeight: '90%', borderWidth: 1, borderRadius: 22, overflow: 'hidden', paddingTop: 20 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20 },
  modalIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  sub: { fontSize: 11, marginTop: 3 },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 18 },
  hero: { flexGrow: 1, flexBasis: 260, minWidth: 220, borderRadius: 16, padding: 16 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  gpa: { fontSize: 34, fontWeight: '900', marginTop: 3 },
  heroMeta: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priorCard: { marginHorizontal: 20, marginTop: 10, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6, marginBottom: 6 },
  priorInput: { height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, fontSize: 12, fontWeight: '800' },
  help: { fontSize: 10, lineHeight: 15, paddingHorizontal: 20, marginTop: 12, marginBottom: 10 },
  scroll: { paddingHorizontal: 20, flexShrink: 1 },
  row: { minHeight: 54, borderWidth: 1, borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  nameInput: { flex: 1, minWidth: 110, height: 36, paddingHorizontal: 5, fontSize: 12, fontWeight: '800' },
  gradeInput: { width: 62, height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, textAlign: 'center', fontSize: 13, fontWeight: '900' },
  creditInput: { width: 58, height: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, textAlign: 'right', fontSize: 12, fontWeight: '800' },
  creditLabel: { fontSize: 10, fontWeight: '800' },
  trash: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  add: { height: 42, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addText: { fontSize: 11, fontWeight: '900' },
  footer: { borderTopWidth: 1, padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: { fontSize: 10, fontWeight: '800' },
  disclaimer: { flex: 1, textAlign: 'center', fontSize: 9 },
  done: { minWidth: 72, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  doneText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});
