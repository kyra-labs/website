// Tokens only (ROADMAP M4: no hard-coded colours, sizes, durations or radii in the site's CSS).
// Same rules as kyra-labs/m3exp-web's component CSS; generated theme/icon CSS is exempt.
const LENGTH_AND_TIME_UNITS = [
  'px', 'rem', 'em', 'ex', 'ch', 'cap', 'ic', 'lh', 'rlh', 'pt', 'pc', 'cm', 'mm', 'q', 'in', 's', 'ms',
];
// Media queries can't read custom properties, so window size class breakpoints stay literal.
const MEDIA_SIZE_FEATURES = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['./tools/lint/stylelint-plugin-m3e.js'],
  ignoreFiles: ['**/node_modules/**', 'dist/**', '.astro/**', 'src/styles/generated/**'],
  rules: {
    'import-notation': 'string',
    // Unrelated selectors (e.g. .fact-list span vs .maker-mark > span) trip it; layers order the cascade.
    'no-descending-specificity': null,
    // Site classes must not look like library API (.m3e-*): style components through own classes.
    'selector-class-pattern': [
      '^(?!m3e-)[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Use .<block>[__<part>][--<modifier>]; .m3e-* belongs to the library.' },
    ],
    'custom-property-pattern': [
      '^(m3e-(ref|sys|comp)-[a-z0-9-]+|_[a-z0-9-]+)$',
      { message: 'Site custom properties are private --_… (or a --m3e-comp-… override).' },
    ],
    'keyframes-name-pattern': '^site-[a-z0-9-]+$',
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'cubic-bezier', 'steps', 'linear'],
      { message: 'Colours and easings come from m3e tokens.' },
    ],
    'unit-disallowed-list': [
      LENGTH_AND_TIME_UNITS,
      {
        ignoreMediaFeatureNames: Object.fromEntries(
          LENGTH_AND_TIME_UNITS.map((unit) => [unit, MEDIA_SIZE_FEATURES]),
        ),
        message: 'Sizes and durations come from m3e tokens.',
      },
    ],
    'm3e/no-literal-values': true,
  },
};
