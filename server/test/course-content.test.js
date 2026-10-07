import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyAccount,
  normalizePayload,
  scopeFor,
  syncAccount,
} from "../src/notifications.js";

const NOW = "2026-09-17T15:00:00.000Z";

function payload(overrides = {}) {
  return {
    source: "canvas",
    canvasOrigin: "https://school.instructure.com",
    profile: { id: "42", name: "Student" },
    syncedAt: NOW,
    courses: [{ id: "10", name: "Course" }],
    assignments: [],
    grades: [],
    announcements: [],
    assignmentGroups: [],
    modules: [
      {
        id: "m1",
        courseId: "10",
        name: "Week 1",
        items: [{ id: "i1", title: "Lecture", type: "Page" }],
      },
    ],
    files: [
      { id: "f1", courseId: "10", displayName: "notes.pdf", size: 2048 },
    ],
    pages: [
      { id: "p1", courseId: "10", title: "Welcome", frontPage: true },
    ],
    completeCourseIds: {
      assignments: ["10"],
      grades: ["10"],
      announcements: ["10"],
      assignmentGroups: ["10"],
      modules: ["10"],
      files: ["10"],
      pages: ["10"],
    },
    ...overrides,
  };
}

test("modules, files and pages persist through failed collections and clear on a successful empty collection", () => {
  const first = normalizePayload(payload(), NOW);
  const scope = scopeFor(first);
  const account = emptyAccount();
  assert.equal(syncAccount(account, first, scope, NOW), true);
  assert.equal(account.latest.modules.length, 1);
  assert.equal(account.latest.files.length, 1);
  assert.equal(account.latest.pages.length, 1);

  const later = "2026-09-17T15:01:00.000Z";
  const failed = normalizePayload(
    payload({
      syncedAt: later,
      modules: [],
      files: [],
      pages: [],
      completeCourseIds: {
        assignments: ["10"],
        grades: ["10"],
        announcements: ["10"],
        assignmentGroups: ["10"],
        modules: [],
        files: [],
        pages: [],
      },
    }),
    later,
  );
  syncAccount(account, failed, scope, later);
  assert.equal(account.latest.modules.length, 1);
  assert.equal(account.latest.files.length, 1);
  assert.equal(account.latest.pages.length, 1);

  const latest = "2026-09-17T15:02:00.000Z";
  const successfullyEmpty = normalizePayload(
    payload({
      syncedAt: latest,
      modules: [],
      files: [],
      pages: [],
    }),
    latest,
  );
  syncAccount(account, successfullyEmpty, scope, latest);
  assert.equal(account.latest.modules.length, 0);
  assert.equal(account.latest.files.length, 0);
  assert.equal(account.latest.pages.length, 0);
});
