const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const renderer = require('react-test-renderer');
const { act } = renderer;

global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, '..');
const colors = { text: '#1b3024', muted: '#68736c', accent: '#447b5c', surface: '#fff', background: '#f6f6ee', border: '#ddd', danger: '#a00' };
const animation = { duration() { return this; }, delay() { return this; } };

// Keep the real provider and UI components; replace platform rendering and navigation only.
function harness() {
  let canvas = { connected: true, loading: false, error: null, courses: [{ id: '1' }], notificationFeed: feed() };
  let value, closed = 0;
  const modules = new Map();
  const mock = {
    react: React,
    'react-dom': { createPortal: node => node },
    'expo-router': { useRouter: () => ({ push() {} }) },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', Modal: 'Modal', ScrollView: 'ScrollView', Linking: { openURL() {} },
      Platform: { OS: 'ios' }, useWindowDimensions: () => ({ width: 390, height: 844 }), StyleSheet: { create: s => s, absoluteFill: {} } },
    'react-native-reanimated': { __esModule: true, default: { View: 'AnimatedView' }, FadeIn: animation, FadeOut: animation, LinearTransition: animation, SlideInDown: animation, SlideOutUp: animation },
    'lucide-react-native': new Proxy({}, { get: (_, name) => String(name) }),
    '@/context/ThemeContext': { useAppTheme: () => ({ colors, isDark: false }) },
    './CanvasDataContext': { useCanvasData: () => canvas },
    '@/components/Screen': { Screen: 'Screen' },
    '@/constants/theme': { radius: { md: 12 } },
  };
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    const mod = { exports: {} }; modules.set(filename, mod);
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', output)(name => {
      if (name in mock) return mock[name];
      if (name.startsWith('@/')) {
        const base = path.join(root, name.slice(2));
        return load(base + (name.includes('Context') ? '.tsx' : '.ts'));
      }
      return require(name);
    }, mod, mod.exports);
    return mod.exports;
  }
  const { NotificationsProvider, useNotifications } = load(path.join(root, 'context/NotificationsContext.tsx'));
  const Web = load(path.join(root, 'components/NotificationPopover.web.tsx')).NotificationPopover;
  const Native = load(path.join(root, 'components/NotificationPopover.tsx')).NotificationPopover;
  const Page = load(path.join(root, 'app/(tabs)/notifications.tsx')).default;
  function Probe() { value = useNotifications(); return null; }
  const tree = platform => React.createElement(NotificationsProvider, null,
    React.createElement(Probe), React.createElement(platform === 'web' ? Web : Native, { visible: true, onClose: () => { closed++; } }), React.createElement(Page));
  let view;
  return {
    async mount(platform) { await act(async () => { view = renderer.create(tree(platform)); }); },
    async update(next, platform = 'web') { canvas = { ...canvas, notificationFeed: next }; await act(async () => { view.update(tree(platform)); }); },
    get view() { return view; }, get value() { return value; }, get closed() { return closed; },
    async unmount() { await act(async () => view.unmount()); },
  };
}
function feed(revision = 1, scope = 'student') {
  return { scope, revision, notifications: ['a', 'b'].map(id => ({ id: `${scope}:${id}`, courseId: '1', kind: 'grade', title: `Grade ${id}`, body: `Result ${id}`, occurredAt: '2026-09-16T12:00:00Z', readAt: null })) };
}
function text(node) {
  if (typeof node === 'string') return node;
  return (node.children || []).map(text).join('');
}
function button(h, title, native = false) {
  return h.view.root.findAllByType(native ? 'Pressable' : 'button').find(n => text(n) === title);
}
function select(h, title = 'Grade a') {
  return h.view.root.findAllByType('div').find(n => n.props.role === 'button' && n.props['aria-label'] === title);
}
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
const response = data => ({ ok: true, json: async () => data });

// Run sequentially because fetch/document represent the one platform environment.
test('web detail, page and badge share reads without closing the popover', async t => {
  const originalFetch = global.fetch, originalDocument = global.document;
  global.document = { body: {} };
  const h = harness();
  t.after(async () => { await h.unmount(); global.fetch = originalFetch; global.document = originalDocument; });
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); assert.deepEqual(body.ids, ['student:a']);
    const next = feed(2); next.notifications[0].readAt = '2026-09-16T13:00:00Z'; return response(next);
  };
  await h.mount('web');
  await act(async () => select(h).props.onClick());
  assert.equal(h.value.unread, 2, 'opening a detail must not mark it read');
  await act(async () => button(h, 'Mark as read').props.onClick());
  assert.equal(h.value.unread, 1);
  assert.equal(h.closed, 0);
  assert.ok(h.view.root.findAllByType('div').some(n => n.props.role === 'dialog'));
  assert.equal(button(h, 'Mark as read'), undefined);
  assert.equal(h.view.root.findAllByType('Pressable').filter(n => n.props.accessibilityLabel === 'Mark Grade a as read').length, 0);
  await h.update(feed(1));
  assert.equal(h.value.unread, 1, 'an old poll cannot resurrect the unread dot');
});

test('failed read restores unread UI and keeps detail open', async t => {
  const originalFetch = global.fetch, originalDocument = global.document;
  global.document = { body: {} };
  const h = harness(), pending = deferred(); global.fetch = () => pending.promise;
  t.after(async () => { await h.unmount(); global.fetch = originalFetch; global.document = originalDocument; });
  await h.mount('web');
  await act(async () => select(h).props.onClick());
  await act(async () => button(h, 'Mark as read').props.onClick());
  assert.equal(h.value.unread, 1);
  await act(async () => pending.reject(new Error('offline')));
  assert.equal(h.value.unread, 2);
  assert.ok(h.value.error);
  assert.ok(button(h, 'Mark as read'));
  assert.equal(h.closed, 0);
});

test('native tapping and mark-all update shared state without dismissing', async t => {
  const originalFetch = global.fetch, h = harness(); let serverFeed = feed();
  global.fetch = async (_url, options) => {
    const { ids } = JSON.parse(options.body);
    serverFeed = { ...serverFeed, revision: serverFeed.revision + 1, notifications: serverFeed.notifications.map(n => ids.includes(n.id) ? { ...n, readAt: '2026-09-16T13:00:00Z' } : n) };
    return response(serverFeed);
  };
  t.after(async () => { await h.unmount(); global.fetch = originalFetch; });
  await h.mount('native');
  const card = h.view.root.findAllByType('Pressable').find(n => text(n).includes('Grade a') && text(n).includes('Result a'));
  await act(async () => card.props.onPress());
  assert.equal(h.value.unread, 1);
  assert.equal(h.closed, 0);
  assert.ok(button(h, 'Collapse', true));
  await act(async () => button(h, 'Mark all read', true).props.onPress());
  assert.equal(h.value.unread, 0);
  assert.equal(h.closed, 0);
  assert.ok(h.view.root.findByType('Modal').props.visible);
});

test('bulk read sends captured IDs; a concurrently arriving notice stays unread', async t => {
  const originalFetch = global.fetch, originalDocument = global.document;
  global.document = { body: {} };
  const h = harness(), pending = deferred(); let ids;
  global.fetch = (_url, options) => { ids = JSON.parse(options.body).ids; return pending.promise; };
  t.after(async () => { await h.unmount(); global.fetch = originalFetch; global.document = originalDocument; });
  await h.mount('web');
  await act(async () => button(h, 'Mark all read').props.onClick());
  assert.equal(h.value.unread, 0);
  const next = feed(3);
  next.notifications.forEach(n => { n.readAt = '2026-09-16T13:00:00Z'; });
  next.notifications.push({ ...feed().notifications[0], id: 'student:new', title: 'New update' });
  await act(async () => pending.resolve(response(next)));
  assert.deepEqual(ids, ['student:a', 'student:b']);
  assert.equal(h.value.unread, 1);
});

test('an old account acknowledgment cannot affect the newly active account', async t => {
  const originalFetch = global.fetch, originalDocument = global.document;
  global.document = { body: {} };
  const h = harness(), pending = deferred(); global.fetch = () => pending.promise;
  t.after(async () => { await h.unmount(); global.fetch = originalFetch; global.document = originalDocument; });
  await h.mount('web');
  await act(async () => button(h, 'Mark all read').props.onClick());
  await h.update(feed(1, 'other'));
  const old = feed(2); old.notifications.forEach(n => { n.readAt = '2026-09-16T13:00:00Z'; });
  await act(async () => pending.resolve(response(old)));
  assert.equal(h.value.unread, 2);
  assert.ok(h.value.notices.every(n => n.id.startsWith('other:')));
});
