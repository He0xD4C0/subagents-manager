window.__ModuleLoader__.load({
  id: '@local/subagents-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace and client-plugin identity. */
    const NS = 'subagentsManager';
    const ID = '@local/subagents-manager';
    const KIND = 'subagents-manager';

    /** Set by apply(); the components read the same client root. */
    let pluginCtx;

    /** Simplified Chinese dictionary, the key-set source of truth. */
    const zh = {
      title: 'Subagents Manager',
      open: '打开 Subagents Manager',
      'guide.description': '在主 Agent 与子 Agent 会话之间切换，查看运行状态。',
      main: '主 Agent',
      mainAria: '主 Agent：{title}',
      listLabel: 'Agent 会话',
      empty: '暂无子 Agent',
      loading: '正在加载…',
      error: '无法读取会话树',
      rowAria: '{title} · {status}{elapsed}',
      notNavigable: '不可导航',
      'status.running': '运行中',
      'status.done': '已完成',
      'status.blocked': '阻滞',
      'status.idle': '空闲',
      'blocked.approval': '等待审批',
      'blocked.question': '等待回答',
      'blocked.plan': '等待计划确认',
      'blocked.failed': '最后一轮未正常完成',
      'elapsed.seconds': '{seconds}秒',
      'elapsed.minutes': '{minutes}分{seconds}秒',
      'elapsed.hours': '{hours}小时{minutes}分',
    };

    /** English dictionary, key-identical to the Chinese source. */
    const en = {
      title: 'Subagents Manager',
      open: 'Open Subagents Manager',
      'guide.description': 'Switch between the main agent and its subagents, with live status.',
      main: 'Main agent',
      mainAria: 'Main agent: {title}',
      listLabel: 'Agent sessions',
      empty: 'No subagents yet',
      loading: 'Loading…',
      error: 'Could not read this session tree',
      rowAria: '{title} · {status}{elapsed}',
      notNavigable: 'Not navigable',
      'status.running': 'Running',
      'status.done': 'Completed',
      'status.blocked': 'Blocked',
      'status.idle': 'Idle',
      'blocked.approval': 'Waiting for approval',
      'blocked.question': 'Waiting for an answer',
      'blocked.plan': 'Waiting for plan review',
      'blocked.failed': 'Last turn did not complete',
      'elapsed.seconds': '{seconds}s',
      'elapsed.minutes': '{minutes}m {seconds}s',
      'elapsed.hours': '{hours}h {minutes}m',
    };

    /** Styles are injected once per plugin instance and removed on unload. */
    const CSS = [
      '.dsm-root{display:flex;flex-direction:column;height:100%;min-height:0;padding:6px;gap:4px;box-sizing:border-box;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px}',
      '.dsm-main{flex:none;padding-bottom:4px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.dsm-list{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:2px;padding-top:2px;overscroll-behavior:contain}',
      '.dsm-empty{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;padding:10px 8px}',
      '.dsm-row{box-sizing:border-box;width:100%;min-height:36px;display:flex;align-items:center;gap:8px;padding:0 8px;border:0;border-radius:var(--dsw-radius-md);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;outline:none;position:relative}',
      '.dsm-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsm-row:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary)}',
      '.dsm-row[aria-current="page"]{background:var(--dsw-alias-interactive-bg-active)}',
      '.dsm-row[aria-current="page"]:before{content:"";position:absolute;left:0;top:9px;bottom:9px;width:2px;border-radius:2px;background:var(--dsw-alias-brand-primary)}',
      '.dsm-row-main{font-weight:600}',
      '.dsm-main-mark{flex:none;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;color:var(--dsw-alias-label-tertiary)}',
      '.dsm-logo{flex:none;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px}',
      '.dsm-tab-icon{flex:none;color:var(--dsw-alias-label-secondary)}',
      '.dsm-status-slot{flex:none;min-width:56px;display:inline-flex;align-items:center;justify-content:flex-end;white-space:nowrap}',
      '.dsm-status-time{color:var(--dsw-alias-state-business-primary)}',
      '.dsm-elapsed{font-size:10px;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:.01em}',
      '.dsm-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-idle-primary)}',
      '.dsm-state-running .dsm-dot{background:var(--dsw-alias-state-business-primary);animation:dsm-pulse 1.1s ease-in-out infinite}',
      '.dsm-state-done .dsm-dot{background:var(--dsw-alias-state-success-primary)}',
      '.dsm-state-blocked .dsm-dot{background:var(--dsw-alias-state-error-primary)}',
      '.dsm-state-idle .dsm-dot{background:var(--dsw-alias-state-idle-primary)}',
      '.dsm-title-clip{flex:1;min-width:0;overflow:hidden;white-space:nowrap}',
      '.dsm-title-track{display:inline-flex;align-items:center;gap:24px;white-space:nowrap;will-change:transform}',
      '.dsm-title-track.dsm-marquee{animation:dsm-marquee linear infinite}',
      '.dsm-title-text{display:inline-block}',
      '.dsm-header-button{width:28px;height:28px;border-radius:var(--dsw-radius-sm);display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:0}',
      '.dsm-header-button:hover,.dsm-header-button:focus-visible{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsm-header-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '@keyframes dsm-pulse{0%,100%{transform:scale(.8);opacity:.55}50%{transform:scale(1.15);opacity:1}}',
      '@keyframes dsm-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
      '@media (prefers-reduced-motion:reduce){.dsm-state-running .dsm-dot{animation:none}.dsm-title-track.dsm-marquee{animation:none}}',
    ].join('\n');

    /** Limited subagent logo set: distinct silhouettes with muted, non-status colors. */
    const LOGO_PATHS = [
      ['M6 1.2 10.2 3.6v4.8L6 10.8 1.8 8.4V3.6Z'],
      ['M6 1.6 10.6 10.2H1.4Z'],
      ['M6 1 10.4 6 6 11 1.6 6Z'],
      ['M6 1.2 7.3 4.6 10.8 4.9 8.2 7.2 8.9 10.6 6 8.8 3.1 10.6 3.8 7.2 1.2 4.9 4.7 4.6Z'],
      ['M2.2 6a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 0 0-7.6 0Z', 'M2.9 3.5l6.2 5'],
      ['M3 2.2h4.6L10 4.6v5.2H3Z'],
      ['M6.5 1 2.8 6.6h2.7L5.2 11l4-5.8H6.4Z'],
      ['M6 1.4c2.8 1.4 4.4 3.4 4.4 5.6A4.4 4.4 0 0 1 6 11.4 4.4 4.4 0 0 1 1.6 7c0-2.2 1.6-4.2 4.4-5.6Z'],
    ];
    const LOGO_COLORS = ['#7aa7ff', '#c792ea', '#f6c177', '#5ccfe6', '#f78fb3', '#a5b4fc', '#f0a868', '#9ad0c2'];

    /** Stable 32-bit hash so a subagent keeps its logo across renders. */
    function hashString(value) {
      let hash = 2166136261;
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    /** Give every subagent a logo, avoiding the last four logos where the finite set allows. */
    function assignLogoIndices(rows) {
      const recent = [];
      const windowSize = Math.min(4, LOGO_PATHS.length - 1);
      for (const row of rows) {
        if (row.isMain) continue;
        let index = hashString(row.id) % LOGO_PATHS.length;
        let guard = 0;
        while (recent.includes(index) && guard < LOGO_PATHS.length) {
          index = (index + 1) % LOGO_PATHS.length;
          guard += 1;
        }
        recent.push(index);
        if (recent.length > windowSize) recent.shift();
        row.logoIndex = index;
      }
      return rows;
    }

    /** Session ids in authoritative order, including rows outside the ordered ids list. */
    function orderedSessionIds(list) {
      const byId = (list && list.byId) || {};
      const ids = Array.isArray(list && list.ids) ? list.ids : [];
      const seen = new Set(ids);
      const extra = Object.keys(byId).filter((id) => !seen.has(id));
      return ids.concat(extra);
    }

    /** Direct subagent children keyed by parent session id, preserving list order. */
    function buildChildren(list) {
      const byId = (list && list.byId) || {};
      const children = new Map();
      for (const id of orderedSessionIds(list)) {
        const row = byId[id];
        if (!row || row.origin !== 'subagent') continue;
        const parent = row.parentId;
        if (parent === undefined || parent === null || parent === id) continue;
        if (!children.has(parent)) children.set(parent, []);
        children.get(parent).push(id);
      }
      return children;
    }

    /** Walk parentId from a child to its topmost local ancestor, with a cycle guard. */
    function rootOf(list, sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return undefined;
      const byId = (list && list.byId) || {};
      let id = sessionId;
      const seen = new Set();
      while (typeof id === 'string' && id !== '' && !seen.has(id)) {
        seen.add(id);
        const row = byId[id];
        if (!row || row.origin !== 'subagent') return id;
        const parent = row.parentId;
        if (parent === undefined || parent === null || parent === id) return id;
        id = parent;
      }
      return id;
    }

    /** Read the root's direct subagent catalog when the list has not caught up yet. */
    function rootCatalog(list, rootId) {
      const projections = list && list.projectionsBySession;
      const snapshot = projections && projections[rootId];
      const values = snapshot && snapshot.values;
      const catalog = values && values.subagentCatalog;
      return Array.isArray(catalog) ? catalog : [];
    }

    /** All descendants of a root in depth-first order, plus direct catalog entries the list has not listed. */
    function descendantIds(list, rootId) {
      const children = buildChildren(list);
      const out = [];
      const seen = new Set([rootId]);
      const walk = (parentId) => {
        const kids = children.get(parentId) || [];
        for (const id of kids) {
          if (seen.has(id)) continue;
          seen.add(id);
          out.push(id);
          walk(id);
        }
      };
      walk(rootId);
      for (const entry of rootCatalog(list, rootId)) {
        if (!entry || typeof entry.id !== 'string' || seen.has(entry.id)) continue;
        seen.add(entry.id);
        out.push(entry.id);
      }
      return out;
    }

    /** Read the most useful visible title for one subagent summary. */
    function subagentLabel(summary, entry, id) {
      const projected = summary && summary.projectionValues && summary.projectionValues.subagent;
      const label = projected && typeof projected.label === 'string' && projected.label !== '' ? projected.label : undefined;
      if (label !== undefined) return label;
      if (summary && typeof summary.title === 'string' && summary.title !== '') return summary.title;
      if (summary && typeof summary.displayTitle === 'string' && summary.displayTitle !== '') return summary.displayTitle;
      if (entry && typeof entry.label === 'string' && entry.label !== '') return entry.label;
      return id;
    }

    /** Map one row and its live status to the rail's state, elapsed time and blocked reason. */
    function statusOf(summary, status, now, observedStart, fallbackActivity) {
      const pending = status && status.pendingInteraction ? status.pendingInteraction : undefined;
      const running = status && typeof status.running === 'boolean'
        ? status.running
        : summary && typeof summary.running === 'boolean'
          ? summary.running
          : fallbackActivity === 'running';
      const timing = summary && summary.projectionValues ? summary.projectionValues.subagentTiming : undefined;
      let elapsedMs;
      if (timing) {
        const settled = typeof timing.settledMs === 'number' ? timing.settledMs : 0;
        if (timing.active) {
          const since = typeof timing.active.since === 'number' ? timing.active.since : now;
          const through = typeof timing.active.through === 'number' ? timing.active.through : now;
          const end = running ? now : through;
          elapsedMs = settled + Math.max(0, end - since);
        } else {
          elapsedMs = settled;
        }
      } else if (running && typeof observedStart === 'number') {
        elapsedMs = Math.max(0, now - observedStart);
      }
      if (pending) return { state: 'blocked', elapsedMs: elapsedMs, pendingKind: pending.kind };
      if (running) return { state: 'running', elapsedMs: elapsedMs, pendingKind: undefined };
      if (timing && timing.lastTurnCompleted === true) return { state: 'done', elapsedMs: elapsedMs, pendingKind: undefined };
      if (timing && timing.lastTurnCompleted === false) return { state: 'blocked', elapsedMs: elapsedMs, pendingKind: 'failed' };
      return { state: 'idle', elapsedMs: elapsedMs, pendingKind: undefined };
    }

    /** Compact active-duration text used inside the running row. */
    function formatElapsed(ms, t) {
      const total = Math.floor(Math.max(0, ms) / 1000);
      const seconds = total % 60;
      const minutes = Math.floor(total / 60) % 60;
      const hours = Math.floor(total / 3600);
      if (hours > 0) return t('elapsed.hours', { hours: hours, minutes: String(minutes).padStart(2, '0') });
      if (total >= 60) return t('elapsed.minutes', { minutes: Math.floor(total / 60), seconds: String(seconds).padStart(2, '0') });
      return t('elapsed.seconds', { seconds: seconds });
    }

    /** Localized word for a state, including the pending-interaction reason. */
    function statusLabel(state, pendingKind, t) {
      if (state === 'blocked' && pendingKind) {
        if (pendingKind === 'approval') return t('blocked.approval');
        if (pendingKind === 'question') return t('blocked.question');
        if (pendingKind === 'plan-review' || pendingKind === 'plan') return t('blocked.plan');
        if (pendingKind === 'failed') return t('blocked.failed');
      }
      return t('status.' + state);
    }

    /** Derive the pinned main row and the depth-first subagent rows. */
    function deriveRows(list, statuses, rootId, now, observedStarts) {
      const byId = (list && list.byId) || {};
      const rows = [];
      function makeRow(id, depth, isMain, summary, entry) {
        const status = statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined;
        const state = statusOf(summary, status, now, observedStarts ? observedStarts.get(id) : undefined, entry ? entry.activity : undefined);
        const label = isMain ? undefined : subagentLabel(summary, entry, id);
        const title = summary && typeof summary.title === 'string' && summary.title !== ''
          ? summary.title
          : summary && typeof summary.displayTitle === 'string' && summary.displayTitle !== ''
            ? summary.displayTitle
            : id;
        return {
          id: id,
          isMain: isMain,
          depth: depth,
          summary: summary,
          catalogMode: entry ? entry.mode : undefined,
          label: label,
          fullTitle: isMain ? title : label,
          state: state.state,
          elapsedMs: state.elapsedMs,
          pendingKind: state.pendingKind,
        };
      }
      rows.push(makeRow(rootId, 0, true, byId[rootId], undefined));
      const children = buildChildren(list);
      const seen = new Set([rootId]);
      const walk = (parentId, depth) => {
        const kids = children.get(parentId) || [];
        for (const id of kids) {
          if (seen.has(id)) continue;
          seen.add(id);
          const row = byId[id];
          if (!row) continue;
          rows.push(makeRow(id, depth, false, row, undefined));
          walk(id, depth + 1);
        }
      };
      walk(rootId, 1);
      for (const entry of rootCatalog(list, rootId)) {
        if (!entry || typeof entry.id !== 'string' || seen.has(entry.id)) continue;
        seen.add(entry.id);
        rows.push(makeRow(entry.id, 1, false, byId[entry.id], entry));
      }
      assignLogoIndices(rows);
      return rows;
    }

    /** Navigate to a row's session without changing the manager's local state. */
    function openRow(row, rootId, mounted) {
      if (mounted === row.id) return;
      let target;
      if (row.isMain) {
        target = rootId;
      } else {
        target = pluginCtx.sessions.subagentAddress(row.id);
        if (target === undefined && row.catalogMode) {
          target = { parentSessionId: rootId, childSessionId: row.id, mode: row.catalogMode };
        }
      }
      if (target === undefined) return;
      try {
        pluginCtx.uiWorkspace.openSession(target);
      } catch (error) {
        console.warn('[subagents-manager] navigation failed', error);
      }
    }

    /** Open or focus the manager for one session's tree root on the current surface. */
    function openManagerForSession(sessionId) {
      const list = pluginCtx.sessions.list.getSnapshot();
      if (!list || list.phase !== 'ready') return;
      const root = rootOf(list, sessionId);
      if (root === undefined || descendantIds(list, root).length === 0) return;
      pluginCtx.sidebarRight.openTab(KIND);
    }

    /** Auto-open once per surface/root while the user is viewing a tree that has subagents. */
    function installAutoOpen(ctx) {
      const opened = new Set();
      const evaluate = () => {
        const mounted = ctx.sidebarRight.mounted.getSnapshot();
        if (mounted === undefined) return;
        const list = ctx.sessions.list.getSnapshot();
        if (!list || list.phase !== 'ready') return;
        const root = rootOf(list, mounted);
        if (root === undefined || descendantIds(list, root).length === 0) return;
        const openTabs = ctx.sidebarRight.openTabs && typeof ctx.sidebarRight.openTabs.getSnapshot === 'function'
          ? ctx.sidebarRight.openTabs.getSnapshot()
          : [];
        if (Array.isArray(openTabs) && openTabs.some((tab) => tab && tab.sessionId === mounted && tab.kind === KIND)) return;
        const key = mounted + '|' + root;
        if (opened.has(key)) return;
        try {
          ctx.sidebarRight.openTab(KIND);
          opened.add(key);
        } catch (error) {
          console.warn('[subagents-manager] auto-open failed', error);
        }
      };
      const disposers = [
        ctx.sidebarRight.mounted.subscribe(evaluate),
        ctx.sessions.list.subscribe(evaluate),
      ];
      evaluate();
      return () => {
        for (const dispose of disposers) {
          try {
            dispose();
          } catch (_ignore) {}
        }
      };
    }

    /** Build a stable subscribe callback for one observable. */
    function useStore(source) {
      return React.useSyncExternalStore(
        React.useCallback((listener) => source.subscribe(listener), [source]),
        () => source.getSnapshot()
      );
    }

    /** Shared manager glyph for the guide card, tab chip, and header control. */
    function ManagerIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 16;
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 20 20',
        fill: 'none',
        className: props.className,
        'aria-hidden': 'true',
      },
        h('rect', { x: 3, y: 4, width: 14, height: 12, rx: 2, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M3 8h14M8 8v8', stroke: 'currentColor', strokeWidth: 1.4 })
      );
    }

    /** One subagent's deterministic limited-palette logo. */
    function AgentLogo(props) {
      const count = LOGO_PATHS.length;
      const raw = typeof props.index === 'number' ? props.index : 0;
      const index = ((raw % count) + count) % count;
      const paths = LOGO_PATHS[index];
      return h('span', {
        className: 'dsm-logo',
        style: { color: LOGO_COLORS[index % LOGO_COLORS.length] },
        'aria-hidden': 'true',
      },
        h('svg', { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none' },
          paths.map((d, pathIndex) => h('path', {
            key: pathIndex,
            d: d,
            stroke: 'currentColor',
            strokeWidth: 1.3,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }))
        )
      );
    }

    /** Small glyph that marks the pinned main-agent row. */
    function MainGlyph() {
      return h('span', { className: 'dsm-main-mark', 'aria-hidden': 'true' },
        h('svg', { width: 12, height: 12, viewBox: '0 0 20 20', fill: 'none' },
          h('circle', { cx: 10, cy: 7, r: 3, stroke: 'currentColor', strokeWidth: 1.4 }),
          h('path', { d: 'M4 17c1.2-3 3.4-4.5 6-4.5s4.8 1.5 6 4.5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' })
        )
      );
    }

    /** Right-aligned status slot: a running time and a colored dot never share it. */
    function StatusSlot(props) {
      const row = props.row;
      if (row.state === 'running' && !row.isMain) {
        return h('span', {
          className: 'dsm-status-slot dsm-status-time',
          'data-dsm-status': 'running',
          'aria-hidden': 'true',
        }, h('span', { className: 'dsm-elapsed' }, props.elapsedText));
      }
      const label = statusLabel(row.state, row.pendingKind, props.t);
      return h('span', {
        className: 'dsm-status-slot dsm-state-' + row.state,
        'data-dsm-status': row.state,
        'data-dsm-blocked-kind': row.pendingKind || undefined,
        title: label,
        'aria-hidden': 'true',
      }, h('span', { className: 'dsm-dot' }));
    }

    /** One-line title that marquees only when the available width cannot hold it. */
    function MarqueeTitle(props) {
      const clipRef = React.useRef(null);
      const [overflow, setOverflow] = React.useState(false);
      React.useLayoutEffect(() => {
        const clip = clipRef.current;
        if (!clip) return;
        const measure = () => {
          setOverflow(clip.scrollWidth > clip.clientWidth + 1);
        };
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(clip);
        return () => observer.disconnect();
      }, [props.text]);
      const duration = String(Math.max(8, Math.min(24, props.text.length * 0.22))) + 's';
      return h('span', { className: 'dsm-title-clip', ref: clipRef },
        h('span', {
          className: 'dsm-title-track' + (overflow ? ' dsm-marquee' : ''),
          style: overflow ? { animationDuration: duration } : undefined,
          'aria-hidden': 'true',
        },
          h('span', { className: 'dsm-title-text' }, props.text),
          overflow ? h('span', { className: 'dsm-title-text dsm-title-dup' }, props.text) : null
        )
      );
    }

    /** One pinned or scrolling row in the rail. */
    function ManagerRow(props) {
      const row = props.row;
      const t = props.t;
      const elapsedText = !row.isMain && row.state === 'running'
        ? formatElapsed(typeof row.elapsedMs === 'number' ? row.elapsedMs : 0, t)
        : '';
      const status = statusLabel(row.state, row.pendingKind, t);
      const title = row.isMain ? t('mainAria', { title: row.fullTitle }) : row.label;
      const aria = t('rowAria', { title: title, status: status, elapsed: elapsedText === '' ? '' : ' · ' + elapsedText });
      const paddingLeft = 8 + Math.min(row.depth, 3) * 10;
      return h('button', {
        type: 'button',
        className: 'dsm-row' + (row.isMain ? ' dsm-row-main' : '') + (props.active ? ' dsm-row-active' : ''),
        'aria-current': props.active ? 'page' : undefined,
        'aria-label': aria,
        title: row.fullTitle,
        'data-dsm-id': row.id,
        'data-dsm-kind': row.isMain ? 'main' : 'subagent',
        'data-dsm-state': row.state,
        'data-dsm-depth': String(row.depth),
        style: { paddingLeft: paddingLeft + 'px' },
        onClick: props.onOpen,
      },
        row.isMain ? h(MainGlyph) : h(AgentLogo, { index: row.logoIndex }),
        h(MarqueeTitle, { text: row.isMain ? t('main') : row.label }),
        h(StatusSlot, { row: row, t: t, elapsedText: elapsedText })
      );
    }

    /** Right-Sidebar body: pinned main row plus the scrollable subagent rail. */
    function ManagerTab(props) {
      const t = props.t || pluginCtx.locale.bind(NS);
      const list = useStore(pluginCtx.sessions.list);
      const statuses = useStore(pluginCtx.uiSession.sessionStatus);
      const mounted = useStore(pluginCtx.sidebarRight.mounted);
      const rootId = mounted !== undefined ? rootOf(list, mounted) : undefined;
      const [now, setNow] = React.useState(() => Date.now());
      const observed = React.useRef(new Map());
      const rows = React.useMemo(
        () => (rootId === undefined ? [] : deriveRows(list, statuses, rootId, now, observed.current)),
        [list, statuses, rootId, now]
      );
      const anyRunning = rows.some((row) => row.state === 'running');
      React.useEffect(() => {
        if (!anyRunning) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
      }, [anyRunning]);
      React.useEffect(() => {
        const starts = observed.current;
        for (const row of rows) {
          if (row.state === 'running' && typeof row.elapsedMs !== 'number') {
            if (!starts.has(row.id)) starts.set(row.id, Date.now());
          } else {
            starts.delete(row.id);
          }
        }
      }, [rows]);
      if (rootId === undefined) {
        return h('div', { className: 'dsm-root' },
          h('div', { className: 'dsm-empty' }, t('loading'))
        );
      }
      if (rows.length === 0) {
        return h('div', { className: 'dsm-root', 'data-dsm-manager-root': rootId },
          h('div', { className: 'dsm-empty' }, t('empty'))
        );
      }
      const main = rows[0];
      const subagents = rows.slice(1);
      return h('div', { className: 'dsm-root', 'data-dsm-manager-root': rootId },
        h('div', { className: 'dsm-main' },
          h(ManagerRow, { row: main, t: t, active: mounted === main.id, onOpen: () => openRow(main, rootId, mounted) })
        ),
        h('div', { className: 'dsm-list', role: 'navigation', 'aria-label': t('listLabel') },
          subagents.length === 0
            ? h('div', { className: 'dsm-empty' }, t('empty'))
            : subagents.map((row) => h(ManagerRow, {
              key: row.id,
              row: row,
              t: t,
              active: mounted === row.id,
              onOpen: () => openRow(row, rootId, mounted),
            }))
        )
      );
    }

    /** Conversation-header control that reopens or focuses the manager. */
    function ManagerHeaderButton(props) {
      const t = props.t || pluginCtx.locale.bind(NS);
      const list = props.useSessions((state) => state);
      const root = React.useMemo(
        () => (list && props.sessionId !== undefined ? rootOf(list, props.sessionId) : undefined),
        [list, props.sessionId]
      );
      const count = React.useMemo(
        () => (list && root !== undefined ? descendantIds(list, root).length : 0),
        [list, root]
      );
      if (count === 0 || typeof props.openManager !== 'function') return null;
      return h('button', {
        type: 'button',
        className: 'dsm-header-button',
        'aria-label': t('open'),
        title: t('open'),
        'data-dsm-header-button': '',
        onClick: () => {
          try {
            props.openManager();
          } catch (error) {
            console.warn('[subagents-manager] open failed', error);
          }
        },
      },
        h(ManagerIcon, { size: 16 })
      );
    }

    /** Tab-chip title: the shared glyph plus the localized manager name. */
    function ManagerTabTitle(props) {
      const t = props.t || pluginCtx.locale.bind(NS);
      return h(React.Fragment, null,
        h(ManagerIcon, { size: 14, className: 'dsm-tab-icon' }),
        t('title')
      );
    }

    /** Register the page type, its guide entry, and the auto-open watcher. */
    function registerSidebar(ctx) {
      ctx.inject(['sidebarRightTabs'], (scope) => {
        ctx.effect(() => scope.sidebarRightTabs.register({
          id: ID,
          kind: KIND,
          priority: 'extension',
          title: () => ctx.locale.bind(NS)('title'),
          guide: [{
            id: 'subagents-manager',
            kind: KIND,
            order: 30,
            title: () => ctx.locale.bind(NS)('title'),
            description: () => ctx.locale.bind(NS)('guide.description'),
            icon: ManagerIcon,
          }],
        }), 'subagents-manager: tab type');
        ctx.effect(() => installAutoOpen(ctx), 'subagents-manager: auto open');
      });
    }

    /** Client plugin body. */
    function apply(ctx) {
      pluginCtx = ctx;
      ctx.effect(() => {
        if (typeof document === 'undefined' || !document.head) return;
        const style = document.createElement('style');
        style.dataset.plugin = ID;
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => {
          if (style.parentNode) style.parentNode.removeChild(style);
        };
      }, 'subagents-manager: styles');
      ctx.effect(() => ctx.locale.register(NS, { zh: zh, en: en }), 'subagents-manager: locale');
      registerSidebar(ctx);
      ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
        name: 'sidebar.right.pane.tab',
        key: ID,
        locale: NS,
      }, ManagerTab));
      ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
        name: 'sidebar.right.pane.tab.title',
        key: ID,
        locale: NS,
      }, ManagerTabTitle));
      ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'subagents-manager',
        order: 20,
        locale: NS,
        inject: (sessionId) => ({ openManager: () => openManagerForSession(sessionId) }),
      }, ManagerHeaderButton));
    }

    return {
      inject: ['sessions', 'uiSession', 'uiWorkspace', 'sidebarRight', 'slots', 'locale'],
      apply: apply,
      __test: {
        ID: ID,
        KIND: KIND,
        rootOf: rootOf,
        descendantIds: descendantIds,
        deriveRows: deriveRows,
        statusOf: statusOf,
        formatElapsed: formatElapsed,
        statusLabel: statusLabel,
        zh: zh,
        en: en,
      },
    };
  },
});
