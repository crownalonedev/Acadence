import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { NotificationFeed } from "@/services/notifications";

const API = (
  process.env.EXPO_PUBLIC_ACADENCE_API_URL || "http://localhost:8787"
).replace(/\/$/, "");
const KEY = "acadence.currentCourses";

export type SyncedGradingSchemeEntry = { name: string; value: number };
export type SyncedWeightHint = { name: string; weight: number };

export type SyncedCourse = {
  id: string | number;
  name: string;
  courseCode?: string;
  color?: string;
  startAt?: string | null;
  endAt?: string | null;
  syllabusBody?: string;
  syllabusWeights?: SyncedWeightHint[];
  applyAssignmentGroupWeights?: boolean;
  gradingStandardId?: string;
  gradingScheme?: SyncedGradingSchemeEntry[];
  currentScore?: number | null;
  currentGrade?: string | null;
  finalScore?: number | null;
  finalGrade?: string | null;
};

export type SyncedAssignment = {
  id: string | number;
  courseId: string | number;
  assignmentGroupId?: string;
  name: string;
  description?: string;
  dueAt?: string | null;
  pointsPossible?: number | null;
  gradingType?: string;
  omitFromFinalGrade?: boolean;
  htmlUrl?: string;
  submissionState?: string | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
  excused?: boolean;
  missing?: boolean;
  late?: boolean;
};

export type SyncedAnnouncement = {
  id: string;
  courseId: string;
  title: string;
  message: string;
  postedAt?: string;
  author?: string;
  htmlUrl?: string;
};

export type SyncedGrade = {
  id: string;
  courseId: string;
  assignmentId: string;
  assignmentGroupId?: string;
  name: string;
  score?: number | null;
  grade?: string | null;
  pointsPossible?: number | null;
  gradingType?: string;
  omitFromFinalGrade?: boolean;
  gradedAt?: string | null;
  submittedAt?: string | null;
  excused?: boolean;
  late?: boolean;
  missing?: boolean;
  htmlUrl?: string;
};

export type SyncedAssignmentGroup = {
  id: string;
  courseId: string;
  name: string;
  weight: number;
  rules?: any;
  position?: number;
};

export type SyncedModuleItem = {
  id: string;
  moduleId: string;
  title: string;
  type?: string;
  position?: number;
  indent?: number;
  contentId?: string;
  pageUrl?: string;
  htmlUrl?: string;
  completionRequirement?: any;
};

export type SyncedModule = {
  id: string;
  courseId: string;
  name: string;
  position?: number;
  state?: string;
  unlockAt?: string | null;
  prerequisiteModuleIds?: string[];
  items?: SyncedModuleItem[];
};

export type SyncedFile = {
  id: string;
  courseId: string;
  displayName: string;
  filename?: string;
  contentType?: string;
  size?: number;
  updatedAt?: string;
  downloadUrl?: string;
  previewUrl?: string;
  publicUrl?: string;
  htmlUrl?: string;
};

export type SyncedPage = {
  id: string;
  courseId: string;
  title: string;
  url?: string;
  body?: string;
  updatedAt?: string;
  frontPage?: boolean;
  htmlUrl?: string;
};

type CanvasData = {
  connected: boolean;
  canvasOrigin?: string;
  profile?: any;
  allCourses: SyncedCourse[];
  courses: SyncedCourse[];
  allAssignments: SyncedAssignment[];
  assignments: SyncedAssignment[];
  allAnnouncements: SyncedAnnouncement[];
  announcements: SyncedAnnouncement[];
  allGrades: SyncedGrade[];
  grades: SyncedGrade[];
  allAssignmentGroups: SyncedAssignmentGroup[];
  assignmentGroups: SyncedAssignmentGroup[];
  allModules: SyncedModule[];
  modules: SyncedModule[];
  allFiles: SyncedFile[];
  files: SyncedFile[];
  allPages: SyncedPage[];
  pages: SyncedPage[];
  selectedCourseIds: string[];
  setSelectedCourseIds: (ids: string[]) => void;
  syncedAt?: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  notificationFeed: NotificationFeed | null;
};

const C = createContext<CanvasData | null>(null);
const empty = () => ({
  connected: false,
  courses: [],
  assignments: [],
  announcements: [],
  grades: [],
  assignmentGroups: [],
  modules: [],
  files: [],
  pages: [],
  notificationFeed: null,
});

const loadSelection = (): string[] => {
  try {
    const value =
      typeof localStorage === "undefined"
        ? []
        : JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

export function CanvasDataProvider({ children }: PropsWithChildren) {
  const [raw, setRaw] = useState<any>(empty);
  const [selectedCourseIds, setSelectedState] = useState<string[]>(loadSelection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const setSelectedCourseIds = (ids: string[]) => {
    setSelectedState(ids);
    try {
      if (typeof localStorage !== "undefined")
        localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* Preferences still work in memory. */
    }
  };

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API}/api/connector/data`, { signal: controller.signal });
      if (response.status === 404) {
        setRaw(empty());
        setError(null);
        return;
      }
      if (!response.ok) throw new Error("Canvas refresh failed.");
      const data = await response.json();
      setRaw({
        connected: true,
        canvasOrigin: data.canvasOrigin,
        profile: data.profile,
        courses: data.courses || [],
        assignments: data.assignments || [],
        announcements: data.announcements || [],
        grades: data.grades || [],
        assignmentGroups: data.assignmentGroups || [],
        modules: data.modules || [],
        files: data.files || [],
        pages: data.pages || [],
        syncedAt: data.receivedAt,
        notificationFeed: data.notificationFeed || null,
      });
      setError(null);
    } catch {
      setError("Unable to refresh Canvas. Showing the last synced updates.");
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 15000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    const onFocus = () => void refresh();
    if (typeof window !== "undefined") window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      subscription.remove();
      if (typeof window !== "undefined") window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const value = useMemo(() => {
    const allCourses: SyncedCourse[] = raw.courses,
      allAssignments: SyncedAssignment[] = raw.assignments,
      allAnnouncements: SyncedAnnouncement[] = raw.announcements,
      allGrades: SyncedGrade[] = raw.grades,
      allAssignmentGroups: SyncedAssignmentGroup[] = raw.assignmentGroups,
      allModules: SyncedModule[] = raw.modules,
      allFiles: SyncedFile[] = raw.files,
      allPages: SyncedPage[] = raw.pages;
    const valid = selectedCourseIds.filter((id) =>
      allCourses.some((c) => String(c.id) === id),
    );
    const activeIds = new Set(
      valid.length ? valid : allCourses.map((c) => String(c.id)),
    );
    const active = (row: { courseId: string | number }) =>
      activeIds.has(String(row.courseId));
    return {
      connected: raw.connected,
      canvasOrigin: raw.canvasOrigin,
      profile: raw.profile,
      allCourses,
      courses: allCourses.filter((c) => activeIds.has(String(c.id))),
      allAssignments,
      assignments: allAssignments.filter(active),
      allAnnouncements,
      announcements: allAnnouncements.filter(active),
      allGrades,
      grades: allGrades.filter(active),
      allAssignmentGroups,
      assignmentGroups: allAssignmentGroups.filter(active),
      allModules,
      modules: allModules.filter(active),
      allFiles,
      files: allFiles.filter(active),
      allPages,
      pages: allPages.filter(active),
      selectedCourseIds: valid,
      setSelectedCourseIds,
      syncedAt: raw.syncedAt,
      loading,
      error,
      refresh,
      notificationFeed: raw.notificationFeed,
    };
  }, [raw, selectedCourseIds, loading, error, refresh]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useCanvasData() {
  const value = useContext(C);
  if (!value) throw new Error("useCanvasData must be inside CanvasDataProvider");
  return value;
}
