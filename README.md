# Subagents Manager

在 DSH Web GUI 右侧边栏提供一个「Subagents Manager」：主 Agent 行冻结在顶部，子 Agent 行在下方滚动；点击行切换中间会话，当前打开的会话高亮；运行中的行显示已运行时间，完成/阻滞/空闲显示状态点；长标题在行内滚动显示。

## 入口与图标

- 右侧边栏新标签页的「开始」页（guide）新增一张 **Subagents Manager** 卡片，带图标和说明；点击即可打开管理器。
- 管理器标签本身有专用图标和标题；标题通过 `sidebar.right.pane.tab.title` 槽注册，跟着当前语言更新。
- 会话头部还有一个小图标按钮，用于在关闭管理器后重新打开。

## 外观与行为

- **主 Agent 行**：固定在管理器顶部，不随子 Agent 列表滚动。显示主 Agent 标记、标题和右侧状态槽。
- **子 Agent 行**：按层级深度优先排列，缩进表示嵌套；每个子 Agent 从有限的 SVG Logo/配色组中取一个稳定图标，按会话 id 分配并尽量避免相邻重复，超出组数后循环使用；列表可纵向滚动。
- **右侧状态槽**：所有行共用同一个右对齐的 56px 槽位，状态点和时间互斥。
  - 运行中：显示已运行时间（蓝色、等宽数字），不显示圆点。
  - 已完成：绿点。
  - 阻滞/失败：红点。阻滞来自 DSH 的 `pendingInteraction`（审批、提问、计划确认）；最后一轮未正常完成的已停止子 Agent 也显示红点。
  - 空闲：灰点。
  - 主 Agent 运行中显示蓝色脉冲点（主会话没有 `subagentTiming`，因此不显示计时）。
- **标题滚动**：标题超出可用宽度时在行内以 marquee 滚动；完整标题保留在行按钮的 `aria-label` 与悬停 `title` 中；`prefers-reduced-motion` 下不滚动。
- **切换**：点击子 Agent 行调用 `uiWorkspace.openSession(subagentAddress)`；点击主 Agent 行回到根会话。当前行由 `sidebarRight.mounted` 决定，高亮用 `aria-current="page"`。
- **自动打开**：当前显示会话所属树的根有子 Agent 时，在右侧边栏自动打开管理器页。每个 surface/根在当前页面生命周期内只自动打开一次；用户关闭后不会反复弹出。
- **关闭**：使用右侧边栏标签自带的关闭按钮；头部按钮用于显式重开。

## 安装

本目录是 DSH profile 的本地 bundle（`@local/subagents-manager`）。它已经安装到 `~/.dsh/profiles/desktop`；在别的 profile 中安装时使用：

```sh
cd ~/.dsh/profiles/<profile>
pnpm add link:/absolute/path/to/subagents-manager --ignore-scripts
```

然后把 `@local/subagents-manager` 追加到该 profile `package.json` 的 `dsh.profile.bundles` 末尾。也可以在侧栏「插件」页面通过本地目录安装。

安装后 Host 会读取本包的 `dsh.bundle.patch`，把 `subagents-manager` 行挂到 Loader；`client.js` 由 Web 客户端模块系统作为浏览器插件加载。当前验证版本为 DSH `0.2.1-rc.5`。

## 卸载 / 回滚

1. 从 profile 的 `dsh.profile.bundles` 移除 `@local/subagents-manager`。
2. `pnpm remove @local/subagents-manager --ignore-scripts`（或恢复安装前的 profile 备份）。
3. 刷新 Web 页面；插件卸载后，已保存的管理器标签会显示右侧边栏的「类型缺失」占位，可手动关闭。

## 开发与测试

- 语法检查：`node --check client.js && node --check index.js`
- 单元/接口测试：`node --test tests/manager.test.js`
- GUI 冒烟（需要已存在的、带子 Agent 的会话）：

```sh
DSH_GUI_URL=http://127.0.0.1:<port> \
DSH_SESSION_TITLE='SubAgent 标签式会话管理' \
DSH_PLAYWRIGHT_BASE=/path/to/dsh/apps/web/package.json \
node tests/gui-smoke.mjs
```

  - 脚本从 Electron Cookies 数据库读取 `dsh-auth-*` cookie；也可用 `DSH_GUI_COOKIE='name=value'` 覆盖。
  - 默认使用系统 Chrome（`channel: 'chrome'`），失败时回退到 Playwright 自带的 Chromium。
  - 截图写到 `DSH_SHOT_DIR`（默认 `/tmp/dsm-smoke`）。

修改 `client.js` 后，Host 的客户端模块图按文件修订号提供新 bundle；如果当前桌面渲染页没有自动重载，刷新页面即可。profile 的 `cordis.patch.yml`/`package.json` 变化由 DSH HMR 监听。

## 限制

- 仅支持本地 Session；外部任务（非本地子会话）不进入管理器。
- 自动打开只保证每个 surface/根一次；关闭后由头部按钮重开，不会自动再次弹出。
- 右侧边栏是 per-session 布局；切换会话树中的子会话时，新 surface 会自动打开同一根的管理器，以保持视觉连续。
- 主 Agent 行只显示运行点，不显示计时（主会话没有子 Agent 的 `subagentTiming`）。
- 管理器页由当前 surface 的 `sidebarRight.mounted` 求根，因此手动在任意会话打开时显示该会话所属树；没有子 Agent 时只显示主行和空状态。
- 本插件不修改 DSH 核心源码，不提供子 Agent 的启动、中断、删除或重命名控件。

## 文件

| 文件 | 作用 |
| --- | --- |
| `index.js` | 惰性 Host 入口，让客户端模块图能关联本包。 |
| `client.js` | 浏览器 bundle：页类型、guide 卡片、标签图标、有限 Logo 分配、数据推导、UI、自动打开和头部按钮。 |
| `cordis.patch.yml` | bundle 的 Loader 行插入补丁。 |
| `locale/*.json` | 插件管理页的显示标题与描述。 |
| `LICENSE` | GNU GPL v3.0 许可证全文。 |
| `tests/manager.test.js` | 纯函数与注册/自动打开接口测试。 |
| `tests/gui-smoke.mjs` | 真实 Web GUI 冒烟测试。 |

## License

Copyright (C) 2026 He0xD4C0.

This project is licensed under the GNU General Public License v3.0. See [LICENSE](./LICENSE).
