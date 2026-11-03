import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

function die(message) {
  console.error('FAIL ' + message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) die(message);
}

function readCookie(url) {
  const db = join(homedir(), 'Library/Application Support/@deepseek-ai/dsh-desktop/Cookies');
  let output;
  try {
    output = execFileSync('sqlite3', [db, 'select name,value from cookies;'], { encoding: 'utf8' });
  } catch (error) {
    die('could not read the Electron cookie database: ' + String(error));
  }
  const authority = new URL(url).host;
  for (const line of output.split('\n')) {
    if (line === '') continue;
    const separator = line.indexOf('|');
    if (separator < 0) continue;
    const name = line.slice(0, separator);
    const value = line.slice(separator + 1);
    const parts = value.split('.');
    if (parts.length < 3) continue;
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (payload.authority === authority) return name + '=' + value;
    } catch (_invalid) {}
  }
  die('no dsh-auth cookie for ' + authority);
}

async function loadChromium() {
  try {
    const module = await import('playwright');
    return module.chromium;
  } catch (_notInstalled) {}
  const base = process.env.DSH_PLAYWRIGHT_BASE;
  if (!base) die('Playwright is not importable; set DSH_PLAYWRIGHT_BASE to a package.json with playwright installed');
  const requireFrom = createRequire(base.endsWith('.json') ? base : join(base, 'package.json'));
  return requireFrom('playwright').chromium;
}

const url = process.env.DSH_GUI_URL || 'http://127.0.0.1:56842';
const title = process.env.DSH_SESSION_TITLE || 'SubAgent 标签式会话管理';
const shotDir = process.env.DSH_SHOT_DIR || '/tmp/dsm-smoke';
const cookie = process.env.DSH_GUI_COOKIE || readCookie(url);
const separator = cookie.indexOf('=');
if (separator < 0) die('DSH_GUI_COOKIE must be name=value');
const cookieName = cookie.slice(0, separator);
const cookieValue = cookie.slice(separator + 1);

const chromium = await loadChromium();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch (_noChrome) {
  browser = await chromium.launch({ headless: true });
}
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: cookieName, value: cookieValue, domain: new URL(url).hostname, path: '/' }]);
const page = await context.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text().slice(0, 300));
});
page.on('pageerror', (error) => errors.push('PAGEERROR ' + String(error).slice(0, 300)));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
const welcome = page.getByRole('button', { name: /继续|Continue/ });
if (await welcome.count()) {
  await welcome.click();
  await page.waitForTimeout(300);
}
const searchShortcut = page.locator('button[aria-keyshortcuts="Alt+Meta+K"]').first();
if (await searchShortcut.count()) {
  await searchShortcut.click();
} else {
  await page.getByRole('button', { name: /搜索会话|Search sessions/ }).click();
}
await page.waitForTimeout(300);
await page.keyboard.type(title);
await page.waitForTimeout(1000);
const result = page.getByText(title, { exact: false }).first();
assert(await result.count(), 'session search result is missing');
await result.click();
await page.waitForTimeout(3000);

assert(await page.locator('[data-dsm-manager-root]').count() > 0, 'manager did not auto-open');
const main = page.locator('[data-dsm-kind="main"]').first();
assert(await main.count(), 'main row is missing');
const subagents = page.locator('[data-dsm-kind="subagent"]');
const subagentCount = await subagents.count();
assert(subagentCount > 0, 'subagent rows are missing');

const slots = await page.locator('[data-dsm-id]').evaluateAll((rows) => rows.map((row) => {
  const slot = row.querySelector('.dsm-status-slot');
  const rect = slot ? slot.getBoundingClientRect() : null;
  return {
    id: row.getAttribute('data-dsm-id'),
    hasDot: !!row.querySelector('.dsm-dot'),
    hasTime: !!row.querySelector('.dsm-elapsed'),
    right: rect ? Math.round(rect.right) : null,
  };
}));
assert(slots.every((slot) => slot.hasDot !== slot.hasTime), 'a status slot shows both a dot and a time');
const rights = new Set(slots.map((slot) => slot.right));
assert(rights.size === 1, 'status slots are not right-aligned to one column');

const pinned = await page.evaluate(() => {
  const mainRow = document.querySelector('[data-dsm-kind="main"]');
  if (!mainRow) return false;
  const mainBlock = mainRow.closest('.dsm-main');
  const list = mainBlock ? mainBlock.nextElementSibling : null;
  return !!list && list.classList.contains('dsm-list') && !list.contains(mainRow);
});
assert(pinned, 'the main row is not pinned outside the scrolling list');

assert(await page.locator('[data-dsm-kind="subagent"] .dsm-logo').count() === subagentCount, 'subagent logos are missing');
assert(await page.locator('.dsm-branch').count() === 0, 'branch glyph should not render');
const logoColors = await page.locator('[data-dsm-kind="subagent"] .dsm-logo').evaluateAll((logos) => logos.map((logo) => getComputedStyle(logo).color));
assert(new Set(logoColors).size >= Math.min(4, subagentCount), 'subagent logos are not varied enough');
assert(await page.locator('[data-sidebar-right-session] .dsm-tab-icon').count() > 0, 'manager tab icon is missing');

const addTab = page.locator('[data-sidebar-right-session] button[aria-label="新标签页"]').first();
assert(await addTab.count(), 'right sidebar add-tab button is missing');
await addTab.click();
await page.waitForTimeout(1200);
const guide = page.locator('[data-sidebar-right-guide-entry="subagents-manager"]');
assert(await guide.count() > 0, 'Subagents Manager guide entry is missing');
assert(await guide.locator('svg').count() > 0, 'guide entry icon is missing');
await guide.click();
await page.waitForTimeout(1500);
assert(await page.locator('[data-dsm-manager-root]').count() > 0, 'guide entry did not open the manager');

const rootId = await page.locator('[data-dsm-kind="main"]').first().getAttribute('data-dsm-id');
const firstSubagent = page.locator('[data-dsm-kind="subagent"]').first();
const childId = await firstSubagent.getAttribute('data-dsm-id');
await firstSubagent.click();
await page.waitForTimeout(2000);
const center = await page.locator('[data-conversation-session]').first().getAttribute('data-conversation-session');
assert(center !== rootId, 'clicking a subagent row did not switch the center conversation');
assert(await page.locator('[data-dsm-id="' + childId + '"][aria-current="page"]').count() > 0, 'the child row is not highlighted');
await page.locator('[data-dsm-kind="main"]').first().click();
await page.waitForTimeout(2000);
const centerBack = await page.locator('[data-conversation-session]').first().getAttribute('data-conversation-session');
assert(centerBack === rootId, 'clicking the main row did not return to the root conversation');
assert(await page.locator('[data-dsm-id="' + rootId + '"][aria-current="page"]').count() > 0, 'the main row is not highlighted');

mkdirSync(shotDir, { recursive: true });
await page.screenshot({ path: join(shotDir, 'manager.png') });
assert(errors.length === 0, 'console/page errors: ' + errors.join(' | '));
console.log('PASS Subagents Manager smoke: subagents=' + String(subagentCount) + ', guide entry, tab icon, alignment, switching');
await browser.close();
