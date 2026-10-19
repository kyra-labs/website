# CLAUDE.md — website (kyralabs.dev)

Standing instructions for Claude Code sessions in this repo. Owner: Mohammed Thalha (YamTee), Kyra Labs.

## What this is

The Kyra Labs studio site: a static **Astro** site (`src/pages/index.astro`, `src/pages/privacy.astro` → `dist/index.html`, `dist/privacy.html`). It's built on the Kyra Labs Material 3 Expressive library **@kyralabs/m3exp-web 1.7** (`@kyralabs/m3e-tokens`, `m3e-css`, `m3e-react`, `m3e-elements`, `^1.7.0` from npm). Library repo: kyra-labs/m3exp-web; this site is its ROADMAP **M4** "org site". The library's `DECISIONS.md` and `CLAUDE.md` define the design rules.

## Commands

pnpm 12.11.2 (`packageManager`), Node ≥ 22.12; `.nvmrc` is pinned to **24.21.0** (2026-10-15: on Node 24.22.0, Cloudflare Workers Builds' Corepack setup of pnpm 12 fails with "Cannot find module …/corepack/v1/pnpm/12.11.2/bin/pnpm.cjs" before install; 24.21.0 is the last version that built. Only bump it after a Workers build passes on the new version).

- `pnpm dev`, `pnpm build` → `dist/`. Both run `pnpm gen` first: the theme from `src/brand.mjs` and the icon subset from `src/icons.txt`, into `src/styles/generated/` (git-ignored).
- `pnpm lint:css` (stylelint, tokens only), `pnpm typecheck` (astro check), `pnpm check:js` (client-JS allowlist on `dist/`), `pnpm check:no-js` (every page with JavaScript off: all text visible; saves screenshots), `pnpm lighthouse` (accessibility and SEO must be 100, mobile + desktop; performance warns below 85).

## Rules (owner's brief; the JS rule was updated on 2026-10-15)

- **Client JS: enhancement only.** Two `client:only="react"` islands (the navigation bar, `src/islands/SectionNav.tsx`; the waitlist form, `src/islands/WaitlistForm.tsx`: the m3e-css outlined text field, the LoadingIndicator and a snackbar whose `@kyralabs/m3e-elements/snackbar-host.js` is imported on the first submit, never at load) plus one small deferred module, `src/scripts/enhance.ts` (the m3e press ripple + `html.js`), imported from `Base.astro`. All content, headings, links, meta and structured data stay in the server-rendered HTML; JS never creates or loads content; nothing render-blocking in `<head>`. Prefer CSS (scroll-driven animations) when it can do the job. `scripts/check-client-js.mjs` enforces the allowlist (islands, Astro runtime, one enhancement module ≤ 4 KB gzip, never in `<head>`) and fails on anything else.
- **Never hide content waiting for JS.** Any "hidden before animation" state is gated behind `html.js` (set by `enhance.ts`); the load entrance is transform-only so nothing is ever hidden. `pnpm check:no-js` proves the page is complete with JavaScript off. Animate transform/opacity only (no layout shift), use the `--m3e-sys-motion-*` spring tokens, and respect `prefers-reduced-motion`.
- **Layout: Google-app pane hierarchy.** App bar, navigation and footer on `surface`; each section is a pane (`.section-shell` / `.pane`) on `surface-container-low` with `--m3e-sys-shape-corner-extra-large(-increased)` corners; cards inside panes step up to `surface-container-high`. Section titles use the headline typescale; display is for the hero (and the closing line).
- **Tokens only**: no hard-coded colours, sizes, durations, easings or radii in `src/styles/site.css`, only `var(--m3e-…)`. stylelint enforces it with the library's own plugin (`tools/lint/`). The only literals allowed are the M3 window-size-class breakpoints in media queries and `vw` page margins.
- **Keep exactly**: all copy, section order, URLs/anchors (`/privacy.html` stays `.html`), privacy text, SEO meta, canonical, JSON-LD, og-image, robots, sitemap, favicons/manifest, and the Antecedent and Kyra logos. Any deliberate change gets called out in the PR.
- **Theme**: Kyra red `#d84848`, `fidelity`, with core colours neutral + neutralVariant `#808080` (grey surfaces, text and outlines) and tertiary `#c8862a` (amber), light + dark by `prefers-color-scheme` (`src/brand.mjs`, palette C chosen by the owner on 2026-10-15). With `fidelity`, `neutralVariant` must be set too or secondary text and outlines stay red-tinted. Don't use tertiary-container for decorative badges. **Font**: Google Sans Flex from m3e-tokens. **Icons**: Material Symbols Rounded via `src/icons.txt`.
- **Don't change the library from here.** Write up library bugs for the owner instead of working around them silently.
- **Hosting**: Netlify serves the domain (behind Cloudflare's proxy). `netlify.toml` sets `pnpm build` / `dist`, and without it a merge publishes the repo root and the site 404s (that happened on 2026-10-13). The planned move is to Cloudflare Workers static assets: `wrangler.jsonc` (Worker `kyra-labs-website`, `html_handling: "none"` so `/privacy.html` isn't redirected, `previews: {}`) + `public/_redirects` (`/` → `index.html`). Keep both working.
- **Workflow**: branch → draft PR → CI green → tick "CI green", mark ready, post a self-review comment. The owner merges, never Claude. Commits end with `Co-Authored-By: Claude …`. `gh` needs `export PATH="$PATH:/c/Program Files/GitHub CLI"`. Never touch `.hallmark/` or `.agents/`.

## Decisions (2026-10-13, owner's answers)

- Client JS: "CEO friendly, do whatever is best" → zero JS outside the islands.
- Waitlist: "you choose" → kept the old fake submit as the LoadingIndicator island (since 1.7: library text field, result in a snackbar). ⚠️ **It stores nothing**; privacy.html says emails are collected. Wire a real endpoint into `WaitlistForm.tsx` when there is one.
- Font: Google Sans Flex. Mobile navigation: the `ShortNavigationBar` island.
- Hosting: Netlify now, Cloudflare later.

## History

- #3 (merged): Astro rebuild on @kyralabs. Lighthouse accessibility went from 95–100 to 100.
- #4 (merged): `netlify.toml` (fixed the post-merge 404), `wrangler.jsonc` + `public/_redirects`, and Cloudflare's `previews` block.
- 2026-10-15, "look like Google's apps": @kyralabs 1.1.0 (visible hover/focus layers on React components, core colours), palette C, press ripple on plain-HTML components, pane layout, headline section titles, load entrance + scroll reveals + card hover lift, JS rule relaxed to "enhancement only" with `check:no-js` and SEO 100 in CI. The same change went to Spenzia, the portfolio and Antecedent.
- 2026-10-19, @kyralabs 1.7.0: the waitlist email is the m3e-css outlined text field (1.6; it replaced the field hand-built from tokens) with supporting and error text, and the result shows in a snackbar (1.7) above the navigation bar. The text field is plain m3e-css markup (label float, notch and colours are CSS only), not m3e-react `<TextField>`, and the snackbar host is lazy-loaded: both islands share one m3e-react chunk, so `<TextField>` + `<SnackbarHost>` would have added ~11 KB gzip to every page's navigation bar. The required field shows the library's "*" after its label. Roundness (fonts-rond.css) is not used: no ROND token exists and `font-variation-settings` takes tokens only.
- Sister projects converted the same way: spenzia.kyralabs.dev (kyra-labs/spenzia-website), yamtee.dev (YamTee/portfolio), and the Antecedent app (kyra-labs/antecedent-web-app, React).

## Known gaps / follow-ups

- Mobile performance (simulated) ~86–91 because of the React runtime for the islands (~92 KB gzip on 1.1); observed LCP is ~0.3 s. A long or slow load entrance pushes observed LCP/Speed Index up (655 ms + stagger did: ~1.3–2.3 s), so keep it short.
- Library findings reported in #3: per-component m3e-css imports miss `focus-ring.css`/`state-layer.css`; the m3e-tokens README uses a non-existent typescale shorthand; `m3e-theme --out` doesn't create directories; nav items always use `aria-current="page"`. 1.5 added window-size tokens (`--m3e-sys-window-*`), but media queries still need the px values.
- No ROND token for fonts-rond.css (the roundness axis can only be set with a literal, which the tokens-only lint rejects).
- `REDESIGN-NOTES.md` describes the pre-Astro hand-written site and is out of date.
