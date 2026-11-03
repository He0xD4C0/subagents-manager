import assert from 'node:assert/strict';
import test from 'node:test';

/** Minimal React surface: the factory defines components but this suite never renders them. */
const fakeReact = {
  createElement: () => null,
  useState: () => [undefined, () => {}],
  useRef: () => ({ current: null }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useEffect: () => {},
  useLayoutEffect: () => {},
  useSyncExternalStore: () => undefined,
};

let captured;
globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      captured = definition;
    },
  },
};
await import(new URL('../client.js', import.meta.url).href);
assert.ok(captured, 'client.js registers a module definition');
assert.equal(captured.id, '@local/subagents-manager');

const mod = captured.factory((name) => {
  if (name === 'react') return fakeReact;
  throw new Error('unexpected require: ' + name);
});
const T = mod.__test;

/** Fake observable store with snapshot/subscribe/set. */
function createStore(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => value,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next) {
      value = next;
      for (const listener of [...listeners]) listener();
    },
  };
}

/** One fake client root that records every registration and effect. */
function createFakeCtx(list, mounted) {
  const calls = {
    openTab: [],
    openSession: [],
    effects: [],
    slotRegistrations: [],
    localeRegistrations: [],
    tabType: undefined,
  };
  const ctx = {
    sessions: {
      list: createStore(list),
      subagentAddress(id) {
        return id === 'root' ? undefined : { parentSessionId: 'root', childSessionId: id, mode: 'continuable' };
      },
    },
    uiSession: { sessionStatus: createStore(new Map()) },
    uiWorkspace: {
      openSession(target) {
        calls.openSession.push(target);
      },
    },
    sidebarRight: {
      mounted: createStore(mounted),
      openTabs: createStore([]),
      openTab(kind, options) {
        calls.openTab.push({ kind, options });
      },
    },
    sidebarRightTabs: {
      register(definition) {
        calls.tabType = definition;
        return () => {};
      },
    },
    effect(fn) {
      const dispose = fn();
      calls.effects.push(dispose);
      return dispose;
    },
    inject(_deps, fn) {
      fn(ctx);
    },
    slots: {
      inject(_name, fn) {
        const dispose = fn();
        calls.effects.push(dispose);
      },
      register(definition, component) {
        calls.slotRegistrations.push({ definition, component });
        return () => {};
      },
    },
    locale: {
      register(namespace, dictionaries) {
        calls.localeRegistrations.push({ namespace, dictionaries });
        return () => {};
      },
      bind() {
        return (key) => key;
      },
    },
  };
  return { ctx, calls };
}

/** A representative tree: root -> [a -> a1, b], plus a catalog-only c. */
function makeList(now) {
  return {
    phase: 'ready',
    ids: ['root', 'a', 'b', 'a1'],
    byId: {
      root: { id: 'root', title: 'Root session' },
      a: {
        id: 'a',
        origin: 'subagent',
        parentId: 'root',
        title: 'Alpha title',
        running: true,
        projectionValues: {
          subagent: { label: 'Alpha label' },
          subagentTiming: { settledMs: 1000, active: { since: now - 5000 } },
        },
      },
      a1: {
        id: 'a1',
        origin: 'subagent',
        parentId: 'a',
        title: 'Alpha child',
        running: false,
        projectionValues: {
          subagent: { label: 'Alpha child' },
          subagentTiming: { settledMs: 2000, lastTurnCompleted: true },
        },
      },
      b: {
        id: 'b',
        origin: 'subagent',
        parentId: 'root',
        title: 'Beta',
        running: false,
        projectionValues: {
          subagent: { label: 'Beta' },
          subagentTiming: { settledMs: 3000, lastTurnCompleted: false },
        },
      },
    },
    projectionsBySession: {
      root: {
        state: 'ready',
        values: {
          subagentCatalog: [{ id: 'c', label: 'Gamma', mode: 'one-shot', activity: 'inactive' }],
        },
      },
    },
  };
}

test('rootOf climbs durable subagent lineage with a cycle guard', () => {
  const now = Date.now();
  const list = makeList(now);
  assert.equal(T.rootOf(list, 'a1'), 'root');
  assert.equal(T.rootOf(list, 'a'), 'root');
  assert.equal(T.rootOf(list, 'root'), 'root');
  assert.equal(T.rootOf(list, 'missing'), 'missing');
  const cycle = {
    ids: ['a', 'b'],
    byId: {
      a: { id: 'a', origin: 'subagent', parentId: 'b' },
      b: { id: 'b', origin: 'subagent', parentId: 'a' },
    },
  };
  assert.equal(T.rootOf(cycle, 'a'), 'a');
});

test('descendantIds is depth-first and supplements catalog-only children', () => {
  const now = Date.now();
  const list = makeList(now);
  assert.deepEqual(T.descendantIds(list, 'root'), ['a', 'a1', 'b', 'c']);
  assert.deepEqual(T.descendantIds(list, 'a'), ['a1']);
  assert.deepEqual(T.descendantIds(list, 'unknown'), []);
});

test('deriveRows pins the root, keeps depth and applies live states', () => {
  const now = Date.now();
  const list = makeList(now);
  const rows = T.deriveRows(list, new Map(), 'root', now, new Map());
  assert.deepEqual(rows.map((row) => row.id), ['root', 'a', 'a1', 'b', 'c']);
  assert.equal(rows[0].isMain, true);
  assert.equal(rows[0].fullTitle, 'Root session');
  assert.equal(rows[1].depth, 1);
  assert.equal(rows[1].label, 'Alpha label');
  assert.equal(rows[1].state, 'running');
  assert.equal(rows[1].elapsedMs, 6000);
  assert.equal(rows[2].depth, 2);
  assert.equal(rows[2].state, 'done');
  assert.equal(rows[3].state, 'blocked');
  assert.equal(rows[3].pendingKind, 'failed');
  assert.equal(rows[4].label, 'Gamma');
  assert.equal(rows[4].state, 'idle');
});

test('deriveRows assigns limited, varied and deterministic subagent logos', () => {
  const now = Date.now();
  const list = makeList(now);
  const rows = T.deriveRows(list, new Map(), 'root', now, new Map());
  const subagents = rows.filter((row) => !row.isMain);
  assert.equal(subagents.length, 4);
  assert.ok(subagents.every((row) => Number.isInteger(row.logoIndex) && row.logoIndex >= 0 && row.logoIndex < 8));
  assert.equal(new Set(subagents.map((row) => row.logoIndex)).size, subagents.length);
  assert.equal(rows[0].logoIndex, undefined);
  const again = T.deriveRows(list, new Map(), 'root', now, new Map());
  assert.deepEqual(again.map((row) => row.logoIndex), rows.map((row) => row.logoIndex));
});

test('statusOf prioritizes pending attention, then running, completion and idle', () => {
  const now = Date.now();
  const running = T.statusOf({ running: true }, { running: true }, now, now - 3000);
  assert.equal(running.state, 'running');
  assert.equal(running.elapsedMs, 3000);
  const pending = T.statusOf(
    { running: true, projectionValues: { subagentTiming: { settledMs: 0, active: { since: now } } } },
    { running: true, pendingInteraction: { kind: 'approval' } },
    now
  );
  assert.equal(pending.state, 'blocked');
  assert.equal(pending.pendingKind, 'approval');
  const done = T.statusOf({ running: false, projectionValues: { subagentTiming: { settledMs: 100, lastTurnCompleted: true } } }, undefined, now);
  assert.equal(done.state, 'done');
  assert.equal(done.elapsedMs, 100);
  const failed = T.statusOf({ running: false, projectionValues: { subagentTiming: { settledMs: 100, lastTurnCompleted: false } } }, undefined, now);
  assert.equal(failed.state, 'blocked');
  assert.equal(failed.pendingKind, 'failed');
  const idle = T.statusOf({ running: false }, undefined, now);
  assert.equal(idle.state, 'idle');
  assert.equal(idle.elapsedMs, undefined);
});

test('formatElapsed uses compact seconds, minutes and hours', () => {
  const t = (key, params) => key + ':' + JSON.stringify(params);
  assert.equal(T.formatElapsed(5000, t), 'elapsed.seconds:{"seconds":5}');
  assert.equal(T.formatElapsed(65000, t), 'elapsed.minutes:{"minutes":1,"seconds":"05"}');
  assert.equal(T.formatElapsed(3665000, t), 'elapsed.hours:{"hours":1,"minutes":"01"}');
});

test('statusLabel names the pending interaction reason', () => {
  const t = (key) => key;
  assert.equal(T.statusLabel('blocked', 'approval', t), 'blocked.approval');
  assert.equal(T.statusLabel('blocked', 'question', t), 'blocked.question');
  assert.equal(T.statusLabel('blocked', 'plan-review', t), 'blocked.plan');
  assert.equal(T.statusLabel('blocked', 'failed', t), 'blocked.failed');
  assert.equal(T.statusLabel('running', undefined, t), 'status.running');
});

test('apply registers the page type, guide entry, body, title and header action', () => {
  const now = Date.now();
  const list = makeList(now);
  const { ctx, calls } = createFakeCtx(list, 'root');
  let styleEl;
  globalThis.document = {
    head: {
      appendChild(element) {
        styleEl = element;
      },
    },
    createElement() {
      return { dataset: {}, textContent: '', parentNode: null };
    },
  };
  mod.apply(ctx);

  assert.equal(calls.localeRegistrations.length, 1);
  assert.equal(calls.localeRegistrations[0].namespace, 'subagentsManager');
  assert.equal(calls.localeRegistrations[0].dictionaries.zh.title, 'Subagents Manager');
  assert.ok(calls.localeRegistrations[0].dictionaries.zh['guide.description']);
  assert.ok(styleEl);
  assert.ok(styleEl.textContent.includes('.dsm-root'));
  assert.ok(styleEl.textContent.includes('.dsm-tab-icon'));
  assert.ok(styleEl.textContent.includes('.dsm-logo'));

  assert.ok(calls.tabType);
  assert.equal(calls.tabType.id, T.ID);
  assert.equal(calls.tabType.kind, T.KIND);
  assert.equal(calls.tabType.priority, 'extension');
  assert.equal(calls.tabType.patterns, undefined);
  assert.equal(calls.tabType.canOpen, undefined);
  assert.equal(calls.tabType.title(), 'title');
  assert.ok(Array.isArray(calls.tabType.guide));
  assert.equal(calls.tabType.guide.length, 1);
  const guide = calls.tabType.guide[0];
  assert.equal(guide.id, 'subagents-manager');
  assert.equal(guide.kind, T.KIND);
  assert.equal(guide.order, 30);
  assert.equal(guide.title(), 'title');
  assert.equal(guide.description(), 'guide.description');
  assert.equal(typeof guide.icon, 'function');

  const body = calls.slotRegistrations.find((entry) => entry.definition.name === 'sidebar.right.pane.tab');
  assert.ok(body);
  assert.equal(body.definition.key, T.ID);
  assert.equal(body.definition.locale, 'subagentsManager');
  const title = calls.slotRegistrations.find((entry) => entry.definition.name === 'sidebar.right.pane.tab.title');
  assert.ok(title);
  assert.equal(title.definition.key, T.ID);
  assert.equal(title.definition.locale, 'subagentsManager');
  const header = calls.slotRegistrations.find((entry) => entry.definition.name === 'conversation.session.header.actions');
  assert.ok(header);
  assert.equal(header.definition.id, 'subagents-manager');
  assert.equal(header.definition.order, 20);
  assert.equal(header.definition.locale, 'subagentsManager');
  assert.equal(typeof header.definition.inject, 'function');
});

test('auto-open opens once per surface/root and skips open or childless trees', () => {
  const now = Date.now();
  const list = makeList(now);
  const { ctx, calls } = createFakeCtx(list, 'root');
  globalThis.document = {
    head: { appendChild() {} },
    createElement() {
      return { dataset: {}, textContent: '', parentNode: null };
    },
  };
  mod.apply(ctx);
  assert.equal(calls.openTab.length, 1);
  assert.equal(calls.openTab[0].kind, T.KIND);

  // Viewing a child opens the same page type on that child's surface.
  ctx.sidebarRight.mounted.set('a');
  assert.equal(calls.openTab.length, 2);
  assert.equal(calls.openTab[1].kind, T.KIND);

  // A restored manager tab on a surface suppresses auto-open there.
  ctx.sidebarRight.openTabs.set([{ sessionId: 'b', kind: T.KIND, contentId: 'page' }]);
  ctx.sidebarRight.mounted.set('b');
  assert.equal(calls.openTab.length, 2);

  // The header action opens the manager explicitly.
  const header = calls.slotRegistrations.find((entry) => entry.definition.name === 'conversation.session.header.actions');
  const injected = header.definition.inject('root');
  injected.openManager();
  assert.equal(calls.openTab.length, 3);

  // A childless tree never auto-opens.
  const solo = { phase: 'ready', ids: ['solo'], byId: { solo: { id: 'solo', title: 'Solo' } } };
  ctx.sessions.list.set(solo);
  ctx.sidebarRight.mounted.set('solo');
  assert.equal(calls.openTab.length, 3);
});
