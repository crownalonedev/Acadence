import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, Check, ChevronDown, ChevronUp, Pin, RefreshCw } from 'lucide-react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { PlayfulTaskToggle } from '@/components/PlayfulTaskToggle';
import { AssignmentPinButton } from '@/components/AssignmentPinButton';
import { useCanvasData } from '@/context/CanvasDataContext';
import { usePinnedAssignments } from '@/context/PinnedAssignmentsContext';
import { useCompletedAssignments } from '@/context/CompletedAssignmentsContext';
import { useAppTheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

function dueInfo(value?: string | null) {
  if (!value) return { label: 'No due date', exact: 'No deadline set', past: false, soon: false };
  const due = new Date(value);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const day = 24 * 60 * 60 * 1000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  let label = 'Upcoming';
  if (diff < 0) label = 'Past due';
  else if (dueDay.getTime() === today.getTime()) label = 'Due today';
  else if (dueDay.getTime() === tomorrow.getTime()) label = 'Due tomorrow';
  else if (diff < day * 7) label = `Due in ${Math.max(1, Math.ceil(diff / day))} days`;
  return {
    label,
    exact: `${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
    past: diff < 0,
    soon: diff >= 0 && diff < day * 2,
  };
}

export default function Tasks() {
  const { assignments, grades, courses, refresh } = useCanvasData();
  const { colors } = useAppTheme();
  const { isPinned, togglePin } = usePinnedAssignments();
  const { completedIds, complete, restore } = useCompletedAssignments();
  const [showCompleted, setShowCompleted] = useState(false);

  const canvasDone = useMemo(() => {
    const ids = new Set(grades.map((g) => String(g.assignmentId)));
    assignments.forEach((a) => {
      if (
        a.submittedAt ||
        a.gradedAt ||
        a.excused ||
        ['submitted', 'graded', 'complete'].includes((a.submissionState || '').toLowerCase())
      )
        ids.add(String(a.id));
    });
    return ids;
  }, [assignments, grades]);

  const unfinished = assignments.filter(
    (a) => !canvasDone.has(String(a.id)) && !completedIds.includes(String(a.id)),
  );
  const pinned = unfinished.filter((a) => isPinned(String(a.id)));
  const regular = unfinished.filter((a) => !isPinned(String(a.id)));
  const completed = assignments.filter(
    (a) => completedIds.includes(String(a.id)) && !canvasDone.has(String(a.id)),
  );

  const row = (a: any) => {
    const c = courses.find((x) => String(x.id) === String(a.courseId));
    const id = String(a.id);
    const pin = isPinned(id);
    const due = dueInfo(a.dueAt);
    const dueColor = due.past ? colors.danger : due.soon ? colors.warning : colors.accent;
    const dueBackground = due.past
      ? `${colors.danger}16`
      : due.soon
        ? `${colors.warning}16`
        : colors.accentSoft;

    return (
      <Animated.View
        key={id}
        dataSet={{ assignmentRow: 'true' }}
        layout={Layout.springify().damping(20).stiffness(320).mass(0.8)}
        style={[
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: pin ? colors.accent : colors.border,
          },
        ]}
      >
        <View style={s.taskCopy}>
          <PlayfulTaskToggle label={a.name} onComplete={() => complete(id)} />
          <View style={s.metaIndent}>
            <Text style={[s.course, { color: colors.muted }]}>
              {c?.courseCode || c?.name || 'Canvas'}
            </Text>
            <View style={[s.dueChip, { backgroundColor: dueBackground }]}> 
              <CalendarClock size={13} color={dueColor} />
              <View>
                <Text style={[s.dueLabel, { color: dueColor }]}>{due.label}</Text>
                <Text style={[s.dueExact, { color: colors.muted }]}>{due.exact}</Text>
              </View>
            </View>
          </View>
        </View>

        {a.pointsPossible != null ? (
          <Text
            dataSet={{ assignmentPoints: 'true' }}
            style={[s.points, { color: colors.muted }]}
          >
            {a.pointsPossible} pts
          </Text>
        ) : null}

        <AssignmentPinButton pinned={pin} onPress={() => togglePin(id)} label={a.name} />
      </Animated.View>
    );
  };

  return (
    <Screen>
      <View style={s.head}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Tasks</Text>
          <Text style={[s.sub, { color: colors.muted }]}> 
            {unfinished.length ? `${unfinished.length} tasks left to do` : "You're caught up."}
          </Text>
        </View>
        <Pressable onPress={refresh} style={[s.refresh, { borderColor: colors.border }]}> 
          <RefreshCw size={16} color={colors.accent} />
        </Pressable>
      </View>

      {pinned.length > 0 ? (
        <>
          <View style={s.sectionLabel}>
            <Pin size={13} color={colors.accent} />
            <Text style={[s.sectionLabelText, { color: colors.accent }]}>PINNED</Text>
          </View>
          {pinned.map(row)}
        </>
      ) : null}

      {regular.map(row)}

      {completed.length > 0 ? (
        <View style={s.completedSection}>
          <Pressable
            onPress={() => setShowCompleted((v) => !v)}
            style={[s.completedHeader, { borderColor: colors.border }]}
          >
            <Check size={16} color={colors.accent} />
            <Text style={[s.completedTitle, { color: colors.text }]}>Completed by you ({completed.length})</Text>
            {showCompleted ? (
              <ChevronUp size={17} color={colors.muted} />
            ) : (
              <ChevronDown size={17} color={colors.muted} />
            )}
          </Pressable>

          {showCompleted
            ? completed.map((a) => (
                <View
                  key={`d-${a.id}`}
                  style={[
                    s.doneCard,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  <PlayfulTaskToggle
                    label={a.name}
                    checked
                    onUncheck={() => restore(String(a.id))}
                    removeAfterCheck={false}
                  />
                </View>
              ))
            : null}
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 5 },
  refresh: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
  sectionLabelText: { fontSize: 10, fontWeight: '900' },
  card: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.md, padding: 15, marginBottom: 9 },
  taskCopy: { flex: 1, minWidth: 0 },
  metaIndent: { marginLeft: 42, marginTop: 2, alignItems: 'flex-start' },
  course: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  dueChip: { marginTop: 8, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dueLabel: { fontSize: 10, fontWeight: '900' },
  dueExact: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  points: { fontSize: 11, fontWeight: '700' },
  completedSection: { marginTop: 22 },
  completedHeader: { minHeight: 60, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center' },
  completedTitle: { flex: 1, fontWeight: '800' },
  doneCard: { borderWidth: 1, borderRadius: 13, padding: 12, marginTop: 7 },
});
