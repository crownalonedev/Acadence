import { createHash } from "node:crypto";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const COLLECTIONS = [
  "assignments",
  "grades",
  "announcements",
  "assignmentGroups",
];
const date = (value) =>
  Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const number = (value) =>
  value != null && Number.isFinite(Number(value)) ? Number(value) : null;
const key = (row) => JSON.stringify([String(row.courseId), String(row.id)]);
const stable = (value) => JSON.stringify(canonical(value));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}

// Both platforms render text, never HTML supplied by Canvas.
export function plainText(value) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return String(value || "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
      (match, entity) => {
        if (!entity.startsWith("#"))
          return entities[entity.toLowerCase()] || match;
        const n =
          entity[1].toLowerCase() === "x"
            ? parseInt(entity.slice(2), 16)
            : Number(entity.slice(1));
        return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
      },
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePayload(data, now) {
  if (
    data?.source !== "canvas" ||
    !data?.canvasOrigin ||
    data?.profile?.id == null ||
    !Array.isArray(data.courses) ||
    !Array.isArray(data.assignments)
  ) {
    throw Object.assign(
      new Error(
        "Invalid Canvas connector payload: a Canvas profile, courses and assignments are required.",
      ),
      { status: 400 },
    );
  }
  let origin;
  try {
    origin = new URL(data.canvasOrigin);
  } catch {
    /* validated below */
  }
  if (
    !origin ||
    !["https:", "http:"].includes(origin.protocol) ||
    !String(data.profile.id).trim()
  ) {
    throw Object.assign(new Error("Invalid Canvas identity."), { status: 400 });
  }
  const payload = {
    ...data,
    canvasOrigin: origin.origin,
    syncedAt: date(data.syncedAt) || now,
    receivedAt: now,
  };
  for (const type of ["courses", ...COLLECTIONS]) {
    payload[type] = (Array.isArray(data[type]) ? data[type] : []).filter(
      (row) =>
        row && row.id != null && (type === "courses" || row.courseId != null),
    );
  }
  return payload;
}

export const scopeFor = (payload) =>
  createHash("sha256")
    .update(JSON.stringify([payload.canvasOrigin, String(payload.profile.id)]))
    .digest("hex");
export const emptyAccount = () => ({
  revision: 0,
  sequence: 0,
  notifications: [],
  snapshots: {},
  initialized: {},
  latest: null,
});

function snapshot(type, row) {
  if (type === "assignments")
    return {
      name: plainText(row.name),
      dueAt: date(row.dueAt),
      pointsPossible: number(row.pointsPossible),
      assignmentGroupId: String(row.assignmentGroupId || ""),
    };
  if (type === "grades")
    return {
      score: number(row.score),
      grade: row.grade == null ? null : String(row.grade),
      pointsPossible: number(row.pointsPossible),
      excused: !!row.excused,
    };
  if (type === "announcements")
    return {
      title: plainText(row.title),
      message: plainText(row.message),
      postedAt: date(row.postedAt),
    };
  return {
    name: plainText(row.name),
    weight: number(row.weight),
    rules: {
      drop_lowest: number(row.rules?.drop_lowest) || 0,
      drop_highest: number(row.rules?.drop_highest) || 0,
      never_drop: (Array.isArray(row.rules?.never_drop)
        ? row.rules.never_drop
        : []
      )
        .map(String)
        .sort(),
    },
  };
}

function safeUrl(value, origin) {
  try {
    const url = new URL(value, origin);
    return url.origin === origin && ["https:", "http:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function syncAccount(account, payload, scope, now) {
  // Slow older uploads must not turn a deadline/grade back into a new change.
  if (
    account.latest &&
    Date.parse(payload.syncedAt) < Date.parse(account.latest.syncedAt)
  )
    return false;
  const courseName = (id) =>
    plainText(
      payload.courses.find((c) => String(c.id) === String(id))?.courseCode ||
        payload.courses.find((c) => String(c.id) === String(id))?.name ||
        "Canvas",
    );
  const recent = (value) => {
    const t = Date.parse(value);
    return t >= Date.parse(now) - WEEK && t <= Date.parse(now);
  };
  const add = (row, kind, title, body, occurredAt = now, dueAt) => {
    account.notifications.push({
      id: `${scope}:${++account.sequence}`,
      courseId: String(row.courseId),
      kind,
      title,
      body: `${courseName(row.courseId)} · ${body}`,
      occurredAt,
      readAt: null,
      dueAt,
      htmlUrl: row.htmlUrl
        ? safeUrl(row.htmlUrl, payload.canvasOrigin)
        : undefined,
    });
  };

  for (const type of COLLECTIONS) {
    const seen = (account.snapshots[type] ||= {});
    const initialized = (account.initialized[type] ||= {});
    const successful = payload.completeCourseIds?.[type];
    const completed = Array.isArray(successful)
      ? new Set(successful.map(String))
      : null;
    const rows = payload[type].filter(
      (row) => !completed || completed.has(String(row.courseId)),
    );
    for (const row of rows) {
      const id = key(row),
        courseKey = JSON.stringify(String(row.courseId)),
        old = seen[id],
        next = snapshot(type, row);
      const firstCourseSync = !initialized[courseKey];
      if (type === "assignments" && !firstCourseSync) {
        if (!old)
          add(row, "assignment", "New assignment", `${next.name} was added.`);
        else if (old.dueAt !== next.dueAt)
          add(
            row,
            "change",
            "Deadline changed",
            `${next.name}: ${next.dueAt ? "the due date changed." : "the due date was removed."}`,
            now,
            next.dueAt,
          );
        else if (stable(old) !== stable(next))
          add(
            row,
            "assignment",
            "Assignment updated",
            `${next.name}: assignment details changed.`,
          );
      }
      if (
        type === "grades" &&
        (next.score != null || next.grade != null || next.excused)
      ) {
        if (
          (!old && (!firstCourseSync || recent(row.gradedAt))) ||
          (old && stable(old) !== stable(next))
        ) {
          const result = next.excused
            ? "Excused"
            : next.score != null
              ? `${next.score}${next.pointsPossible != null ? ` / ${next.pointsPossible}` : ""}${next.grade != null ? ` (${next.grade})` : ""}`
              : next.grade;
          add(
            row,
            "grade",
            old ? "Grade updated" : "New grade posted",
            `${plainText(row.name)}: ${result}.`,
            !old && recent(row.gradedAt) ? date(row.gradedAt) : now,
          );
        }
      }
      if (
        type === "announcements" &&
        (!next.postedAt || Date.parse(next.postedAt) <= Date.parse(now))
      ) {
        if (
          (!old && (!firstCourseSync || recent(row.postedAt))) ||
          (old && stable(old) !== stable(next))
        ) {
          add(
            row,
            "announcement",
            old ? "Announcement updated" : "New announcement",
            `${next.title}${next.message ? ` — ${next.message.slice(0, 4000)}` : ""}`,
            !old && recent(row.postedAt) ? next.postedAt : now,
          );
        }
      }
      if (
        type === "assignmentGroups" &&
        !firstCourseSync &&
        (!old || stable(old) !== stable(next))
      ) {
        add(
          row,
          "group",
          old ? "Assignment group updated" : "New assignment group",
          `${next.name}: ${old ? "grading rules or group details changed" : "a grading group was added"}${next.weight != null ? ` (weight: ${next.weight}%)` : ""}.`,
        );
      }
      // Retain missing observations across partial responses. Do not observe future announcements.
      if (
        type !== "announcements" ||
        !next.postedAt ||
        Date.parse(next.postedAt) <= Date.parse(now)
      )
        seen[id] = next;
    }
    for (const courseId of completed || rows.map((row) => String(row.courseId)))
      initialized[JSON.stringify(String(courseId))] = true;
  }

  // Preserve the last good data for failed collections without hiding successful changes.
  const latest = { ...payload };
  for (const type of COLLECTIONS) {
    const successful = payload.completeCourseIds?.[type];
    const completed = Array.isArray(successful)
      ? new Set(successful.map(String))
      : null;
    const active = new Set(payload.courses.map((c) => String(c.id)));
    const incoming = new Map(
      payload[type]
        .filter((row) => !completed || completed.has(String(row.courseId)))
        .map((row) => [key(row), row]),
    );
    for (const row of account.latest?.[type] || []) {
      if (
        active.has(String(row.courseId)) &&
        (!completed || !completed.has(String(row.courseId))) &&
        !incoming.has(key(row))
      )
        incoming.set(key(row), row);
    }
    latest[type] = [...incoming.values()];
  }
  account.latest = latest;
  account.notifications.sort(
    (a, b) =>
      Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
      Number(b.id.split(":").at(-1)) - Number(a.id.split(":").at(-1)),
  );
  account.notifications = account.notifications.slice(0, 500);
  account.revision++;
  return true;
}

export function notificationFeed(scope, account) {
  return {
    scope,
    revision: account.revision,
    notifications: account.notifications,
  };
}
