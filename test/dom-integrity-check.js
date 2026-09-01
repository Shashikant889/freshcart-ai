const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Find all $('#...') in app.js
const idMatches = [...appJs.matchAll(/\$\(['"]#([a-zA-Z0-9_-]+)['"]\)/g)].map(m => m[1]);
const uniqueIds = [...new Set(idMatches)];

console.log(`Total unique IDs queried in app.js: ${uniqueIds.length}`);

const missing = [];
for (const id of uniqueIds) {
  const hasId = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  if (!hasId) {
    missing.push(id);
  }
}

console.log(`Missing IDs in public/index.html (${missing.length}):`, missing);
