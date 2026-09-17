import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  File,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers3,
  Megaphone,
} from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { useCanvasData } from '@/context/CanvasDataContext';
import { useCourseAppearance } from '@/context/CourseAppearanceContext';
import { useAppTheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

const fallback =
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=80';
const TABS = [
  ['overview', 'Overview', BookOpen],
  ['modules', 'Modules', Layers3],
  ['assignments', 'Assignments', CheckCircle2],
  ['announcements', 'Announcements', Megaphone],
  ['grades', 'Grades', GraduationCap],
  ['files', 'Files', FolderOpen],
  ['pages', 'Pages', FileText],
] as const;

type TabId = (typeof TABS)[number][0];

function plainText(value?: string) {
  return String(value || '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFileSize(value?: number) {
  if (value == null || !Number.isFinite(value)) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    courses,
    assignments,
    announcements,
    grades,
    modules,
    files,
    pages,
  } = useCanvasData();
  const { appearance } = useCourseAppearance();
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<TabId>('overview');

  const course = courses.find((c) => String(c.id) === String(id));
  const courseAssignments = useMemo(
    () =>
      assignments
        .filter((a) => String(a.courseId) === String(id))
        .sort(
          (a, b) =>
            new Date(a.dueAt || '2999-12-31').getTime() -
            new Date(b.dueAt || '2999-12-31').getTime(),
        ),
    [assignments, id],
  );
  const courseGrades = grades
    .filter((g) => String(g.courseId) === String(id))
    .sort(
      (a, b) =>
        new Date(b.gradedAt || 0).getTime() - new Date(a.gradedAt || 0).getTime(),
    );
  const gradedIds = new Set(courseGrades.map((g) => String(g.assignmentId)));
  const isComplete = (a: (typeof courseAssignments)[number]) =>
    gradedIds.has(String(a.id)) ||
    !!a.submittedAt ||
    !!a.gradedAt ||
    !!a.excused ||
    ['submitted', 'graded', 'complete'].includes(
      (a.submissionState || '').toLowerCase(),
    );
  const now = Date.now();
  const upcoming = courseAssignments.filter(
    (a) =>
      !!a.dueAt &&
      new Date(a.dueAt).getTime() >= now &&
      !isComplete(a),
  );
  const courseAnnouncements = announcements
    .filter((a) => String(a.courseId) === String(id))
    .sort(
      (a, b) =>
        new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime(),
    );
  const courseModules = modules
    .filter((m) => String(m.courseId) === String(id))
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const courseFiles = files
    .filter((f) => String(f.courseId) === String(id))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const coursePages = pages
    .filter((p) => String(p.courseId) === String(id))
    .sort((a, b) => Number(b.frontPage) - Number(a.frontPage) || a.title.localeCompare(b.title));

  if (!course)
    return (
      <Screen>
        <Pressable onPress={() => router.back()} style={s.back}>
          <ArrowLeft size={17} color={colors.accent} />
          <Text style={[s.backText, { color: colors.accent }]}>Courses</Text>
        </Pressable>
        <Text style={[s.title, { color: colors.text }]}>Course not found</Text>
      </Screen>
    );

  const image = appearance[String(course.id)]?.image || fallback;
  const open = (url?: string) => {
    if (url) void Linking.openURL(url);
  };

  const Empty = ({ children }: { children: string }) => (
    <View style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <Text style={[s.emptyText, { color: colors.muted }]}>{children}</Text>
    </View>
  );

  const AssignmentCard = ({ a }: { a: (typeof courseAssignments)[number] }) => {
    const complete = isComplete(a);
    const past = !!a.dueAt && new Date(a.dueAt).getTime() < now;
    const status = complete ? 'Completed' : past ? 'Past due' : a.dueAt ? 'Upcoming' : 'No due date';
    return (
      <Pressable
        onPress={() => open(a.htmlUrl)}
        disabled={!a.htmlUrl}
        style={({ pressed }) => [
          s.card,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.task, { color: colors.text }]}>{a.name}</Text>
          <View style={s.row}>
            <Clock3 size={13} color={colors.muted} />
            <Text style={[s.meta, { color: colors.muted }]}> 
              {a.dueAt ? new Date(a.dueAt).toLocaleString() : 'No due date'}
            </Text>
          </View>
        </View>
        <View style={s.rightMeta}>
          {a.pointsPossible != null ? (
            <Text style={[s.points, { color: colors.muted }]}>{a.pointsPossible} pts</Text>
          ) : null}
          <Text style={[s.status, { color: complete ? colors.accent : colors.muted }]}>{status}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={s.back}>
        <ArrowLeft size={17} color={colors.accent} />
        <Text style={[s.backText, { color: colors.accent }]}>Courses</Text>
      </Pressable>

      <View style={s.hero}>
        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <View style={s.shade} />
        <View style={s.heroText}>
          <Text style={s.heroCode}>{course.courseCode || 'CANVAS COURSE'}</Text>
          <Text style={s.heroTitle}>{course.name}</Text>
          <View style={s.heroBottom}>
            <Text style={s.heroSub}>Your Canvas course, organized in Acadence</Text>
            {course.currentScore != null ? (
              <View style={s.grade}>
                <Text style={s.gradeText}>
                  {course.currentScore}%{course.currentGrade ? ` · ${course.currentGrade}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={s.tabs}>
        {TABS.map(([key, label, Icon]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                s.tab,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surface,
                  borderColor: active ? colors.accentSoft : colors.border,
                },
              ]}
            >
              <Icon size={15} color={active ? colors.accent : colors.muted} />
              <Text style={[s.tabText, { color: active ? colors.accent : colors.muted }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'overview' ? (
        <>
          <View style={s.sectionHead}>
            <Text style={[s.section, { color: colors.text }]}>Upcoming assignments</Text>
            <Text style={[s.count, { color: colors.muted }]}>{upcoming.length}</Text>
          </View>
          {upcoming.length ? upcoming.slice(0, 8).map((a) => <AssignmentCard key={String(a.id)} a={a} />) : <Empty>No upcoming assignments — you’re caught up.</Empty>}

          <View style={s.overviewGrid}>
            <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Megaphone size={18} color={colors.accent} />
              <Text style={[s.summaryTitle, { color: colors.text }]}>Announcements</Text>
              <Text style={[s.summaryNumber, { color: colors.text }]}>{courseAnnouncements.length}</Text>
              <Text style={[s.meta, { color: colors.muted }]}>Course updates synced from Canvas</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Layers3 size={18} color={colors.accent} />
              <Text style={[s.summaryTitle, { color: colors.text }]}>Modules</Text>
              <Text style={[s.summaryNumber, { color: colors.text }]}>{courseModules.length}</Text>
              <Text style={[s.meta, { color: colors.muted }]}>Organized course material</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <FolderOpen size={18} color={colors.accent} />
              <Text style={[s.summaryTitle, { color: colors.text }]}>Files</Text>
              <Text style={[s.summaryNumber, { color: colors.text }]}>{courseFiles.length}</Text>
              <Text style={[s.meta, { color: colors.muted }]}>Documents and resources</Text>
            </View>
          </View>

          {plainText(course.syllabusBody) ? (
            <View style={[s.syllabus, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[s.section, { color: colors.text }]}>Syllabus</Text>
              <Text numberOfLines={8} style={[s.body, { color: colors.muted }]}>{plainText(course.syllabusBody)}</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {tab === 'modules' ? (
        <>
          <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Modules</Text><Text style={[s.count, { color: colors.muted }]}>{courseModules.length}</Text></View>
          {courseModules.length ? courseModules.map((module) => (
            <View key={module.id} style={[s.moduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={s.moduleHead}><Layers3 size={17} color={colors.accent} /><View style={{ flex: 1 }}><Text style={[s.moduleTitle, { color: colors.text }]}>{module.name}</Text>{module.unlockAt ? <Text style={[s.meta, { color: colors.muted }]}>Unlocks {new Date(module.unlockAt).toLocaleString()}</Text> : null}</View><Text style={[s.count, { color: colors.muted }]}>{module.items?.length || 0}</Text></View>
              {(module.items || []).sort((a, b) => (a.position || 0) - (b.position || 0)).map((item) => (
                <Pressable key={item.id} onPress={() => open(item.htmlUrl)} disabled={!item.htmlUrl} style={[s.moduleItem, { borderTopColor: colors.border }]}> 
                  <FileText size={15} color={colors.muted} />
                  <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{item.title}</Text><Text style={[s.meta, { color: colors.muted }]}>{item.type || 'Module item'}</Text></View>
                  {item.htmlUrl ? <ArrowUpRight size={14} color={colors.accent} /> : null}
                </Pressable>
              ))}
            </View>
          )) : <Empty>Modules haven’t synced yet. Reload the Acadence extension and sync Canvas once.</Empty>}
        </>
      ) : null}

      {tab === 'assignments' ? (
        <>
          <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Assignments</Text><Text style={[s.count, { color: colors.muted }]}>{courseAssignments.length}</Text></View>
          {courseAssignments.length ? courseAssignments.map((a) => <AssignmentCard key={String(a.id)} a={a} />) : <Empty>No assignments found for this course.</Empty>}
        </>
      ) : null}

      {tab === 'announcements' ? (
        <>
          <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Announcements</Text><Text style={[s.count, { color: colors.muted }]}>{courseAnnouncements.length}</Text></View>
          {courseAnnouncements.length ? courseAnnouncements.map((a) => (
            <Pressable key={a.id} onPress={() => open(a.htmlUrl)} disabled={!a.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={s.contentIcon}><Megaphone size={16} color={colors.accent} /></View>
              <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{a.title}</Text><Text numberOfLines={3} style={[s.body, { color: colors.muted }]}>{plainText(a.message)}</Text><Text style={[s.meta, { color: colors.muted }]}>{a.author ? `${a.author} · ` : ''}{a.postedAt ? new Date(a.postedAt).toLocaleString() : ''}</Text></View>
            </Pressable>
          )) : <Empty>No announcements found for this course.</Empty>}
        </>
      ) : null}

      {tab === 'grades' ? (
        <>
          <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Grades</Text><Text style={[s.count, { color: colors.muted }]}>{courseGrades.length}</Text></View>
          {courseGrades.length ? courseGrades.map((g) => (
            <Pressable key={g.id} onPress={() => open(g.htmlUrl)} disabled={!g.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={s.contentIcon}><GraduationCap size={16} color={colors.accent} /></View>
              <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{g.name}</Text><Text style={[s.meta, { color: colors.muted }]}>{g.gradedAt ? `Graded ${new Date(g.gradedAt).toLocaleString()}` : 'Graded'}</Text></View>
              <Text style={[s.gradeResult, { color: colors.text }]}>{g.excused ? 'Excused' : g.score != null ? `${g.score}${g.pointsPossible != null ? ` / ${g.pointsPossible}` : ''}${g.grade ? ` · ${g.grade}` : ''}` : g.grade || '—'}</Text>
            </Pressable>
          )) : <Empty>No posted grades found for this course.</Empty>}
        </>
      ) : null}

      {tab === 'files' ? (
        <>
          <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Files</Text><Text style={[s.count, { color: colors.muted }]}>{courseFiles.length}</Text></View>
          {courseFiles.length ? courseFiles.map((f) => (
            <Pressable key={f.id} onPress={() => open(f.htmlUrl)} disabled={!f.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={s.contentIcon}><File size={16} color={colors.accent} /></View>
              <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={[s.itemTitle, { color: colors.text }]}>{f.displayName}</Text><Text style={[s.meta, { color: colors.muted }]}>{[f.contentType, formatFileSize(f.size), f.updatedAt ? `Updated ${new Date(f.updatedAt).toLocaleDateString()}` : ''].filter(Boolean).join(' · ')}</Text></View>
              {f.htmlUrl ? <ArrowUpRight size={15} color={colors.accent} /> : null}
            </Pressable>
          )) : <Empty>Files haven’t synced yet. Reload the Acadence extension and sync Canvas once.</Empty>}
        </>
      ) : null}

      {tab === 'pages' ? (
        <>
          <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Pages</Text><Text style={[s.count, { color: colors.muted }]}>{coursePages.length}</Text></View>
          {coursePages.length ? coursePages.map((p) => (
            <Pressable key={p.id} onPress={() => open(p.htmlUrl)} disabled={!p.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={s.contentIcon}><FileText size={16} color={colors.accent} /></View>
              <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{p.title}</Text><Text style={[s.meta, { color: colors.muted }]}>{p.frontPage ? 'Course home page' : 'Canvas page'}{p.updatedAt ? ` · Updated ${new Date(p.updatedAt).toLocaleDateString()}` : ''}</Text></View>
              {p.htmlUrl ? <ArrowUpRight size={15} color={colors.accent} /> : null}
            </Pressable>
          )) : <Empty>Pages haven’t synced yet. Reload the Acadence extension and sync Canvas once.</Empty>}
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14, marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '800' },
  hero: { height: 230, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 18 },
  shade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8,17,13,.38)' },
  heroText: { position: 'absolute', left: 24, right: 24, bottom: 22 },
  heroCode: { color: 'rgba(255,255,255,.76)', fontSize: 11, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 5, maxWidth: 780 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,.78)', fontSize: 12 },
  grade: { backgroundColor: 'rgba(10,22,16,.72)', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7 },
  gradeText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 26 },
  tab: { minHeight: 38, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 12, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  section: { fontSize: 18, fontWeight: '800' },
  count: { fontSize: 12, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  task: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  meta: { fontSize: 12, lineHeight: 17 },
  points: { fontSize: 12, fontWeight: '700' },
  rightMeta: { alignItems: 'flex-end', gap: 4 },
  status: { fontSize: 10, fontWeight: '800' },
  empty: { borderWidth: 1, borderRadius: radius.md, padding: 18, marginBottom: 12 },
  emptyText: { fontSize: 13 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  summaryCard: { flexGrow: 1, flexBasis: 220, borderWidth: 1, borderRadius: radius.md, padding: 15 },
  summaryTitle: { fontSize: 12, fontWeight: '800', marginTop: 8 },
  summaryNumber: { fontSize: 24, fontWeight: '900', marginTop: 5 },
  syllabus: { borderWidth: 1, borderRadius: radius.md, padding: 16, marginTop: 18 },
  body: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  moduleCard: { borderWidth: 1, borderRadius: radius.md, padding: 15, marginBottom: 10 },
  moduleHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4 },
  moduleTitle: { fontSize: 15, fontWeight: '900' },
  moduleItem: { minHeight: 52, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
  itemTitle: { fontSize: 13, fontWeight: '800' },
  contentCard: { borderWidth: 1, borderRadius: radius.md, padding: 14, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  contentIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  gradeResult: { fontSize: 13, fontWeight: '900' },
});
