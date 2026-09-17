import {
  createContext,
  PropsWithChildren,
  useContext,
  useRef,
  useState,
} from "react";
import { useCanvasData } from "./CanvasDataContext";
import {
  newerFeed,
  NotificationFeed,
  visibleNotices,
} from "@/services/notifications";

const API = (
  process.env.EXPO_PUBLIC_ACADENCE_API_URL || "http://localhost:8787"
).replace(/\/$/, "");
type NotificationsValue = {
  notices: ReturnType<typeof visibleNotices>;
  unread: number;
  loading: boolean;
  status: string | null;
  error: string | null;
  mark: (id: string) => void;
  markAll: () => void;
};
const Context = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { notificationFeed } = useCanvasData();
  return (
    <ScopedNotifications key={notificationFeed?.scope || "disconnected"}>
      {children}
    </ScopedNotifications>
  );
}

function ScopedNotifications({ children }: PropsWithChildren) {
  const {
    notificationFeed,
    courses,
    connected,
    loading,
    error: syncError,
  } = useCanvasData();
  const [acknowledged, setAcknowledged] = useState<NotificationFeed | null>(
    null,
  );
  const [pending, setPending] = useState(new Set<string>());
  const inFlight = useRef(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const feed = newerFeed(notificationFeed, acknowledged);
  const notices = visibleNotices(
    feed,
    courses.map((c) => String(c.id)),
    pending,
  );
  const markIds = async (ids: string[]) => {
    if (!feed) return;
    const scope = feed.scope;
    const targets = ids.filter((id) => !inFlight.current.has(id));
    if (!targets.length) return;
    targets.forEach((id) => inFlight.current.add(id));
    setPending(new Set(inFlight.current));
    setError(null);
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API}/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, ids: targets }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error("Unable to save read status. Please try again.");
      const next: NotificationFeed = await response.json();
      if (next.scope !== scope)
        throw new Error("The Canvas account changed. Refresh notifications.");
      setAcknowledged((previous) => newerFeed(previous, next));
    } catch {
      setError("Read status could not be saved. Please try again.");
    } finally {
      clearTimeout(timeout);
      targets.forEach((id) => inFlight.current.delete(id));
      setPending(new Set(inFlight.current));
    }
  };
  const status =
    loading && !feed
      ? "Loading notifications…"
      : !connected
        ? "Connect Canvas to see course updates."
        : !feed
          ? "Update the Acadence server to load Canvas notifications."
          : null;
  return (
    <Context.Provider
      value={{
        notices,
        unread: notices.filter((n) => !n.read).length,
        loading,
        status,
        error: error || syncError,
        mark: (id) => {
          void markIds([id]);
        },
        // Capture visible IDs now, so a concurrent new update remains unread.
        markAll: () => {
          void markIds(notices.filter((n) => !n.read).map((n) => n.id));
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useNotifications() {
  const value = useContext(Context);
  if (!value)
    throw new Error("useNotifications must be inside NotificationsProvider");
  return value;
}
