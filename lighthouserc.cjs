// Lighthouse CI: accessibility and SEO must be 100 on every built page; performance warns below
// 85. Run twice: mobile (default) and desktop preset.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/index.html', 'http://localhost/privacy.html'],
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        // CI machines vary; the PR compares performance against the baseline. Warn on big drops.
        'categories:performance': ['warn', { minScore: 0.85 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci/reports' },
  },
};
