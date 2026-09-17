import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";

const NOW = "2026-09-16T12:00:00.000Z";
const recent = "2026-09-15T12:00:00.000Z";
function payload(overrides = {}) {
  return {
    source: "canvas",
    canvasOrigin: "https://school.instructure.com",
    profile: { id: "42", name: "Student" },
    syncedAt: NOW,
    courses: [{ id: "10", name: "Computer Science", courseCode: "CS 201" }],
    assignments: [
      {
        id: "1",
        courseId: "10",
        name: "Project",
        dueAt: "2026-09-20T23:59:00Z",
        pointsPossible: 100,
        assignmentGroupId: "5",
      },
    ],
    grades: [
      {
        id: "10:2",
        courseId: "10",
        assignmentId: "2",
        name: "Quiz",
        score: 0,
        grade: "0",
        pointsPossible: 10,
        gradedAt: recent,
      },
    ],
    announcements: [
      {
        id: "3",
        courseId: "10",
        title: "Welcome",
        message: "<p>Read &amp; prepare</p>",
        postedAt: recent,
        htmlUrl: "https://school.instructure.com/courses/10/announcements/3",
      },
    ],
    assignmentGroups: [
      { id: "5", courseId: "10", name: "Projects", weight: 30, rules: {} },
    ],
    completeCourseIds: {
      assignments: ["10"],
      grades: ["10"],
      announcements: ["10"],
      assignmentGroups: ["10"],
    },
    ...overrides,
  };
}
async function harness(t) {
  const dir = await mkdtemp(join(tmpdir(), "acadence-"));
  const file = join(dir, "store.json");
  let server, origin;
  const start = async () => {
    server = createApp(await createStore(file), () => NOW).listen(
      0,
      "127.0.0.1",
    );
    await once(server, "listening");
    origin = `http://127.0.0.1:${server.address().port}`;
  };
  const close = async () => {
    if (server) {
      const closed = once(server, "close");
      server.close();
      server.closeAllConnections();
      await closed;
    }
  };
  await start();
  t.after(async () => {
    await close();
    await rm(dir, { recursive: true, force: true });
  });
  const request = async (path, body) => {
    const response = await fetch(
      `${origin}${path}`,
      body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
    );
    return { status: response.status, body: await response.json() };
  };
  return {
    request,
    sync: (data) => request("/api/connector/sync", data),
    feed: async () =>
      (await request("/api/connector/data")).body.notificationFeed,
    restart: async () => {
      await close();
      await start();
    },
  };
}

test("initial backfill includes the full available announcement/grade history; zero is a grade", async (t) => {
  const h = await harness(t),
    data = payload();
  for (const [id, time] of [
    ["old", "2026-08-01T11:59:59Z"],
    ["boundary", "2026-09-09T12:00:00Z"],
    ["future", "2026-09-17T00:00:00Z"],
    ["unknown", null],
  ]) {
    data.grades.push({ ...data.grades[0], id, gradedAt: time });
    data.announcements.push({ ...data.announcements[0], id, postedAt: time });
  }
  assert.equal((await h.sync(data)).status, 200);
  const { notifications } = await h.feed();
  assert.equal(notifications.length, 9);
  assert.equal(notifications.filter((n) => n.kind === "grade").length, 5);
  assert.equal(notifications.filter((n) => n.kind === "announcement").length, 4);
  assert.ok(notifications.some((n) => n.occurredAt === "2026-08-01T11:59:59.000Z"));
  assert.ok(notifications.some((n) => n.body.includes("0 / 10")));
  assert.ok(notifications.some((n) => n.body.includes("Read & prepare")));
  assert.ok(notifications.every((n) => n.readAt === null));
});

test("repeat/reordered/partial syncs preserve IDs, read state and last good data across restart", async (t) => {
  const h = await harness(t),
    data = payload();
  await h.sync(data);
  const before = await h.feed();
  const read = await h.request("/api/notifications/read", {
    scope: before.scope,
    ids: [before.notifications[0].id],
  });
  assert.equal(read.status, 200);
  await h.sync({
    ...data,
    assignments: [],
    grades: [],
    announcements: [],
    assignmentGroups: [],
    completeCourseIds: {
      assignments: [],
      grades: [],
      announcements: [],
      assignmentGroups: [],
    },
  });
  const stored = (await h.request("/api/connector/data")).body;
  assert.equal(stored.assignments.length, 1);
  assert.equal(stored.grades.length, 1);
  await h.restart();
  await h.sync({
    ...data,
    grades: [...data.grades].reverse(),
    receivedAt: "irrelevant",
  });
  const after = await h.feed();
  assert.deepEqual(
    after.notifications.map((n) => n.id),
    before.notifications.map((n) => n.id),
  );
  assert.equal(after.notifications.filter((n) => n.readAt).length, 1);
});

test("changes create distinct alerts, including repeated deadline transitions, without timestamp-only noise", async (t) => {
  const h = await harness(t),
    data = payload();
  await h.sync(data);
  const changed = structuredClone(data);
  changed.assignments[0].dueAt = null;
  changed.assignments.push({
    ...data.assignments[0],
    id: "new",
    name: "New project",
  });
  changed.grades[0].score = 9;
  changed.announcements[0].message = "Edited announcement";
  changed.assignmentGroups[0].weight = 40;
  await h.sync(changed);
  const updated = await h.feed();
  assert.equal(updated.notifications.length, 7);
  assert.ok(
    updated.notifications.some((n) => n.body.includes("due date was removed")),
  );
  for (const kind of ["change", "assignment", "grade", "announcement", "group"])
    assert.ok(updated.notifications.some((n) => n.kind === kind));
  changed.grades[0].gradedAt = NOW;
  changed.assignmentGroups[0].position = 9;
  await h.sync(changed);
  assert.equal((await h.feed()).notifications.length, 7);
  changed.assignments[0].dueAt = data.assignments[0].dueAt;
  await h.sync(changed);
  assert.equal((await h.feed()).notifications.length, 8);
  assert.equal(
    new Set((await h.feed()).notifications.map((n) => n.id)).size,
    8,
  );
});

test("two clients share reads, and mark-all does not read a concurrently arriving event", async (t) => {
  const h = await harness(t),
    data = payload();
  await h.sync(data);
  const web = await h.feed(),
    native = await h.feed();
  data.announcements.push({
    ...data.announcements[0],
    id: "new",
    title: "New update",
  });
  await Promise.all([
    h.sync(data),
    h.request("/api/notifications/read", {
      scope: web.scope,
      ids: web.notifications.map((n) => n.id),
    }),
  ]);
  const result = await h.feed();
  assert.equal(result.notifications.filter((n) => !n.readAt).length, 1);
  assert.ok(
    native.notifications.every(
      (n) => result.notifications.find((x) => x.id === n.id).readAt,
    ),
  );
  const revision = result.revision;
  await h.request("/api/notifications/read", {
    scope: web.scope,
    ids: web.notifications.map((n) => n.id),
  });
  assert.equal((await h.feed()).revision, revision);
});

test("account scopes, disconnect/reconnect, and stale uploads do not erase read history", async (t) => {
  const h = await harness(t),
    data = payload();
  await h.sync(data);
  const original = await h.feed();
  await h.request("/api/notifications/read", {
    scope: original.scope,
    ids: original.notifications.map((n) => n.id),
  });
  await h.sync(payload({ profile: { id: "different" } }));
  const other = await h.feed();
  assert.notEqual(other.scope, original.scope);
  assert.ok(other.notifications.every((n) => !n.readAt));
  assert.equal(
    (
      await h.request("/api/notifications/read", {
        scope: original.scope,
        ids: [original.notifications[0].id],
      })
    ).status,
    409,
  );
  await h.sync(data);
  assert.ok((await h.feed()).notifications.every((n) => n.readAt));
  await h.request("/api/connector/disconnect", {});
  assert.equal((await h.request("/api/connector/data")).status, 404);
  await h.restart();
  assert.equal((await h.request("/api/connector/data")).status, 404);
  await h.sync(data);
  assert.ok((await h.feed()).notifications.every((n) => n.readAt));
  const outdated = payload({ syncedAt: "2026-09-15T00:00:00Z" });
  outdated.assignments[0].dueAt = null;
  assert.equal((await h.sync(outdated)).body.ignored, true);
  assert.equal((await h.feed()).notifications.length, 2);
  await h.sync(payload({ canvasOrigin: "https://other.instructure.com" }));
  assert.notEqual((await h.feed()).scope, original.scope);
});

test("failed initial collection is backfilled when it first succeeds; empty successful collections detect new items", async (t) => {
  const h = await harness(t),
    data = payload();
  await h.sync(
    payload({
      assignments: [],
      grades: [],
      announcements: [],
      assignmentGroups: [],
      completeCourseIds: {
        assignments: [],
        grades: [],
        announcements: [],
        assignmentGroups: [],
      },
    }),
  );
  await h.sync(data);
  assert.equal((await h.feed()).notifications.length, 2);
  await h.sync(
    payload({
      courses: [...data.courses, { id: "20", name: "Math" }],
      completeCourseIds: {
        assignments: ["10", "20"],
        grades: ["10", "20"],
        announcements: ["10", "20"],
        assignmentGroups: ["10", "20"],
      },
    }),
  );
  data.courses.push({ id: "20", name: "Math" });
  data.assignments.push({ ...data.assignments[0], courseId: "20", id: "1" });
  data.completeCourseIds.assignments.push("20");
  await h.sync(data);
  assert.equal(
    (await h.feed()).notifications.filter((n) => n.kind === "assignment")
      .length,
    1,
  );
});

test("legacy partial snapshots do not recreate missing records, and invalid payloads are rejected", async (t) => {
  const h = await harness(t),
    data = payload();
  delete data.completeCourseIds;
  await h.sync(data);
  await h.sync({ ...data, grades: [], announcements: [] });
  await h.sync(data);
  assert.equal((await h.feed()).notifications.length, 2);
  assert.equal((await h.sync({ ...data, profile: null })).status, 400);
  assert.equal(
    (await h.request("/api/notifications/read", { ids: [7] })).status,
    400,
  );
});

test("failed persistence rejects a mutation without publishing changed state", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "acadence-store-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, "nested", "state.json"),
    store = await createStore(file);
  await writeFile(join(dir, "nested"), "blocks the directory");
  await assert.rejects(
    store.transact((state) => {
      state.activeScope = "unsaved";
    }),
  );
  assert.equal(store.read().activeScope, null);
});
