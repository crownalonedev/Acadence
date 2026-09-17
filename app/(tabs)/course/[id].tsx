import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  File,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers3,
  Megaphone,
  ScrollText,
} from 'lucide-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { useCanvasData } from '@/context/CanvasDataContext';
import { useCourseAppearance } from '@/context/CourseAppearanceContext';
import { useAppTheme } from '@/context/ThemeContext';
import { radius } from '@/constants/theme';

const fallback =
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=80';
const TABS = [
  ['overview', 'Overview', BookOpen],
  ['syllabus', 'Syllabus', ScrollText],
  ['modules', 'Modules', Layers3],
  ['assignments', 'Assignments', CheckCircle2],
  ['announcements', 'Announcements', Megaphone],
  ['grades', 'Grades', GraduationCap],
  ['files', 'Files', FolderOpen],
  ['pages', 'Pages', FileText],
] as const;

type TabId = (typeof TABS)[number][0];
type SyllabusSection = { title: string; paragraphs: string[]; bullets: string[] };

function plainText(value?: string) {
  return String(value || '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function syllabusSections(html?: string): SyllabusSection[] {
  if (!html || !plainText(html)) return [];
  let marked = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_m, text) => `\n@@H@@${plainText(text)}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, text) => `\n@@B@@${plainText(text)}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|tr|table|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

  const known = [
    'Course Description',
    'Course Learning Outcomes',
    'Learning Outcomes',
    'Instructor',
    'Office Hours',
    'Class Days/Time',
    'Class Location',
    'Learning Assistants',
    'Required Materials',
    'Course Materials',
    'Grading',
    'Grade Breakdown',
    'Assignments',
    'Attendance',
    'Course Policies',
    'Academic Integrity',
    'Accessibility',
    'Late Work',
    'Communication',
  ];
  const escaped = known.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const labelPattern = new RegExp(`\\s+(${escaped.join('|')})(?=\\s*:|\\s+)`, 'gi');
  marked = marked.replace(labelPattern, '\n@@H@@$1\n');

  const tokens = marked
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const sections: SyllabusSection[] = [];
  let current: SyllabusSection = { title: 'Course syllabus', paragraphs: [], bullets: [] };
  const push = () => {
    if (current.paragraphs.length || current.bullets.length || current.title !== 'Course syllabus')
      sections.push(current);
  };

  for (const token of tokens) {
    if (token.startsWith('@@H@@')) {
      push();
      current = {
        title: token.replace('@@H@@', '').replace(/^[:\-–—\s]+/, '').trim() || 'Details',
        paragraphs: [],
        bullets: [],
      };
    } else if (token.startsWith('@@B@@')) {
      const value = token.replace('@@B@@', '').trim();
      if (value) current.bullets.push(value);
    } else {
      const value = token.replace(/^[:\-–—\s]+/, '').trim();
      if (value) current.paragraphs.push(value);
    }
  }
  push();
  return sections.length
    ? sections.filter((section) => section.paragraphs.length || section.bullets.length)
    : [{ title: 'Course syllabus', paragraphs: [plainText(html)], bullets: [] }];
}

function formatFileSize(value?: number) {
  if (value == null || !Number.isFinite(value)) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function dueInfo(value?: string | null) {
  if (!value) return { label: 'No due date', date: '', time: '', past: false, soon: false };
  const due = new Date(value);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const day = 24 * 60 * 60 * 1000;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let label = 'Upcoming';
  if (diff < 0) label = 'Past due';
  else if (dueDay.getTime() === today.getTime()) label = 'Due today';
  else if (dueDay.getTime() === tomorrow.getTime()) label = 'Due tomorrow';
  else if (diff < day * 7) label = `Due in ${Math.max(1, Math.ceil(diff / day))} days`;
  return {
    label,
    date: due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: due.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }),
    time: due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    past: diff < 0,
    soon: diff >= 0 && diff < day * 2,
  };
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, assignments, announcements, grades, modules, files, pages } = useCanvasData();
  const { appearance } = useCourseAppearance();
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<TabId>('overview');
  const [syllabusOpen, setSyllabusOpen] = useState<Record<number, boolean>>({ 0: true, 1: true });

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
    .sort((a, b) => new Date(b.gradedAt || 0).getTime() - new Date(a.gradedAt || 0).getTime());
  const gradedIds = new Set(courseGrades.map((g) => String(g.assignmentId)));
  const isComplete = (a: (typeof courseAssignments)[number]) =>
    gradedIds.has(String(a.id)) ||
    !!a.submittedAt ||
    !!a.gradedAt ||
    !!a.excused ||
    ['submitted', 'graded', 'complete'].includes((a.submissionState || '').toLowerCase());
  const now = Date.now();
  const upcoming = courseAssignments.filter(
    (a) => !!a.dueAt && new Date(a.dueAt).getTime() >= now && !isComplete(a),
  );
  const courseAnnouncements = announcements
    .filter((a) => String(a.courseId) === String(id))
    .sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime());
  const courseModules = modules
    .filter((m) => String(m.courseId) === String(id))
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const courseFiles = files
    .filter((f) => String(f.courseId) === String(id))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const coursePages = pages
    .filter((p) => String(p.courseId) === String(id))
    .sort((a, b) => Number(b.frontPage) - Number(a.frontPage) || a.title.localeCompare(b.title));
  const syllabus = useMemo(() => syllabusSections(course?.syllabusBody), [course?.syllabusBody]);

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
    const due = dueInfo(a.dueAt);
    const chipBg = complete
      ? colors.accentSoft
      : due.past
        ? `${colors.danger}18`
        : due.soon
          ? `${colors.warning}18`
          : colors.accentSoft;
    const chipColor = complete
      ? colors.accent
      : due.past
        ? colors.danger
        : due.soon
          ? colors.warning
          : colors.accent;
    return (
      <Pressable
        onPress={() => open(a.htmlUrl)}
        disabled={!a.htmlUrl}
        style={({ pressed, hovered }: any) => [
          s.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          hovered && s.cardHover,
          pressed && { opacity: 0.82, transform: [{ scale: 0.995 }] },
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.task, { color: colors.text }]}>{a.name}</Text>
          <View style={s.assignmentMetaRow}>
            {a.pointsPossible != null ? (
              <Text style={[s.points, { color: colors.muted }]}>{a.pointsPossible} pts</Text>
            ) : null}
            {complete ? <Text style={[s.status, { color: colors.accent }]}>Completed</Text> : null}
          </View>
        </View>
        <View style={[s.dueChip, { backgroundColor: chipBg }]}> 
          <CalendarClock size={15} color={chipColor} />
          <View>
            <Text style={[s.dueLabel, { color: chipColor }]}>{complete ? 'Completed' : due.label}</Text>
            <Text style={[s.dueExact, { color: colors.muted }]}> 
              {a.dueAt ? `${due.date} · ${due.time}` : 'No deadline set'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const SyllabusView = () => (
    <View style={[s.syllabus, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={s.syllabusHeader}>
        <View>
          <Text style={[s.section, { color: colors.text, marginBottom: 0 }]}>Syllabus</Text>
          <Text style={[s.meta, { color: colors.muted }]}>Cleaned and organized from your Canvas course syllabus.</Text>
        </View>
        <BookOpen size={20} color={colors.accent} />
      </View>
      <View style={s.syllabusStack}>
        {syllabus.map((section, index) => {
          const openSection = syllabusOpen[index] ?? index < 2;
          return (
            <Animated.View
              key={`${section.title}-${index}`}
              layout={Layout.springify().damping(22).stiffness(240)}
              style={[s.syllabusSection, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Pressable
                onPress={() => setSyllabusOpen((old) => ({ ...old, [index]: !openSection }))}
                style={({ hovered }: any) => [s.syllabusTrigger, hovered && s.syllabusHover]}
              >
                <Text style={[s.syllabusTitle, { color: colors.text }]}>{section.title}</Text>
                {openSection ? <ChevronUp size={17} color={colors.muted} /> : <ChevronDown size={17} color={colors.muted} />}
              </Pressable>
              {openSection ? (
                <Animated.View entering={FadeInDown.duration(180)} style={s.syllabusBody}>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <Text key={`p-${paragraphIndex}`} style={[s.syllabusText, { color: colors.muted }]}>{paragraph}</Text>
                  ))}
                  {section.bullets.map((bullet, bulletIndex) => (
                    <View key={`b-${bulletIndex}`} style={s.bulletRow}>
                      <View style={[s.bullet, { backgroundColor: colors.accent }]} />
                      <Text style={[s.syllabusText, { color: colors.muted, flex: 1 }]}>{bullet}</Text>
                    </View>
                  ))}
                </Animated.View>
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

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
              style={({ hovered, pressed }: any) => [
                s.tab,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surface,
                  borderColor: active ? colors.accentSoft : colors.border,
                },
                hovered && { transform: [{ translateY: -1 }] },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Icon size={15} color={active ? colors.accent : colors.muted} />
              <Text style={[s.tabText, { color: active ? colors.accent : colors.muted }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View key={tab} entering={FadeInDown.duration(230)}>
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

            {syllabus.length ? (
              <Pressable
                onPress={() => setTab('syllabus')}
                style={({ hovered, pressed }: any) => [
                  s.syllabusPreview,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  hovered && s.cardHover,
                  pressed && { transform: [{ scale: 0.995 }] },
                ]}
              >
                <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}>
                  <ScrollText size={17} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemTitle, { color: colors.text }]}>Course syllabus</Text>
                  <Text style={[s.meta, { color: colors.muted }]}>{syllabus.length} organized section{syllabus.length === 1 ? '' : 's'} · open the clean syllabus view</Text>
                </View>
                <ArrowRight size={16} color={colors.accent} />
              </Pressable>
            ) : null}
          </>
        ) : null}

        {tab === 'syllabus' ? (syllabus.length ? <SyllabusView /> : <Empty>No syllabus was provided by this Canvas course.</Empty>) : null}

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
                <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><Megaphone size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{a.title}</Text><Text numberOfLines={4} style={[s.body, { color: colors.muted }]}>{plainText(a.message)}</Text><Text style={[s.meta, { color: colors.muted }]}>{a.author ? `${a.author} · ` : ''}{a.postedAt ? new Date(a.postedAt).toLocaleString() : ''}</Text></View>
              </Pressable>
            )) : <Empty>No announcements found for this course.</Empty>}
          </>
        ) : null}

        {tab === 'grades' ? (
          <>
            <View style={s.gradeSummaryRow}>
              <View style={[s.gradeSummary, { backgroundColor: colors.accentSoft }]}> 
                <Text style={[s.gradeSummaryLabel, { color: colors.accent }]}>CURRENT GRADE</Text>
                <Text style={[s.gradeSummaryScore, { color: colors.text }]}>{course.currentScore != null ? `${course.currentScore}%` : '—'}</Text>
                <Text style={[s.gradeSummaryLetter, { color: colors.accent }]}>{course.currentGrade || 'No letter grade'}</Text>
              </View>
            </View>
            <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Graded work</Text><Text style={[s.count, { color: colors.muted }]}>{courseGrades.length}</Text></View>
            {courseGrades.length ? courseGrades.map((g) => (
              <Pressable key={g.id} onPress={() => open(g.htmlUrl)} disabled={!g.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><GraduationCap size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{g.name}</Text><Text style={[s.meta, { color: colors.muted }]}>{g.gradedAt ? new Date(g.gradedAt).toLocaleString() : 'Graded'}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={[s.gradeScore, { color: colors.text }]}>{g.excused ? 'Excused' : g.score != null ? `${g.score}${g.pointsPossible != null ? ` / ${g.pointsPossible}` : ''}` : g.grade || '—'}</Text>{g.grade ? <Text style={[s.gradeMiniLetter, { color: colors.accent }]}>{g.grade}</Text> : null}</View>
              </Pressable>
            )) : <Empty>No grades found for this course.</Empty>}
          </>
        ) : null}

        {tab === 'files' ? (
          <>
            <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Files</Text><Text style={[s.count, { color: colors.muted }]}>{courseFiles.length}</Text></View>
            {courseFiles.length ? courseFiles.map((file) => (
              <Pressable key={file.id} onPress={() => open(file.htmlUrl)} disabled={!file.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><File size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{file.displayName}</Text><Text style={[s.meta, { color: colors.muted }]}>{[file.contentType, formatFileSize(file.size), file.updatedAt ? `Updated ${new Date(file.updatedAt).toLocaleDateString()}` : ''].filter(Boolean).join(' · ')}</Text></View>
                {file.htmlUrl ? <ArrowUpRight size={14} color={colors.accent} /> : null}
              </Pressable>
            )) : <Empty>No course files have synced yet.</Empty>}
          </>
        ) : null}

        {tab === 'pages' ? (
          <>
            <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Pages</Text><Text style={[s.count, { color: colors.muted }]}>{coursePages.length}</Text></View>
            {coursePages.length ? coursePages.map((page) => (
              <Pressable key={page.id} onPress={() => open(page.htmlUrl)} disabled={!page.htmlUrl} style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><FileText size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{page.title}</Text><Text style={[s.meta, { color: colors.muted }]}>{page.frontPage ? 'Front page' : 'Canvas page'}{page.updatedAt ? ` · Updated ${new Date(page.updatedAt).toLocaleDateString()}` : ''}</Text></View>
                {page.htmlUrl ? <ArrowUpRight size={14} color={colors.accent} /> : null}
              </Pressable>
            )) : <Empty>No pages have synced yet.</Empty>}
          </>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14, marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '900' },
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
  tab: { height: 38, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 12, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  section: { fontSize: 19, fontWeight: '900', marginBottom: 12 },
  count: { fontSize: 12, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardHover: { transform: [{ translateY: -1 }], shadowColor: '#1F5A44', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  task: { fontSize: 15, fontWeight: '800' },
  assignmentMetaRow: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 7 },
  meta: { fontSize: 11, lineHeight: 17 },
  points: { fontSize: 11, fontWeight: '700' },
  status: { fontSize: 10, fontWeight: '900' },
  dueChip: { minWidth: 150, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dueLabel: { fontSize: 11, fontWeight: '900' },
  dueExact: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  summaryCard: { flexGrow: 1, flexBasis: 210, minWidth: 190, borderWidth: 1, borderRadius: 15, padding: 14 },
  summaryTitle: { fontSize: 12, fontWeight: '800', marginTop: 9 },
  summaryNumber: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  syllabusPreview: { minHeight: 64, borderWidth: 1, borderRadius: 15, padding: 13, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 11 },
  syllabus: { borderWidth: 1, borderRadius: 20, padding: 18 },
  syllabusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 },
  syllabusStack: { gap: 8 },
  syllabusSection: { borderWidth: 1, borderRadius: 13, overflow: 'hidden' },
  syllabusTrigger: { minHeight: 46, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  syllabusHover: { opacity: 0.82 },
  syllabusTitle: { flex: 1, fontSize: 12, fontWeight: '900' },
  syllabusBody: { paddingHorizontal: 13, paddingBottom: 13, gap: 8 },
  syllabusText: { fontSize: 12, lineHeight: 19 },
  bulletRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  moduleCard: { borderWidth: 1, borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  moduleHead: { minHeight: 58, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  moduleTitle: { fontSize: 14, fontWeight: '900' },
  moduleItem: { minHeight: 50, borderTopWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { fontSize: 13, fontWeight: '800' },
  contentCard: { minHeight: 68, borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  contentIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  body: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  empty: { borderWidth: 1, borderRadius: 15, padding: 18 },
  emptyText: { fontSize: 12 },
  gradeSummaryRow: { flexDirection: 'row', marginBottom: 18 },
  gradeSummary: { minWidth: 180, borderRadius: 16, padding: 15 },
  gradeSummaryLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  gradeSummaryScore: { fontSize: 27, fontWeight: '900', marginTop: 5 },
  gradeSummaryLetter: { fontSize: 12, fontWeight: '900', marginTop: 2 },
  gradeScore: { fontSize: 13, fontWeight: '900' },
  gradeMiniLetter: { fontSize: 10, fontWeight: '900', marginTop: 2 },
});
