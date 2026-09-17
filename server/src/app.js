import express from "express";
import cors from "cors";
import {
  emptyAccount,
  normalizePayload,
  notificationFeed,
  scopeFor,
  syncAccount,
} from "./notifications.js";

export function createApp(store, clock = () => new Date().toISOString()) {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "8mb" }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/health", (_req, res) => res.json({ ok: true, connector: true }));

  app.post("/api/connector/sync", async (req, res) => {
    const now = clock(),
      payload = normalizePayload(req.body, now),
      scope = scopeFor(payload);
    const result = await store.transact((state) => {
      const account = (state.accounts[scope] ||= emptyAccount());
      const applied = syncAccount(account, payload, scope, now);
      if (applied) state.activeScope = scope;
      const latest = account.latest;
      return {
        ok: true,
        ignored: !applied,
        courseCount: latest.courses.length,
        assignmentCount: latest.assignments.length,
        announcementCount: latest.announcements.length,
        gradeCount: latest.grades.length,
        assignmentGroupCount: latest.assignmentGroups.length,
        syncedAt: latest.receivedAt,
      };
    });
    res.json(result);
  });
  app.get("/api/connector/status", (_req, res) => {
    const state = store.read(),
      latest = state.accounts[state.activeScope]?.latest;
    if (!latest) return res.json({ connected: false });
    res.json({
      connected: true,
      canvasOrigin: latest.canvasOrigin,
      profile: latest.profile,
      courseCount: latest.courses.length,
      assignmentCount: latest.assignments.length,
      announcementCount: latest.announcements.length,
      gradeCount: latest.grades.length,
      assignmentGroupCount: latest.assignmentGroups.length,
      syncedAt: latest.receivedAt,
    });
  });
  app.get("/api/connector/data", (_req, res) => {
    const state = store.read(),
      account = state.accounts[state.activeScope];
    if (!account?.latest)
      return res
        .status(404)
        .json({ error: "No Canvas data has been synced yet." });
    res.json({
      ...account.latest,
      notificationFeed: notificationFeed(state.activeScope, account),
    });
  });
  app.post("/api/notifications/read", async (req, res) => {
    const { scope, ids } = req.body || {};
    if (
      typeof scope !== "string" ||
      !Array.isArray(ids) ||
      ids.length > 500 ||
      ids.some((id) => typeof id !== "string")
    )
      return res
        .status(400)
        .json({
          error: "A notification scope and up to 500 IDs are required.",
        });
    const result = await store.transact((state) => {
      const account = state.accounts[scope];
      if (!account || scope !== state.activeScope)
        throw Object.assign(
          new Error("The Canvas account changed. Refresh notifications."),
          { status: 409 },
        );
      const selected = new Set(ids),
        now = clock();
      let changed = false;
      for (const notice of account.notifications)
        if (selected.has(notice.id) && !notice.readAt) {
          notice.readAt = now;
          changed = true;
        }
      if (changed) account.revision++;
      return notificationFeed(scope, account);
    });
    res.json(result);
  });
  app.post("/api/connector/disconnect", async (_req, res) => {
    await store.transact((state) => {
      state.activeScope = null;
    });
    res.json({ ok: true });
  });
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500)
      console.error("Connector request failed:", error.message);
    res
      .status(status)
      .json({
        error:
          status >= 500
            ? "Unable to save Canvas updates. Please try again."
            : error.message,
      });
  });
  return app;
}
