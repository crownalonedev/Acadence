import assert from "node:assert/strict";
import { test } from "node:test";
import {
  newerFeed,
  notificationTime,
  visibleNotices,
} from "../services/notifications.ts";
import type { NotificationFeed } from "../services/notifications.ts";

const base: NotificationFeed = {
  scope: "student",
  revision: 1,
  notifications: [
    {
      id: "a",
      courseId: "1",
      kind: "grade",
      title: "Grade",
      body: "Score",
      occurredAt: "2026-09-16T12:00:00Z",
      readAt: null,
    },
    {
      id: "b",
      courseId: "2",
      kind: "announcement",
      title: "News",
      body: "News",
      occurredAt: "2026-09-16T11:00:00Z",
      readAt: null,
    },
  ],
};
test("an older poll or acknowledgment cannot undo a newer read", () => {
  const read = {
    ...base,
    revision: 3,
    notifications: base.notifications.map((n) => ({
      ...n,
      readAt: "2026-09-16T12:01:00Z",
    })),
  };
  assert.equal(newerFeed(read, base), read);
  assert.equal(newerFeed(base, read), read);
  assert.equal(newerFeed(read, { ...base, revision: 2 }), read);
});
test("course filtering, optimistic reads and failure rollback preserve source data", () => {
  assert.equal(visibleNotices(base, ["1"], new Set()).length, 1);
  assert.equal(visibleNotices(base, ["1"], new Set(["a"]))[0].read, true);
  assert.equal(visibleNotices(base, ["1"], new Set())[0].read, false);
  assert.equal(base.notifications[0].readAt, null);
  assert.equal(
    visibleNotices(base, ["1", "2"], new Set(["a"])).filter((n) => !n.read)
      .length,
    1,
  );
  assert.equal(visibleNotices(base, [], new Set()).length, 0);
});
test("timestamps handle invalid and future times", () => {
  assert.equal(notificationTime("invalid"), "");
  assert.equal(
    notificationTime(
      "2026-09-16T12:00:00Z",
      Date.parse("2026-09-16T11:00:00Z"),
    ),
    "Just now",
  );
  assert.equal(
    notificationTime(
      "2026-09-16T12:00:00Z",
      Date.parse("2026-09-16T12:03:00Z"),
    ),
    "3 min ago",
  );
});
