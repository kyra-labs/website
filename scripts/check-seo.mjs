// Fails unless the built pages carry the search basics Google reads for the site name and the
// result snippet (https://developers.google.com/search/docs/appearance/site-names):
// - every page: one <title> of at most TITLE_MAX characters, one meta description of
//   DESCRIPTION_MIN–DESCRIPTION_MAX characters, one absolute https canonical pointing at the page
//   itself, og:title equal to the <title>, og:site_name equal to SITE_NAME, and JSON-LD blocks that
//   all parse (@graph is flattened);
// - the home page: exactly one WebSite node, named SITE_NAME, whose url is the canonical, exactly
//   one Organization with ORGANIZATION_ID, and a <title> that starts with SITE_NAME;
// - every other page: no WebSite node (the site name is stated once, on the home page).
//
// (2026-10-22: the home page's WebSite node was removed by accident in July 2026 and nothing
// noticed for three months, while Google showed "kyralabs.dev" instead of "Kyra Labs".)
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Parser } from 'htmlparser2';

const DIST = resolve(process.argv[2] ?? 'dist');
const ORIGIN = 'https://kyralabs.dev';
const SITE_NAME = 'Kyra Labs';
const ORGANIZATION_ID = 'https://kyralabs.dev/#organization';
// Page file in dist/ → its public URL. index.html is the home page.
const PAGES = {
  'index.html': `${ORIGIN}/`,
  'privacy.html': `${ORIGIN}/privacy.html`,
};
const HOME = 'index.html';
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;

const errors = [];
const length = (text) => [...text].length;
const types = (node) => [node['@type']].flat().filter(Boolean);

const readHead = (html) => {
  const head = { titles: [], descriptions: [], canonicals: [], meta: {}, jsonLd: [] };
  let capture = null;
  const parser = new Parser(
    {
      onopentag(name, attrs) {
        if (name === 'title') capture = { kind: 'title', text: '' };
        if (name === 'script' && attrs.type === 'application/ld+json') capture = { kind: 'ld', text: '' };
        if (name === 'meta' && attrs.name === 'description') head.descriptions.push(attrs.content ?? '');
        if (name === 'meta' && attrs.property?.startsWith('og:')) {
          (head.meta[attrs.property] ??= []).push(attrs.content ?? '');
        }
        if (name === 'link' && attrs.rel?.split(/\s+/).includes('canonical')) head.canonicals.push(attrs.href ?? '');
      },
      ontext(text) {
        if (capture) capture.text += text;
      },
      onclosetag(name) {
        if (!capture) return;
        if (name === 'title' && capture.kind === 'title') head.titles.push(capture.text.trim());
        if (name === 'script' && capture.kind === 'ld') head.jsonLd.push(capture.text);
        if (name === 'title' || name === 'script') capture = null;
      },
    },
    { decodeEntities: true },
  );
  parser.end(html);
  return head;
};

const reports = [];
for (const [page, url] of Object.entries(PAGES)) {
  const fail = (message) => errors.push(`${page}: ${message}`);
  let html = '';
  try {
    html = readFileSync(join(DIST, page), 'utf8');
  } catch {
    fail('missing (run pnpm build first)');
    continue;
  }
  const head = readHead(html);
  const report = { page, title: '', description: '', canonical: '', nodes: [] };

  if (head.titles.length !== 1) fail(`${head.titles.length} <title> elements, expected 1`);
  const title = (report.title = head.titles[0] ?? '');
  if (length(title) === 0) fail('empty <title>');
  if (length(title) > TITLE_MAX) fail(`<title> is ${length(title)} characters, over ${TITLE_MAX}: "${title}"`);

  if (head.descriptions.length !== 1) fail(`${head.descriptions.length} meta descriptions, expected 1`);
  const description = (report.description = head.descriptions[0] ?? '');
  if (length(description) < DESCRIPTION_MIN || length(description) > DESCRIPTION_MAX) {
    fail(`meta description is ${length(description)} characters, outside ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}`);
  }

  if (head.canonicals.length !== 1) fail(`${head.canonicals.length} canonical links, expected 1`);
  const canonical = (report.canonical = head.canonicals[0] ?? '');
  let canonicalUrl = null;
  try {
    canonicalUrl = new URL(canonical);
  } catch {
    fail(`canonical "${canonical}" is not an absolute URL`);
  }
  if (canonicalUrl && canonicalUrl.protocol !== 'https:') fail(`canonical "${canonical}" is not https`);
  if (canonical !== url) fail(`canonical "${canonical}" is not the page's own URL ${url}`);

  const ogTitle = head.meta['og:title'] ?? [];
  if (ogTitle.length !== 1 || ogTitle[0] !== title) {
    fail(`og:title ${JSON.stringify(ogTitle)} doesn't equal the <title> "${title}"`);
  }
  const siteName = head.meta['og:site_name'] ?? [];
  if (siteName.length !== 1 || siteName[0] !== SITE_NAME) {
    fail(`og:site_name ${JSON.stringify(siteName)}, expected "${SITE_NAME}"`);
  }

  // JSON-LD: every block parses; top-level nodes and @graph members are the page's entities.
  const nodes = [];
  head.jsonLd.forEach((text, index) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      fail(`JSON-LD block ${index + 1} doesn't parse: ${error.message}`);
      return;
    }
    for (const item of [data].flat()) {
      nodes.push(...(Array.isArray(item?.['@graph']) ? item['@graph'] : [item]));
    }
  });
  report.nodes = nodes.map((node) => types(node).join('/') || '(untyped)');

  const websites = nodes.filter((node) => types(node).includes('WebSite'));
  if (page === HOME) {
    if (websites.length !== 1) fail(`${websites.length} WebSite nodes, expected exactly 1`);
    for (const site of websites) {
      if (site.name !== SITE_NAME) fail(`WebSite name "${site.name}", expected "${SITE_NAME}"`);
      if (site.url !== canonical) fail(`WebSite url "${site.url}" doesn't equal the canonical "${canonical}"`);
    }
    const organizations = nodes.filter(
      (node) => types(node).includes('Organization') && node['@id'] === ORGANIZATION_ID,
    );
    if (organizations.length !== 1) {
      fail(`${organizations.length} Organization nodes with @id ${ORGANIZATION_ID}, expected exactly 1`);
    }
    if (!title.startsWith(SITE_NAME)) fail(`<title> "${title}" doesn't start with the site name "${SITE_NAME}"`);
  } else if (websites.length > 0) {
    fail(`${websites.length} WebSite node(s); only the home page states the site name`);
  }
  reports.push(report);
}

// Report.
console.log('SEO check: %s\n', DIST);
for (const r of reports) {
  console.log(r.page);
  console.log(`  Title:       ${r.title} (${length(r.title)} characters)`);
  console.log(`  Description: ${r.description} (${length(r.description)} characters)`);
  console.log(`  Canonical:   ${r.canonical}`);
  console.log(`  JSON-LD:     ${r.nodes.join(', ') || 'none'}`);
}

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`\n✓ Titles, descriptions, canonicals and Open Graph names in place; one WebSite node ("${SITE_NAME}") on the home page.`);
