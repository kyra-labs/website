// Lighthouse CI: accessibility must be 100 on every built page (ROADMAP M4 DoD). Other
// categories are recorded, not asserted. Run twice: mobile (default) and desktop preset.
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
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci/reports' },
  },
};
