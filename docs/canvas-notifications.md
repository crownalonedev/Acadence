# Canvas notifications

The notifications page, web/native popovers and home badge all consume `NotificationsProvider`. There are no sample notifications or fixed unread counts.

## Behavior

- The first successful sync of each course backfills every grade and announcement that Canvas returns for that course instead of limiting history to seven days. The extension requests announcement history from the course start date through the current sync time; courses without a usable start date fall back to the Unix epoch so older announcements are still requested.
- Existing installs automatically run the full-history backfill once on the next successful grade/announcement sync. Exact notifications already created by the previous seven-day backfill are deduplicated.
- Existing assignments and assignment groups establish a baseline because Canvas does not expose enough historical state to reconstruct every assignment/group change that happened before Acadence started observing the course. Later syncs generate alerts for new assignments, changed deadlines (including removal), assignment name/points/group changes, posted or changed grades, new/edited announcements, and new/changed assignment groups.
- Notifications show updates from every synced Canvas course. Choosing a smaller course subset for Home/Grades no longer hides notifications from the rest of the synced courses.
- Notification history is no longer truncated to the newest 500 events. The read endpoint still accepts at most 500 IDs per request, and the app batches larger Mark all read operations automatically.
- These are in-app notifications generated when the connector syncs. There are no OS push notifications or scheduled due-soon reminders in this change.
- Opening a web detail leaves it unread until Mark as read is clicked, and the popover stays open. Native preserves tap-to-read and expands the preview without closing. Both offer View all; the page also has individual and bulk read controls.
- Read acknowledgments update the local UI immediately. Failed writes restore unread status and show an error. Server revisions prevent a late polling response from undoing a successful acknowledgment. Other clients refresh every 15 seconds and on app/window focus.

## Run the updated app and connector

Use Node 22.18+ to run the included TypeScript tests.

```sh
npm install
npm --prefix server install
npm --prefix server start
```

In a second terminal, run `npm run web` or start the native app with Expo. Reload the unpacked Canvas connector extension after updating its files, open your school Canvas site, and run Sync once. Both the manual button and automatic background sync use `extension/sync.js`.

Web and native must point `EXPO_PUBLIC_ACADENCE_API_URL` at the **same backend**. For a physical phone, use the computer's reachable network address (for example `http://192.168.1.20:8787`), not the phone's `localhost`, and restart Expo after changing the environment. The existing browser extension uploads to `http://localhost:8787` on the computer.

## Storage and scope

The Node backend atomically saves connector data, observed snapshots, notifications and read timestamps to `server/data/connector.json`. This directory is ignored by git. `ACADENCE_STORE_PATH` overrides the file path; use a persistent volume when running this backend in a container. Run one backend process per file. An unreadable/corrupt store fails startup rather than silently discarding history.

Histories are separated by Canvas origin and profile ID. Disconnect hides the active feed; reconnecting the same Canvas account restores its read history. Data for failed collections is retained until a successful response replaces it. Missing records are not interpreted as deletions. A slow older upload cannot regress a newer snapshot for that account.

Because full notification history is retained, the JSON store can grow over time. This is acceptable for the current local connector; a public beta should move notification history to an authenticated database with pagination/retention controls rather than a single JSON file.

This extends the existing local, single-active-account connector. The scope key prevents accidental cross-account read writes; it is not authentication. A public student beta still needs authenticated, per-user APIs and a shared database. The JSON file store is for this Node backend, not Cloudflare Workers storage.

## Sync contract

`POST /api/connector/sync` accepts the existing payload plus optional `completeCourseIds`, with course ID arrays for `assignments`, `grades`, `announcements`, and `assignmentGroups`. Failed collections must have no entries in their completion array. The shared collector follows Canvas pagination and returns collection data only when every page succeeds. Announcements are fetched from the course start date through the current sync time rather than a fixed recent window.

`GET /api/connector/data` includes:

```ts
notificationFeed: {
  scope: string;
  revision: number;
  notifications: Array<{
    id: string;
    courseId: string;
    kind: 'assignment' | 'change' | 'grade' | 'announcement' | 'group';
    title: string;
    body: string;
    occurredAt: string;
    readAt: string | null;
    dueAt?: string | null;
    htmlUrl?: string;
  }>;
}
```

`POST /api/notifications/read` takes `{ scope, ids }` and returns the updated feed. It is idempotent, accepts at most 500 IDs per request, and rejects writes for an inactive account with HTTP 409. Bulk reads are automatically split into batches and send the observed IDs rather than a blanket server-side mark-all operation. All API responses disable caching.

Canvas markup is converted to plain text and rendered as text. Open in Canvas links are restricted to the synced Canvas origin.

## Validation

```sh
npm test
npm --prefix server test
npm run typecheck
npx expo export --platform web
npx expo export --platform ios --platform android
```

The automated tests cover full-history grade/announcement backfill, zero grades, durable read state, duplicate suppression, partial fetches, pagination, account isolation, disconnect/reconnect, stale uploads, concurrent sync/read requests, failed persistence, course filtering helpers, optimistic read projection/rollback, and mounted web/native notification components.

The Canvas collection behavior follows the official [pagination](https://developerdocs.instructure.com/services/canvas/basics/file.pagination) and [announcement date-range](https://developerdocs.instructure.com/services/canvas/resources/announcements) contracts.
