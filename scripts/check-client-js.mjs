// Fails unless every piece of client JavaScript in dist/ is expected:
// - the allowed islands (client:only="react") listed in ALLOWED_ISLANDS;
// - Astro's island runtime (the client:only loader and the <astro-island> element);
// - one progressive-enhancement module per page (src/scripts/enhance.ts: press ripple + html.js),
//   inline or as a file, never in <head>, at most ENHANCEMENT_BUDGET gzip;
// - JSON-LD data blocks.
// It also fails on inline event handlers, javascript: URLs, any classic <script src>, any other
// inline script, and any .js file in dist/ not reachable from an allowed entry.
//
// (2026-10-15: the owner replaced "zero client JS except islands" with "small, non-blocking
// enhancement scripts are fine if content, SEO and performance can't suffer"; see CLAUDE.md.)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, posix } from 'node:path';
import { gzipSync } from 'node:zlib';
import { Parser } from 'htmlparser2';

const DIST = resolve(process.argv[2] ?? 'dist');
const ALLOWED_ISLANDS = {
  SectionNav: 'navigation (ShortNavigationBar)',
  WaitlistForm: 'LoadingIndicator (waitlist form)',
};
// Astro's island runtime, inlined once per page that has islands.
// The enhancement module: carries the m3e ripple and sets html.js.
const ENHANCEMENT_BUDGET = 4 * 1024;
const isEnhancement = (code) =>
  /classList\.add\(\s*[`'"]js[`'"]\s*\)/.test(code) && code.includes('--_m3e-ripple-');
const RUNTIME_SIGNATURES = [
  { name: 'astro client:only loader', test: (s) => s.includes('astro:only') && s.length < 1024 },
  {
    name: 'astro-island element',
    test: (s) => s.includes('customElements.define(`astro-island`') || s.includes('customElements.define("astro-island"'),
  },
];

const errors = [];
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
const all = files(DIST);
const rel = (path) => relative(DIST, path).split('\\').join('/');
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const entryUrls = new Set();
const pageReports = [];

for (const page of all.filter((f) => f.endsWith('.html'))) {
  const report = { page: rel(page), jsonLd: 0, runtime: [], islands: [], enhancement: [] };
  let script = null;
  let inHead = false;
  const checkEnhancement = (code, where) => {
    const gz = gzipSync(code).length;
    if (!isEnhancement(code)) return `${where} is not the enhancement module`;
    if (report.enhancement.length > 0) return `${where}: more than one enhancement script`;
    if (gz > ENHANCEMENT_BUDGET) return `${where}: ${kb(gz)} gzip, over the ${kb(ENHANCEMENT_BUDGET)} budget`;
    report.enhancement.push(`${where}, ${kb(code.length)} (${kb(gz)} gzip)`);
    return null;
  };
  const parser = new Parser(
    {
      onopentag(name, attrs) {
        for (const [attr, value] of Object.entries(attrs)) {
          if (/^on[a-z]+$/i.test(attr)) errors.push(`${report.page}: inline handler ${attr} on <${name}>`);
          if (/^\s*javascript:/i.test(value)) errors.push(`${report.page}: javascript: URL in ${attr}`);
        }
        if (name === 'head') inHead = true;
        if (name === 'script') script = { attrs, text: '', inHead };
        if (name === 'astro-island') {
          const opts = JSON.parse(attrs.opts ?? '{}');
          const island = `${opts.name} (client:${attrs.client})`;
          if (attrs.client !== 'only') errors.push(`${report.page}: ${island} is not client:only`);
          if (!(opts.name in ALLOWED_ISLANDS)) errors.push(`${report.page}: island ${opts.name} is not allowed`);
          else {
            entryUrls.add(attrs['component-url']);
            entryUrls.add(attrs['renderer-url']);
          }
          report.islands.push(island);
        }
      },
      ontext(text) {
        if (script) script.text += text;
      },
      onclosetag(name) {
        if (name === 'head') inHead = false;
        if (name !== 'script' || !script) return;
        const { attrs, text } = script;
        const head = script.inHead;
        script = null;
        if (attrs.type === 'application/ld+json') {
          try {
            JSON.parse(text);
            report.jsonLd += 1;
          } catch {
            errors.push(`${report.page}: invalid JSON-LD`);
          }
          return;
        }
        if (attrs.type === 'module') {
          if (head) return void errors.push(`${report.page}: module script in <head>`);
          if (attrs.src) {
            let code = '';
            try {
              code = readFileSync(join(DIST, attrs.src.replace(/^\//, '')), 'utf8');
            } catch {
              return void errors.push(`${report.page}: missing ${attrs.src}`);
            }
            const problem = checkEnhancement(code, `module ${attrs.src}`);
            if (problem) return void errors.push(`${report.page}: ${problem}`);
            entryUrls.add(attrs.src);
            return;
          }
          const problem = checkEnhancement(text, 'inline module');
          if (problem) errors.push(`${report.page}: ${problem}`);
          return;
        }
        if (attrs.src) return void errors.push(`${report.page}: <script src="${attrs.src}">`);
        const runtime = RUNTIME_SIGNATURES.find((sig) => sig.test(text));
        if (!runtime || attrs.type) {
          errors.push(`${report.page}: unexpected inline script: ${text.trim().slice(0, 80)}…`);
          return;
        }
        report.runtime.push(runtime.name);
      },
    },
    { decodeEntities: true },
  );
  parser.end(readFileSync(page, 'utf8'));
  pageReports.push(report);
}

// Walk the static and dynamic import graph from the island entry points.
const jsFiles = all.filter((f) => /\.(m?js)$/.test(f)).map(rel);
const reachable = new Set();
const queue = [...entryUrls].map((url) => url.replace(/^\//, ''));
while (queue.length > 0) {
  const file = queue.pop();
  if (reachable.has(file)) continue;
  if (!jsFiles.includes(file)) {
    errors.push(`island entry ${file} not found in dist/`);
    continue;
  }
  reachable.add(file);
  const source = readFileSync(join(DIST, file), 'utf8');
  for (const [, spec] of source.matchAll(/(?:from|import)\s*\(?\s*["'`]([^"'`]+\.m?js)["'`]/g)) {
    queue.push(posix.normalize(posix.join(posix.dirname(file), spec)).replace(/^\//, ''));
  }
}
for (const file of jsFiles) {
  if (!reachable.has(file)) errors.push(`${file} is client JS outside the allowed islands`);
}

// Report.
console.log('Client JS check: dist/ (%s)\n', rel(DIST) || DIST);
for (const r of pageReports) {
  console.log(`${r.page}`);
  console.log(`  JSON-LD data blocks: ${r.jsonLd}`);
  console.log(`  Astro runtime:       ${r.runtime.join(', ') || 'none'}`);
  console.log(`  Enhancement:         ${r.enhancement.join('; ') || 'none'}`);
  console.log(`  Islands:             ${r.islands.map((i) => `${i} → ${ALLOWED_ISLANDS[i.split(' ')[0]] ?? '?'}`).join('; ') || 'none'}`);
}
console.log('\nJS files (all reachable from allowed entries only):');
let raw = 0;
let gz = 0;
for (const file of jsFiles.sort()) {
  const bytes = readFileSync(join(DIST, file));
  raw += bytes.length;
  gz += gzipSync(bytes).length;
  console.log(`  ${reachable.has(file) ? '✓' : '✗'} ${file}  ${kb(bytes.length)} (${kb(gzipSync(bytes).length)} gzip)`);
}
console.log(`  total ${kb(raw)} (${kb(gz)} gzip)`);

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('\n✓ Only expected client JS: allowed islands, Astro runtime, the enhancement module.');
