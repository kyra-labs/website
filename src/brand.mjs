// The one place the brand colour lives. scripts/gen-theme.mjs turns it into the M3 colour scheme
// (equivalent CLI: m3e-theme --seed "#d84848" --variant fidelity --neutral "#808080"
// --neutral-variant "#808080" --tertiary "#c8862a").
//
// Palette C, chosen by the owner on 2026-10-15 (options compared in kyra-labs/website PR):
// - fidelity keeps primary / primary-container on Kyra red;
// - grey neutral + neutral-variant give Google-style neutral surfaces, text and outlines (with
//   fidelity, neutralVariant matters: without it on-surface-variant and outlines stay red-tinted);
// - amber tertiary replaces the seed-derived teal, warm next to the red.
/**
 * @type {{
 *   seed: string;
 *   variant: import('@kyralabs/m3e-tokens/theme').Variant;
 *   coreColors: import('@kyralabs/m3e-tokens/theme').CoreColors;
 * }}
 */
export const brand = {
  seed: '#d84848',
  variant: 'fidelity',
  coreColors: { neutral: '#808080', neutralVariant: '#808080', tertiary: '#c8862a' },
};
