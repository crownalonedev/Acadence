import { useNotifications } from '@/context/NotificationsContext';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  CalendarDays,
  GraduationCap,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Sparkles,
  Clock3,
} from 'lucide-react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { CustomizeHomeModal } from '@/components/CustomizeHomeModal';
import { NotificationPopover } from '@/components/NotificationPopover';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { AnimatedBell } from '@/components/AnimatedBell';
import { WebSortableHome } from '@/components/WebSortableHome';
import { AssignmentPinButton } from '@/components/AssignmentPinButton';
import { radius } from '@/constants/theme';
import { HomeWidgetId, useHomeLayout } from '@/context/HomeLayoutContext';
import { useNavigationPreferences } from '@/context/NavigationContext';
import { useCanvasData } from '@/context/CanvasDataContext';
import { usePinnedAssignments } from '@/context/PinnedAssignmentsContext';
import { useCompletedAssignments } from '@/context/CompletedAssignmentsContext';
import { useCourseAppearance } from '@/context/CourseAppearanceContext';
import { useAppTheme } from '@/context/ThemeContext';

const covers = [
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
];

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return `${part}${first ? `, ${first}` : ''}.`;
}

export default function Home() {
  const [library, setLibrary] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const { unread } = useNotifications();
  const unreadLabel = unread > 99 ? '99+' : String(unread);
  const { items, setItems, hide } = useHomeLayout();
  const { editing, setEditing } = useNavigationPreferences();
  const { colors } = useAppTheme();
  const { courses, assignments, grades, profile, connected, refresh } =
    useCanvasData();
  const { pinnedIds, isPinned, togglePin } = usePinnedAssignments();
  const { completedIds } = useCompletedAssignments();
  const { appearance } = useCourseAppearance();
  const router = useRouter();
  const hello = useMemo(() => greeting(profile?.name), [profile?.name]);

  const done = new Set([
    ...grades.map((g) => String(g.assignmentId)),
    ...completedIds,
  ]);
  assignments.forEach((a) => {
    if (
      a.submittedAt ||
      a.gradedAt ||
      a.excused ||
      ['submitted', 'graded', 'complete'].includes(
        (a.submissionState || '').toLowerCase(),
      )
    ) {
      done.add(String(a.id));
    }
  });

  const active = assignments.filter((a) => !done.has(String(a.id)));
  const upcoming = active
    .filter((a) => a.dueAt && new Date(a.dueAt).getTime() >= Date.now())
    .sort(
      (a, b) =>
        new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
    );
  const pinned = active.filter((a) => pinnedIds.includes(String(a.id)));

  const assignmentRow = (a: any, p = false) => {
    const c = courses.find((x) => String(x.id) === String(a.courseId));
    return (
      <Animated.View
        key={`${p ? 'p' : 'a'}-${a.id}`}
        dataSet={{ assignmentRow: 'true' }}
        layout={Layout.springify().damping(20).stiffness(320).mass(0.8)}
        style={[
          s.assignment,
          {
            backgroundColor: colors.surface,
            borderColor: p ? colors.accent : colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.assignmentTitle, { color: colors.text }]}>
            {a.name}
          </Text>
          <Text style={[s.meta, { color: colors.muted }]}>
            {c?.courseCode || c?.name || 'Canvas'}
          </Text>
          <View style={s.due}>
            <Clock3 size={13} color={colors.muted} />
            <Text style={[s.meta, { color: colors.muted }]}>
              {a.dueAt ? new Date(a.dueAt).toLocaleString() : 'No due date'}
            </Text>
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
        <AssignmentPinButton
          pinned={isPinned(String(a.id))}
          onPress={() => togglePin(String(a.id))}
          label={a.name}
        />
      </Animated.View>
    );
  };

  const widget = (id: HomeWidgetId) => {
    switch (id) {
      case 'insight':
        return (
          <View style={[s.ai, { backgroundColor: colors.accentSoft }]}>
            <Sparkles size={20} color={colors.accent} />
            <View>
              <Text style={[s.aiTitle, { color: colors.text }]}>Acadence</Text>
              <Text style={[s.meta, { color: colors.muted }]}>
                {connected
                  ? `${upcoming.length} upcoming assignments across ${courses.length} courses.`
                  : 'Connect Canvas to get started.'}
              </Text>
            </View>
          </View>
        );
      case 'attention':
        return (
          <View style={s.widget}>
            {pinned.length > 0 ? (
              <>
                <View style={s.pinHeading}>
                  <Pin size={14} color={colors.accent} fill={colors.accent} />
                  <Text style={[s.pinHeadingText, { color: colors.accent }]}> 
                    PINNED ASSIGNMENTS
                  </Text>
                </View>
                {pinned.map((a) => assignmentRow(a, true))}
              </>
            ) : null}
            <Text
              style={[
                s.section,
                { color: colors.text, marginTop: pinned.length ? 20 : 0 },
              ]}
            >
              Needs your attention
            </Text>
            {upcoming
              .filter((a) => !isPinned(String(a.id)))
              .slice(0, 5)
              .map((a) => assignmentRow(a))}
          </View>
        );
      case 'courses':
        return (
          <View style={s.widget}>
            <Text style={[s.section, { color: colors.text }]}>Your courses</Text>
            <View style={s.grid}>
              {courses.map((c, i) => (
                <Pressable
                  key={String(c.id)}
                  onPress={() =>
                    router.push({
                      pathname: '/course/[id]' as any,
                      params: { id: String(c.id) },
                    })
                  }
                  style={[
                    s.courseCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={s.courseCover}>
                    <img
                      src={appearance[String(c.id)]?.image || covers[i % covers.length]}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {c.currentScore != null ? (
                      <View style={s.courseGrade}>
                        <Text style={s.courseGradeText}>
                          {c.currentScore}%
                          {c.currentGrade ? ` · ${c.currentGrade}` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={s.courseBody}>
                    <Text style={[s.code, { color: colors.muted }]}>
                      {c.courseCode}
                    </Text>
                    <Text style={[s.name, { color: colors.text }]}>{c.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 'schedule':
        return (
          <Pressable
            onPress={() => router.push('/(tabs)/calendar')}
            style={[
              s.simple,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <CalendarDays size={20} color={colors.accent} />
            <Text style={[s.simpleTitle, { color: colors.text }]}> 
              Calendar & deadlines
            </Text>
          </Pressable>
        );
      case 'changes':
        return (
          <Pressable
            onPress={refresh}
            style={[
              s.simple,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <RefreshCw size={20} color={colors.accent} />
            <Text style={[s.simpleTitle, { color: colors.text }]}>Refresh Canvas</Text>
          </Pressable>
        );
      case 'grades':
        return (
          <Pressable
            onPress={() => router.push('/(tabs)/grades')}
            style={[
              s.simple,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <GraduationCap size={20} color={colors.accent} />
            <Text style={[s.simpleTitle, { color: colors.text }]}>Grades & What-If</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  return (
    <Screen>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <View
            style={[
              s.brandPill,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[s.brand, { color: colors.accent }]}>acadence</Text>
          </View>
          <Text style={[s.greeting, { color: colors.text }]}>{hello}</Text>
          <Text style={[s.sub, { color: colors.muted }]}>
            {editing
              ? 'Rearrange your Home and navigation.'
              : connected
                ? `Synced with Canvas · ${courses.length} courses`
                : 'Your student hub'}
          </Text>
        </View>

        <View style={s.actions}>
          {editing ? (
            <Pressable
              onPress={() => setEditing(false)}
              style={[s.done, { backgroundColor: colors.accent }]}
            >
              <Text style={s.doneText}>Done</Text>
            </Pressable>
          ) : (
            <>
              <ThemeToggleButton />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  unread ? `Notifications, ${unread} unread` : 'Notifications'
                }
                onPress={() => setNotifications((v) => !v)}
                style={[
                  s.icon,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <AnimatedBell
                  size={20}
                  color={colors.text}
                  animate={notifications}
                />
                {unread > 0 ? (
                  <View
                    style={[
                      s.badge,
                      {
                        backgroundColor: colors.danger,
                        borderColor: colors.background,
                      },
                    ]}
                  >
                    <Text style={s.badgeText}>{unreadLabel}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => setEditing(true)}
                style={[
                  s.icon,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Pencil size={19} color={colors.text} />
              </Pressable>
            </>
          )}
        </View>

        <NotificationPopover
          visible={notifications}
          onClose={() => setNotifications(false)}
        />
      </View>

      {editing ? (
        <Pressable
          onPress={() => setLibrary(true)}
          style={[s.add, { borderColor: colors.border }]}
        >
          <Plus size={18} color={colors.accent} />
          <Text style={[s.addText, { color: colors.accent }]}>Add Widget</Text>
        </Pressable>
      ) : null}

      {editing && Platform.OS === 'web' ? (
        <WebSortableHome
          items={items}
          setItems={setItems}
          hide={hide}
          renderWidget={widget}
          colors={colors}
        />
      ) : (
        items.map((id) => (
          <Animated.View
            key={id}
            layout={Layout.springify()}
            style={s.wrapper}
          >
            {widget(id)}
          </Animated.View>
        ))
      )}

      <CustomizeHomeModal
        visible={library}
        onClose={() => setLibrary(false)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  actions: { flexDirection: 'row', gap: 8 },
  brandPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#1F5A44',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  brand: { fontSize: 17, fontWeight: '900', letterSpacing: -0.35 },
  greeting: { fontSize: 30, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 5 },
  icon: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -8,
    minWidth: 24,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  done: { padding: 12, borderRadius: 20 },
  doneText: { color: '#fff', fontWeight: '800' },
  add: {
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  addText: { fontWeight: '800' },
  wrapper: { padding: 7, marginHorizontal: -7 },
  ai: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.md },
  aiTitle: { fontWeight: '800' },
  widget: { paddingTop: 8 },
  section: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  pinHeading: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  pinHeadingText: { fontSize: 10, fontWeight: '900' },
  assignment: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 9,
  },
  assignmentTitle: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 5 },
  due: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  points: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  courseCard: {
    minWidth: 240,
    flexGrow: 1,
    flexBasis: 280,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  courseCover: { height: 105 },
  courseGrade: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(12,20,16,.72)',
    padding: 7,
    borderRadius: 10,
  },
  courseGradeText: { color: '#fff', fontWeight: '900' },
  courseBody: { padding: 13 },
  code: { fontSize: 10, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '800' },
  simple: {
    flexDirection: 'row',
    gap: 13,
    padding: 17,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  simpleTitle: { fontSize: 15, fontWeight: '800' },
});
