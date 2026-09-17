import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  File,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers3,
  Megaphone,
} from 'lucide-react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { CourseAssetViewer, CourseViewerItem } from '@/components/CourseAssetViewer';
import { useCanvasData } from '@/context/CanvasDataContext';
import { useCourseAppearance } from '@/context/CourseAppearanceContext';
import { useAppTheme } from '@/context/ThemeContext';
import { calculateGrade, effectiveWeights, letterForScore } from '@/utils/grading';
import { radius } from '@/constants/theme';

const fallback =
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=80';

const TABS = [
  ['overview', 'Overview', BookOpen],
  ['syllabus', 'Syllabus', FileText],
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
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, text) => `\n• ${plainText(text)}`)
    .replace(/<\/(p|div|section|article|tr|table|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatFileSize(value?: number) {
  if (value == null || !Number.isFinite(value)) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function dueDetails(value?: string | null) {
  if (!value) return { label: 'No due date', exact: '', urgency: 'none' as const };
  const when = new Date(value);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startDue = new Date(when.getFullYear(), when.getMonth(), when.getDate()).getTime();
  const days = Math.round((startDue - startToday) / 86400000);
  const exact = when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (when.getTime() < Date.now()) return { label: 'Past due', exact, urgency: 'danger' as const };
  if (days === 0) return { label: 'Due today', exact, urgency: 'danger' as const };
  if (days === 1) return { label: 'Due tomorrow', exact, urgency: 'soon' as const };
  if (days <= 7) return { label: `Due in ${days} days`, exact, urgency: 'soon' as const };
  return { label: `Due ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, exact, urgency: 'normal' as const };
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 980;
  const {
    courses,
    assignments,
    announcements,
    grades,
    assignmentGroups,
    modules,
    files,
    pages,
  } = useCanvasData();
  const { appearance } = useCourseAppearance();
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<TabId>('overview');
  const [courseNavCollapsed, setCourseNavCollapsed] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<CourseViewerItem | null>(null);

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
        new Date(b.gradedAt || b.submittedAt || 0).getTime() -
        new Date(a.gradedAt || a.submittedAt || 0).getTime(),
    );
  const gradedIds = new Set(courseGrades.map((g) => String(g.assignmentId)));
  const isComplete = (a: (typeof courseAssignments)[number]) =>
    gradedIds.has(String(a.id)) ||
    !!a.submittedAt ||
    !!a.gradedAt ||
    !!a.excused ||
    ['submitted', 'graded', 'complete'].includes((a.submissionState || '').toLowerCase());
  const completionTime = (a: (typeof courseAssignments)[number]) => {
    const grade = courseGrades.find((g) => String(g.assignmentId) === String(a.id));
    return new Date(grade?.gradedAt || grade?.submittedAt || a.gradedAt || a.submittedAt || a.dueAt || 0).getTime();
  };

  const now = Date.now();
  const upcoming = courseAssignments
    .filter((a) => !!a.dueAt && new Date(a.dueAt).getTime() >= now && !isComplete(a))
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());
  const completedAssignments = courseAssignments
    .filter(isComplete)
    .sort((a, b) => completionTime(b) - completionTime(a));
  const otherAssignments = courseAssignments.filter(
    (a) => !isComplete(a) && (!a.dueAt || new Date(a.dueAt).getTime() < now),
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

  useEffect(() => {
    if (courseModules.length && openModules.size === 0) setOpenModules(new Set([String(courseModules[0].id)]));
  }, [courseModules.length]);

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
  const weights = effectiveWeights(course, assignmentGroups);
  const currentCalculated = calculateGrade(
    course,
    courseGrades.map((g) => ({
      id: String(g.assignmentId),
      assignmentGroupId: g.assignmentGroupId,
      score: g.score,
      pointsPossible: g.pointsPossible,
      excused: g.excused,
      omitFromFinalGrade: g.omitFromFinalGrade,
    })),
    assignmentGroups,
  );
  const currentScore = course.currentScore ?? currentCalculated.percent;
  const inferredLetter = letterForScore(currentScore, course);
  const currentLetter = course.currentGrade || inferredLetter.letter;

  const openInside = (item: CourseViewerItem) => setViewer(item);
  const fileViewer = (file: any): CourseViewerItem => ({
    title: file.displayName || file.filename || 'Course file',
    url: file.previewUrl || file.downloadUrl || file.htmlUrl,
    canvasUrl: file.htmlUrl,
    contentType: file.contentType,
    filename: file.filename || file.displayName,
  });

  const toggleModule = (moduleId: string) =>
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  const Empty = ({ children }: { children: string }) => (
    <View style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <Text style={[s.emptyText, { color: colors.muted }]}>{children}</Text>
    </View>
  );

  const AssignmentCard = ({ a }: { a: (typeof courseAssignments)[number] }) => {
    const complete = isComplete(a);
    const due = dueDetails(a.dueAt);
    const dueBg = complete
      ? colors.accentSoft
      : due.urgency === 'danger'
        ? 'rgba(180,79,74,.12)'
        : due.urgency === 'soon'
          ? 'rgba(194,143,56,.13)'
          : colors.accentSoft;
    const dueColor = complete ? colors.accent : due.urgency === 'danger' ? colors.danger : due.urgency === 'soon' ? '#9A6B18' : colors.accent;
    return (
      <Pressable
        onPress={() => a.htmlUrl && openInside({ title: a.name, url: a.htmlUrl, canvasUrl: a.htmlUrl })}
        disabled={!a.htmlUrl}
        style={({ hovered, pressed }: any) => [
          s.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          hovered && { transform: [{ translateY: -1 }] },
          pressed && { opacity: 0.82 },
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.task, { color: colors.text }]}>{a.name}</Text>
          <View style={[s.dueChip, { backgroundColor: dueBg }]}> 
            <Clock3 size={13} color={dueColor} />
            <View>
              <Text style={[s.dueLabel, { color: dueColor }]}>{complete ? 'Completed' : due.label}</Text>
              {due.exact ? <Text style={[s.dueExact, { color: colors.muted }]}>{due.exact}</Text> : null}
            </View>
          </View>
        </View>
        <View style={s.rightMeta}>
          {a.pointsPossible != null ? <Text style={[s.points, { color: colors.text }]}>{a.pointsPossible} pts</Text> : null}
          <Text style={[s.status, { color: complete ? colors.accent : colors.muted }]}>{complete ? 'Completed' : due.urgency === 'danger' ? 'Needs attention' : 'Upcoming'}</Text>
        </View>
      </Pressable>
    );
  };

  const content = (
    <>
      {viewer ? <CourseAssetViewer item={viewer} onClose={() => setViewer(null)} /> : null}

      {!viewer ? (
        <>
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
                  <Text style={[s.meta, { color: colors.muted }]}>Course updates from Canvas</Text>
                </View>
                <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <Layers3 size={18} color={colors.accent} />
                  <Text style={[s.summaryTitle, { color: colors.text }]}>Modules</Text>
                  <Text style={[s.summaryNumber, { color: colors.text }]}>{courseModules.length}</Text>
                  <Text style={[s.meta, { color: colors.muted }]}>Expandable course material</Text>
                </View>
                <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <FolderOpen size={18} color={colors.accent} />
                  <Text style={[s.summaryTitle, { color: colors.text }]}>Files</Text>
                  <Text style={[s.summaryNumber, { color: colors.text }]}>{courseFiles.length}</Text>
                  <Text style={[s.meta, { color: colors.muted }]}>Open inside Acadence</Text>
                </View>
              </View>

              {plainText(course.syllabusBody) ? (
                <Pressable onPress={() => setTab('syllabus')} style={[s.syllabusPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><FileText size={16} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.summaryTitle, { color: colors.text }]}>Syllabus</Text>
                    <Text numberOfLines={2} style={[s.body, { color: colors.muted }]}>{plainText(course.syllabusBody)}</Text>
                  </View>
                  <ChevronRight size={17} color={colors.muted} />
                </Pressable>
              ) : null}
            </>
          ) : null}

          {tab === 'syllabus' ? (
            <>
              <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Syllabus</Text></View>
              {plainText(course.syllabusBody) ? (
                <View style={[s.syllabus, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <Text selectable style={[s.syllabusText, { color: colors.text }]}>{plainText(course.syllabusBody)}</Text>
                </View>
              ) : <Empty>No syllabus text was provided by Canvas for this course.</Empty>}
            </>
          ) : null}

          {tab === 'modules' ? (
            <>
              <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Modules</Text><Text style={[s.count, { color: colors.muted }]}>{courseModules.length}</Text></View>
              {courseModules.length ? courseModules.map((module) => {
                const open = openModules.has(String(module.id));
                return (
                  <Animated.View key={module.id} layout={Layout.springify().damping(22).stiffness(280)} style={[s.moduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                    <Pressable
                      onPress={() => toggleModule(String(module.id))}
                      style={({ hovered }: any) => [s.moduleHead, hovered && { backgroundColor: colors.accentSoft }]}
                    >
                      <View style={[s.moduleIcon, { backgroundColor: colors.accentSoft }]}><Layers3 size={17} color={colors.accent} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.moduleTitle, { color: colors.text }]}>{module.name}</Text>
                        <Text style={[s.meta, { color: colors.muted }]}>{module.items?.length || 0} item{module.items?.length === 1 ? '' : 's'}{module.unlockAt ? ` · unlocks ${new Date(module.unlockAt).toLocaleString()}` : ''}</Text>
                      </View>
                      {open ? <ChevronDown size={18} color={colors.muted} /> : <ChevronRight size={18} color={colors.muted} />}
                    </Pressable>
                    {open ? (
                      <Animated.View layout={Layout.springify()}>
                        {(module.items || []).sort((a, b) => (a.position || 0) - (b.position || 0)).map((item) => {
                          const linkedFile = item.type === 'File' ? courseFiles.find((file) => String(file.id) === String(item.contentId)) : undefined;
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => {
                                if (linkedFile) openInside(fileViewer(linkedFile));
                                else if (item.htmlUrl) openInside({ title: item.title, url: item.htmlUrl, canvasUrl: item.htmlUrl });
                              }}
                              disabled={!linkedFile && !item.htmlUrl}
                              style={({ hovered }: any) => [s.moduleItem, { borderTopColor: colors.border }, hovered && { backgroundColor: colors.accentSoft }]}
                            >
                              <FileText size={15} color={colors.muted} />
                              <View style={{ flex: 1 }}>
                                <Text style={[s.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[s.meta, { color: colors.muted }]}>{item.type || 'Module item'}</Text>
                              </View>
                              <ChevronRight size={15} color={colors.muted} />
                            </Pressable>
                          );
                        })}
                      </Animated.View>
                    ) : null}
                  </Animated.View>
                );
              }) : <Empty>Modules haven’t synced yet. Reload the Acadence extension and sync Canvas once.</Empty>}
            </>
          ) : null}

          {tab === 'assignments' ? (
            <>
              <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Upcoming</Text><Text style={[s.count, { color: colors.muted }]}>{upcoming.length}</Text></View>
              {upcoming.length ? upcoming.map((a) => <AssignmentCard key={String(a.id)} a={a} />) : <Empty>No upcoming assignments.</Empty>}

              <View style={[s.sectionHead, { marginTop: 26 }]}><Text style={[s.section, { color: colors.text }]}>Completed</Text><Text style={[s.count, { color: colors.muted }]}>{completedAssignments.length}</Text></View>
              {completedAssignments.length ? completedAssignments.map((a) => <AssignmentCard key={String(a.id)} a={a} />) : <Empty>No completed assignments yet.</Empty>}

              {otherAssignments.length ? (
                <>
                  <View style={[s.sectionHead, { marginTop: 26 }]}><Text style={[s.section, { color: colors.text }]}>Needs attention</Text><Text style={[s.count, { color: colors.muted }]}>{otherAssignments.length}</Text></View>
                  {otherAssignments.map((a) => <AssignmentCard key={String(a.id)} a={a} />)}
                </>
              ) : null}
            </>
          ) : null}

          {tab === 'announcements' ? (
            <>
              <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Announcements</Text><Text style={[s.count, { color: colors.muted }]}>{courseAnnouncements.length}</Text></View>
              {courseAnnouncements.length ? courseAnnouncements.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => a.htmlUrl && openInside({ title: a.title, url: a.htmlUrl, canvasUrl: a.htmlUrl })}
                  disabled={!a.htmlUrl}
                  style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><Megaphone size={16} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{a.title}</Text><Text numberOfLines={3} style={[s.body, { color: colors.muted }]}>{plainText(a.message)}</Text><Text style={[s.meta, { color: colors.muted }]}>{a.author ? `${a.author} · ` : ''}{a.postedAt ? new Date(a.postedAt).toLocaleString() : ''}</Text></View>
                </Pressable>
              )) : <Empty>No announcements found for this course.</Empty>}
            </>
          ) : null}

          {tab === 'grades' ? (
            <>
              <View style={s.gradeHeroRow}>
                <View style={[s.gradeSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <Text style={[s.gradeEyebrow, { color: colors.muted }]}>CURRENT COURSE GRADE</Text>
                  <View style={s.gradeScoreRow}>
                    <Text style={[s.gradeBig, { color: colors.text }]}>{currentScore != null ? `${Math.round(currentScore * 10) / 10}%` : '—'}</Text>
                    {currentLetter ? <View style={[s.letterPill, { backgroundColor: colors.accentSoft }]}><Text style={[s.letterPillText, { color: colors.accent }]}>{currentLetter}</Text></View> : null}
                  </View>
                  <Text style={[s.meta, { color: colors.muted }]}>{weights.length ? `${weights[0].source === 'canvas' ? 'Canvas' : 'Syllabus'} weighted grading` : 'Points-based grading'}{inferredLetter.estimated && !course.currentGrade ? ' · letter estimated' : ''}</Text>
                </View>
                <View style={[s.gradeSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <Text style={[s.gradeEyebrow, { color: colors.muted }]}>GRADED ITEMS</Text>
                  <Text style={[s.gradeBig, { color: colors.text }]}>{courseGrades.length}</Text>
                  <Text style={[s.meta, { color: colors.muted }]}>Synced from Canvas</Text>
                </View>
              </View>

              <View style={[s.weightsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Grade weights</Text><Text style={[s.count, { color: colors.muted }]}>{weights.length ? `${Math.round(weights.reduce((n, w) => n + w.weight, 0))}%` : 'Points'}</Text></View>
                {weights.length ? weights.map((weight) => (
                  <View key={weight.id} style={s.weightRow}>
                    <Text style={[s.weightName, { color: colors.text }]}>{weight.name}</Text>
                    <View style={[s.weightTrack, { backgroundColor: colors.accentSoft }]}><View style={[s.weightFill, { width: `${Math.min(100, weight.weight)}%`, backgroundColor: colors.accent }]} /></View>
                    <Text style={[s.weightValue, { color: colors.text }]}>{weight.weight}%</Text>
                  </View>
                )) : <Text style={[s.body, { color: colors.muted }]}>This course currently uses points earned ÷ points possible because Canvas and the syllabus did not expose a complete weight table.</Text>}
              </View>

              <View style={[s.sectionHead, { marginTop: 24 }]}><Text style={[s.section, { color: colors.text }]}>Grade history</Text><Text style={[s.count, { color: colors.muted }]}>{courseGrades.length}</Text></View>
              {courseGrades.length ? courseGrades.map((g) => {
                const pct = g.score != null && g.pointsPossible ? (Number(g.score) / Number(g.pointsPossible)) * 100 : null;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => g.htmlUrl && openInside({ title: g.name, url: g.htmlUrl, canvasUrl: g.htmlUrl })}
                    disabled={!g.htmlUrl}
                    style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><GraduationCap size={16} color={colors.accent} /></View>
                    <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{g.name}</Text><Text style={[s.meta, { color: colors.muted }]}>{g.gradedAt ? `Graded ${new Date(g.gradedAt).toLocaleString()}` : 'Graded'}</Text></View>
                    <View style={{ alignItems: 'flex-end' }}><Text style={[s.gradeValue, { color: colors.text }]}>{g.excused ? 'Excused' : g.score != null ? `${g.score}${g.pointsPossible != null ? ` / ${g.pointsPossible}` : ''}` : g.grade || '—'}</Text>{pct != null ? <Text style={[s.meta, { color: colors.accent }]}>{Math.round(pct)}%</Text> : null}</View>
                  </Pressable>
                );
              }) : <Empty>No grades have been synced for this course yet.</Empty>}
            </>
          ) : null}

          {tab === 'files' ? (
            <>
              <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Files</Text><Text style={[s.count, { color: colors.muted }]}>{courseFiles.length}</Text></View>
              {courseFiles.length ? courseFiles.map((file: any) => (
                <Pressable
                  key={file.id}
                  onPress={() => openInside(fileViewer(file))}
                  style={({ hovered }: any) => [s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }, hovered && { transform: [{ translateY: -1 }] }]}
                >
                  <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><File size={16} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{file.displayName}</Text><Text style={[s.meta, { color: colors.muted }]}>{[file.contentType, formatFileSize(file.size), file.updatedAt ? `Updated ${new Date(file.updatedAt).toLocaleDateString()}` : ''].filter(Boolean).join(' · ')}</Text></View>
                  <View style={[s.openChip, { backgroundColor: colors.accentSoft }]}><Text style={[s.openChipText, { color: colors.accent }]}>Open here</Text></View>
                </Pressable>
              )) : <Empty>No files found for this course.</Empty>}
            </>
          ) : null}

          {tab === 'pages' ? (
            <>
              <View style={s.sectionHead}><Text style={[s.section, { color: colors.text }]}>Pages</Text><Text style={[s.count, { color: colors.muted }]}>{coursePages.length}</Text></View>
              {coursePages.length ? coursePages.map((page) => (
                <Pressable
                  key={page.id}
                  onPress={() => page.htmlUrl && openInside({ title: page.title, url: page.htmlUrl, canvasUrl: page.htmlUrl })}
                  disabled={!page.htmlUrl}
                  style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[s.contentIcon, { backgroundColor: colors.accentSoft }]}><FileText size={16} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}><Text style={[s.itemTitle, { color: colors.text }]}>{page.title}</Text><Text style={[s.meta, { color: colors.muted }]}>{page.frontPage ? 'Front page' : 'Canvas page'}{page.updatedAt ? ` · Updated ${new Date(page.updatedAt).toLocaleDateString()}` : ''}</Text></View>
                  <ChevronRight size={16} color={colors.muted} />
                </Pressable>
              )) : <Empty>No pages found for this course.</Empty>}
            </>
          ) : null}
        </>
      ) : null}
    </>
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
            {currentScore != null ? (
              <View style={s.grade}><Text style={s.gradeText}>{Math.round(currentScore * 10) / 10}%{currentLetter ? ` · ${currentLetter}` : ''}</Text></View>
            ) : null}
          </View>
        </View>
      </View>

      {desktop ? (
        <View style={s.courseShell}>
          <View style={[s.courseRail, courseNavCollapsed && s.courseRailCollapsed, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={s.courseRailHead}>
              {!courseNavCollapsed ? <Text style={[s.railTitle, { color: colors.text }]}>Course menu</Text> : null}
              <Pressable
                accessibilityLabel={courseNavCollapsed ? 'Expand course navigation' : 'Collapse course navigation'}
                onPress={() => setCourseNavCollapsed((value) => !value)}
                style={[s.railCollapse, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                {courseNavCollapsed ? <ChevronRight size={15} color={colors.muted} /> : <ChevronLeft size={15} color={colors.muted} />}
              </Pressable>
            </View>
            <View style={s.railItems}>
              {TABS.map(([key, label, Icon]) => {
                const active = tab === key && !viewer;
                return (
                  <div key={key} title={courseNavCollapsed ? label : undefined} style={{ width: '100%' }}>
                    <Pressable
                      onPress={() => { setTab(key); setViewer(null); }}
                      style={({ hovered }: any) => [
                        s.railItem,
                        courseNavCollapsed && s.railItemCollapsed,
                        { backgroundColor: active ? colors.accentSoft : 'transparent' },
                        hovered && !active && { backgroundColor: colors.background },
                      ]}
                    >
                      <Icon size={17} color={active ? colors.accent : colors.muted} />
                      {!courseNavCollapsed ? <Text style={[s.railLabel, { color: active ? colors.accent : colors.text }]}>{label}</Text> : null}
                    </Pressable>
                  </div>
                );
              })}
            </View>
          </View>
          <View style={s.courseContent}>{content}</View>
        </View>
      ) : (
        <>
          <View style={s.tabs}>
            {TABS.map(([key, label, Icon]) => {
              const active = tab === key && !viewer;
              return (
                <Pressable key={key} onPress={() => { setTab(key); setViewer(null); }} style={[s.tab, { backgroundColor: active ? colors.accentSoft : colors.surface, borderColor: active ? colors.accentSoft : colors.border }]}>
                  <Icon size={15} color={active ? colors.accent : colors.muted} />
                  <Text style={[s.tabText, { color: active ? colors.accent : colors.muted }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {content}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14, marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '900' },
  hero: { height: 220, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 18 },
  shade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8,17,13,.38)' },
  heroText: { position: 'absolute', left: 24, right: 24, bottom: 22 },
  heroCode: { color: 'rgba(255,255,255,.76)', fontSize: 11, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 5, maxWidth: 780 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,.78)', fontSize: 12 },
  grade: { backgroundColor: 'rgba(10,22,16,.72)', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7 },
  gradeText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  courseShell: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  courseRail: { width: 190, borderWidth: 1, borderRadius: 16, padding: 10, position: 'sticky' as any, top: 12 },
  courseRailCollapsed: { width: 62 },
  courseRailHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: 4, marginBottom: 8 },
  railTitle: { fontSize: 12, fontWeight: '900' },
  railCollapse: { width: 30, height: 30, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  railItems: { gap: 4 },
  railItem: { minHeight: 42, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10 },
  railItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  railLabel: { fontSize: 12, fontWeight: '800' },
  courseContent: { flex: 1, minWidth: 0 },
  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 26 },
  tab: { minHeight: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 12, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  section: { fontSize: 20, fontWeight: '900' },
  count: { fontSize: 12, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  task: { fontSize: 15, fontWeight: '900' },
  dueChip: { alignSelf: 'flex-start', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6, marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueLabel: { fontSize: 11, fontWeight: '900' },
  dueExact: { fontSize: 9, marginTop: 1 },
  rightMeta: { alignItems: 'flex-end', gap: 4 },
  points: { fontSize: 12, fontWeight: '900' },
  status: { fontSize: 10, fontWeight: '900' },
  meta: { fontSize: 11, lineHeight: 16 },
  body: { fontSize: 12, lineHeight: 19, marginTop: 5 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  summaryCard: { flexGrow: 1, flexBasis: 180, minWidth: 170, borderWidth: 1, borderRadius: 15, padding: 14 },
  summaryTitle: { fontSize: 12, fontWeight: '900', marginTop: 10 },
  summaryNumber: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  syllabusPreview: { marginTop: 12, borderWidth: 1, borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  syllabus: { borderWidth: 1, borderRadius: 18, padding: 22 },
  syllabusText: { fontSize: 14, lineHeight: 23 },
  moduleCard: { borderWidth: 1, borderRadius: 15, marginBottom: 10, overflow: 'hidden' },
  moduleHead: { minHeight: 66, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  moduleIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  moduleTitle: { fontSize: 14, fontWeight: '900' },
  moduleItem: { minHeight: 54, borderTopWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { fontSize: 13, fontWeight: '900' },
  contentCard: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  contentIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  openChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  openChipText: { fontSize: 10, fontWeight: '900' },
  gradeHeroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gradeSummary: { flexGrow: 1, flexBasis: 220, minWidth: 200, borderWidth: 1, borderRadius: 16, padding: 17 },
  gradeEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  gradeScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  gradeBig: { fontSize: 32, fontWeight: '900' },
  letterPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  letterPillText: { fontSize: 13, fontWeight: '900' },
  weightsCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 10 },
  weightRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightName: { width: 130, fontSize: 12, fontWeight: '800' },
  weightTrack: { flex: 1, height: 7, borderRadius: 999, overflow: 'hidden' },
  weightFill: { height: '100%', borderRadius: 999 },
  weightValue: { width: 42, textAlign: 'right', fontSize: 12, fontWeight: '900' },
  gradeValue: { fontSize: 13, fontWeight: '900' },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18 },
  emptyText: { fontSize: 12 },
});
