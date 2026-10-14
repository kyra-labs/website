// Proves the built pages are complete without JavaScript: every page, at desktop and phone width,
// with JavaScript disabled and motion allowed (the worst case for "hidden until animated" CSS).
// Fails if any visible text ends up transparent (effective opacity < 1) or visibility:hidden
// after the load entrance has had time to finish. Saves full-page screenshots for the PR.
//
// Usage: node scripts/check-no-js.mjs [distDir] [screenshotDir]
// Chrome: CHROME_PATH, else the usual Windows / Linux install paths.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const DIST = resolve(process.argv[2] ?? 'dist');
const SHOTS = resolve(process.argv[3] ?? 'no-js-screenshots');
const CHROME =
  process.env.CHROME_PATH ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find(
    (path) => existsSync(path),
  );
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(DIST, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

mkdirSync(SHOTS, { recursive: true });
const pages = readdirSync(DIST).filter((name) => name.endsWith('.html'));
const browser = await chromium.launch({ executablePath: CHROME });
const problems = [];

for (const [label, viewport, mobile] of [
  ['desktop', { width: 1440, height: 900 }, false],
  ['mobile', { width: 390, height: 844 }, true],
]) {
  const context = await browser.newContext({
    viewport,
    javaScriptEnabled: false,
    reducedMotion: 'no-preference',
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  for (const name of pages) {
    await page.goto(`${base}/${name}`, { waitUntil: 'load' });
    // Long enough for the CSS load entrance (transform only) to finish.
    await page.waitForTimeout(2000);
    const hidden = await page.evaluate(() => {
      const found = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (el.closest('[aria-hidden="true"], template, script, style, .skip-link')) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue; // display:none or collapsed on purpose
        let opacity = 1;
        for (let node = el; node instanceof Element; node = node.parentElement) {
          opacity *= Number(getComputedStyle(node).opacity);
        }
        if (opacity < 0.999 || getComputedStyle(el).visibility === 'hidden') {
          found.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 50)}" opacity ${opacity.toFixed(2)}`);
        }
      }
      return found;
    });
    for (const item of hidden) problems.push(`${name} (${label}): ${item}`);
    await page.screenshot({ path: join(SHOTS, `${name.replace('.html', '')}-nojs-${label}.png`), fullPage: true });
    console.log(`${hidden.length === 0 ? '✓' : '✗'} ${name} (${label}, JS off): ${hidden.length === 0 ? 'all text visible' : `${hidden.length} hidden`}`);
  }
  await context.close();
}
await browser.close();
server.close();

if (problems.length > 0) {
  console.error(`\n✗ Text hidden without JavaScript:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`\n✓ Pages complete without JavaScript (screenshots in ${SHOTS}).`);
