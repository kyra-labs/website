import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// Static site. React renders only the navigation and waitlist (LoadingIndicator) islands, both
// client:only (m3exp-web D6: client-side rendering only). Everything else is HTML + m3e-css.
export default defineConfig({
  site: 'https://kyralabs.dev',
  output: 'static',
  outDir: 'dist',
  // privacy.astro → /privacy.html, keeping the existing URLs, canonical links and sitemap.
  build: { format: 'file', inlineStylesheets: 'never' },
  trailingSlash: 'ignore',
  integrations: [react()],
});
