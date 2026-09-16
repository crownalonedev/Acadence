export type CanvasNotice = {
  id: string;
  courseId: string;
  kind: "assignment" | "change" | "grade" | "announcement" | "group";
  title: string;
  body: string;
  occurredAt: string;
  readAt: string | null;
  dueAt?: string | null;
  htmlUrl?: string;
};
export type NotificationFeed = {
  scope: string;
  revision: number;
  notifications: CanvasNotice[];
};

// A poll started before a read acknowledgment must never undo that acknowledgment.
export function newerFeed(
  current: NotificationFeed | null,
  incoming: NotificationFeed | null,
) {
  if (!incoming) return current;
  if (
    !current ||
    current.scope !== incoming.scope ||
    incoming.revision > current.revision
  )
    return incoming;
  return current;
}

export function visibleNotices(
  feed: NotificationFeed | null,
  courseIds: string[],
  pendingIds: Set<string>,
) {
  const active = new Set(courseIds);
  return (feed?.notifications || [])
    .filter((n) => active.has(String(n.courseId)))
    .map((n) => ({
      ...n,
      read: !!n.readAt || pendingIds.has(n.id),
      body: n.dueAt
        ? `${n.body} New deadline: ${new Date(n.dueAt).toLocaleString()}.`
        : n.body,
      time: notificationTime(n.occurredAt),
    }));
}

export function notificationTime(value: string, now = Date.now()) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
