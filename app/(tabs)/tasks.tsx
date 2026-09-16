import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Clock3, RefreshCw } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { useCanvasData } from '@/context/CanvasDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

const KEY = 'acadence.completedTasks';

function loadCompleted(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export default function Tasks() {
  const { assignments, grades, courses, connected, refresh } = useCanvasData();
  const { colors } = useAppTheme();
  const [checked, setChecked] = useState<string[]>(loadCompleted);

  const completedByCanvas = useMemo(() => {
    const ids = new Set<string>();
    grades.forEach((grade) => ids.add(String(grade.assignmentId)));
    assignments.forEach((assignment) => {
      const state = (assignment.submissionState || '').toLowerCase();
      if (
        assignment.submittedAt ||
        assignment.gradedAt ||
        assignment.excused ||
        state === 'submitted' ||
        state === 'graded' ||
        state === 'complete'
      ) {
        ids.add(String(assignment.id));
      }
    });
    return ids;
  }, [assignments, grades]);

  const visible = useMemo(
    () =>
      assignments
        .filter(
          (assignment) =>
            !completedByCanvas.has(String(assignment.id)) &&
            !checked.includes(String(assignment.id)),
        )
        .sort(
          (a, b) =>
            new Date(a.dueAt || '2999-12-31').getTime() -
            new Date(b.dueAt || '2999-12-31').getTime(),
        ),
    [assignments, completedByCanvas, checked],
  );

  const finish = (id: string) => {
    const next = checked.includes(id) ? checked : [...checked, id];
    setChecked(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(next));
    }
  };

  const subtitle = !connected
    ? 'Connect Canvas to import assignments'
    : visible.length > 0
      ? `${visible.length} task${visible.length === 1 ? '' : 's'} left to do`
      : "You're caught up.";

  return (
    <Screen>
      <View style={s.head}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Tasks</Text>
          <Text style={[s.sub, { color: colors.muted }]}>{subtitle}</Text>
        </View>
        <Pressable
          onPress={refresh}
          style={[s.refresh, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <RefreshCw size={16} color={colors.accent} />
        </Pressable>
      </View>

      {visible.map((assignment) => {
        const course = courses.find(
          (item) => String(item.id) === String(assignment.courseId),
        );

        return (
          <Animated.View
            key={String(assignment.id)}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(220)}
            layout={Layout.springify().damping(22).stiffness(210)}
            style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: false }}
              accessibilityLabel={`Mark ${assignment.name} complete`}
              onPress={() => finish(String(assignment.id))}
              style={({ pressed }) => [
                s.checkbox,
                {
                  borderColor: pressed ? colors.accent : colors.border,
                  backgroundColor: pressed ? colors.accent : colors.background,
                },
              ]}
            >
              {({ pressed }) =>
                pressed ? <Check size={16} color="#fff" strokeWidth={3} /> : null
              }
            </Pressable>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={[s.task, { color: colors.text }]}>
                {assignment.name}
              </Text>
              <Text numberOfLines={1} style={[s.course, { color: colors.muted }]}>
                {course?.courseCode || course?.name || 'Canvas'}
              </Text>
              <View style={s.due}>
                <Clock3 size={13} color={colors.muted} />
                <Text style={[s.dueText, { color: colors.muted }]}>
                  {assignment.dueAt
                    ? new Date(assignment.dueAt).toLocaleString()
                    : 'No due date'}
                </Text>
              </View>
            </View>

            {assignment.pointsPossible != null ? (
              <Text style={[s.points, { color: colors.muted }]}>
                {assignment.pointsPossible} pts
              </Text>
            ) : null}
          </Animated.View>
        );
      })}

      {connected && visible.length === 0 ? (
        <Animated.View
          entering={FadeIn}
          style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[s.emptyCheck, { backgroundColor: colors.accentSoft }]}>
            <Check size={24} color={colors.accent} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>All caught up</Text>
          <Text style={[s.emptyText, { color: colors.muted }]}>
            Submitted, graded, and tasks you've checked off stay out of your task list.
          </Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 5 },
  refresh: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: radius.md, padding: 15, marginBottom: 9 },
  checkbox: { width: 30, height: 30, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  task: { fontSize: 15, fontWeight: '800' },
  course: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  due: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  dueText: { fontSize: 11 },
  points: { fontSize: 11, fontWeight: '700' },
  empty: { borderWidth: 1, borderRadius: radius.lg, padding: 34, alignItems: 'center' },
  emptyCheck: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 13 },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 5, maxWidth: 380 },
});
