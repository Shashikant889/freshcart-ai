const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- Testing Quick-Commerce API & Pagination ---');

  // Test 1: Page 1 of catalog
  const p1 = await fetch('http://localhost:3000/api/products?page=1&limit=24');
  console.log(`Page 1: total = ${p1.data.total}, totalPages = ${p1.data.totalPages}, items = ${p1.data.data.length}`);
  if (p1.data.total !== 10000 || p1.data.totalPages !== 417) {
    throw new Error('Expected 10,000 products and 417 total pages');
  }

  // Test 2: Page 40 of catalog
  const p40 = await fetch('http://localhost:3000/api/products?page=40&limit=24');
  console.log(`Page 40: page = ${p40.data.page}, items = ${p40.data.data.length}`);
  const firstId = p40.data.data[0].id;
  const startItem = (40 - 1) * 24 + 1;
  const endItem = 40 * 24;
  console.log(`Range for page 40: ${startItem} - ${endItem} (First item ID: ${firstId})`);
  if (p40.data.data.length !== 24) {
    throw new Error('Expected 24 products on page 40');
  }

  // Test 3: Categories count
  const cats = await fetch('http://localhost:3000/api/products/categories');
  const catCount = cats.data.categories ? cats.data.categories.length : cats.data.length;
  console.log(`Categories count = ${catCount}`);
  if (catCount < 100) {
    throw new Error(`Expected at least 100 categories, got ${catCount}`);
  }

  // Test 4: Search suggestions
  const sug = await fetch('http://localhost:3000/api/search/suggestions?q=mil&limit=6');
  console.log(`Search suggestions for "mil" = ${sug.data.data.length} results`);

  console.log('✅ ALL API & PAGINATION TESTS PASSED!');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
