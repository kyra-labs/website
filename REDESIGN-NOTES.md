# Redesign notes — visual & motion pass (Claude Fable run)

Run against `requirements.md` (kyralabs.dev — Visual & Motion Redesign Requirements).
Content, section order, copy, meta/SEO: untouched. All changes are visual/motion.
No dependencies added — everything is hand-written CSS + ~120 lines of vanilla JS.

## The signature element

**The wordmark's dot-scatter, sprinkling down into place in the hero.**

The constellation above the "y" is the only part of the Kyra Labs mark that is
genuinely ownable, so the entire "bold" animation budget went there and nowhere
else:

- The hero motif was rebuilt as an inline SVG whose ten dots mirror the logo's
  scatter (varying radii 4–11, varying opacity).
- On page load each dot **falls from above, overshoots ~3px, and settles** —
  staggered so the heaviest dots land first and the small trailing dots last,
  which reads as "sprinkled" rather than "faded in". The whole sequence
  resolves in ~1.1s, overlapping the hero text entrance.
- At rest, each dot **drifts/breathes on its own slow cycle** (5–7.2s,
  per-dot durations set as CSS custom properties) so the cluster never moves
  in lockstep. Transform-only, no repaint cost.
- The motif then echoes quietly through the page instead of being repeated
  loudly: every section eyebrow carries a single red dot, and the three
  full stops in the hero headline ("Real problems. Real apps. One developer.")
  are set in Kyra Red — typography borrowing the dot.

Everything else on the page shares **one** reveal language (rise 20px + fade,
`cubic-bezier(0.22, 1, 0.36, 1)`, 0.7s, children staggered ~70ms) and **one**
hover language (underline-draw for links, lift + colour-deepen for buttons).

## Other motion, per spec

- **Hero entrance:** eyebrow → headline line 1 → line 2 → subhead → CTAs,
  staggered 80ms apart, finished in ~0.9s.
- **Spenzia mock:** phone rises with the section, then the screen contents
  land in sequence (balance → chip → three transaction rows, 90ms apart);
  a new SVG **budget ring sweeps to 62%** (pure CSS `stroke-dashoffset`
  transition, aria-hidden, duplicate of the preserved chip text rather than
  new copy); **₹18,240 and 62 count up** on scroll-into-view in JetBrains
  Mono with tabular figures (rAF, ease-out cubic, `en-IN` formatting).
- **Waitlist:** red focus ring on the input; on valid submit the form does a
  quiet scale pop and the status message rises in.
- **Nav:** light glass bar (blur + saturate), hairline + shadow appear only
  once scrolled; links use the underline-draw hover.
- **Ambient (light touch):** static radial red wash behind the hero (7%
  alpha) and a data-URI grain at 5% opacity on the dark tiles only. Nothing
  animates ambiently except the signature dots.

## Accessibility & performance

- Every entrance/idle animation lives inside
  `@media (prefers-reduced-motion: no-preference)`; the unqualified styles
  *are* the final resting state, so reduced-motion users get the complete
  static page (no 0.001ms-duration hacks, no infinite loops spinning).
- Scroll-reveal hidden states are additionally gated behind an `html.js`
  class set inline in `<head>` — with JS disabled nothing is ever hidden,
  and the count-up numbers ship in the HTML as their final values.
- Transform/opacity only; the ring animates `stroke-dashoffset` (paint-only,
  46px element). No scroll-jacking, no parallax, no libraries.
- Visible `:focus-visible` states everywhere, including on-dark variants.

## Deviations from spec (for fair model comparison)

1. **Typeface:** the spec names *Google Sans Flex*; the repo ships
   `GoogleSansRounded.woff2` (variable 300–700) and no Flex file exists in
   the project. Kept the shipped font rather than sourcing a new file.
2. **Logo reference files:** `kyra_labs_transparent.png` / `kyra_labs_dp.png`
   aren't in the repo; dot proportions were sampled from the shipped
   `assets/img/kyra-wordmark.png` instead.
3. **Nav bar** went from solid black to light glass. The spec fixes the
   light-background/red-accent identity but doesn't specify the nav; this was
   a judgment call to lean into that identity. Easy to revert (one block in
   `style.css`).
4. **Budget ring:** the spec suggests "the budget percentage ring animating
   in" but the live site had no ring. One was added as a decorative,
   aria-hidden visualisation of the existing "62% of budget used" chip —
   arguably a (sanctioned) addition rather than pure restyle.
5. The JetBrains Mono Google-Fonts link still loads weight 500 (unused, per
   the 400→600 convention) — left untouched since `<head>`/meta changes are
   out of scope.
