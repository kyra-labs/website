// Prints the category scores from Lighthouse CI's filesystem reports (manifest.json per run dir).
import { existsSync, readFileSync } from 'node:fs';

const dirs = process.argv.slice(2);
console.log('| Page | Preset | Performance | Accessibility | Best practices | SEO |');
console.log('|---|---|---|---|---|---|');
for (const dir of dirs) {
  const manifestPath = `${dir}/manifest.json`;
  if (!existsSync(manifestPath)) continue;
  for (const run of JSON.parse(readFileSync(manifestPath, 'utf8'))) {
    const lhr = JSON.parse(readFileSync(run.jsonPath, 'utf8'));
    const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
    const page = new URL(run.url).pathname;
    const preset = lhr.configSettings.formFactor;
    console.log(`| ${page} | ${preset} | ${score('performance')} | ${score('accessibility')} | ${score('best-practices')} | ${score('seo')} |`);
  }
}
