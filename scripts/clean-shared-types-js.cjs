/**
 * Removes stray CommonJS *.js emitted next to *.ts under src/shared-types.
 * If left in place, Vite resolves panelJobKinds.js before .ts and ESM named imports break in the browser.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'shared-types');
if (!fs.existsSync(dir)) process.exit(0);
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.js')) continue;
  const full = path.join(dir, name);
  try {
    fs.unlinkSync(full);
    console.log(`[ss-toolkit prebuild] removed stale ${path.relative(path.join(__dirname, '..'), full)}`);
  } catch {
    /* ignore */
  }
}
