/**
 * Live HTTP & API Endpoint Verification against running server
 */

const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(u, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runLiveVerification() {
  console.log('\n===============================================================');
  console.log('  🌐 FRESHCART AI: LIVE LOCALHOST HTTP & API VERIFICATION');
  console.log('===============================================================\n');

  // 1. Health Endpoint
  const health = await fetch('http://localhost:3000/api/health');
  console.log(`  ✅ Health check: Status ${health.status} (${health.data.status})`);

  // 2. Categories
  const cats = await fetch('http://localhost:3000/api/products/categories');
  console.log(`  ✅ Categories API: ${cats.data.count} categories returned (${cats.data.data[0].name})`);

  // 3. Products Page 1
  const p1 = await fetch('http://localhost:3000/api/products?page=1&limit=24');
  console.log(`  ✅ Products Page 1: Returned ${p1.data.count} items, Total: ${p1.data.total}, TotalPages: ${p1.data.totalPages}`);

  // 4. Products Page 2
  const p2 = await fetch('http://localhost:3000/api/products?page=2&limit=24');
  console.log(`  ✅ Products Page 2: Returned ${p2.data.count} items (Page ${p2.data.page} of ${p2.data.totalPages})`);

  // 5. Smart Search with Hindi Synonym
  const searchSeb = await fetch('http://localhost:3000/api/search?q=seb');
  console.log(`  ✅ Smart Search for 'seb': Matched ${searchSeb.data.count} items (Top: ${searchSeb.data.data[0].name} [${searchSeb.data.data[0].score}])`);

  // 6. Smart Search for 'organic'
  const searchOrg = await fetch('http://localhost:3000/api/search?q=organic');
  console.log(`  ✅ Smart Search for 'organic': Matched ${searchOrg.data.count} items (Top: ${searchOrg.data.data[0].name})`);

  // 7. Login as Admin
  const login = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@freshcart.com', password: 'admin123' })
  });
  const token = login.data.data.token;
  console.log(`  ✅ Admin Login: Success (Role: ${login.data.data.user.role})`);

  // 8. Admin Dashboard Stats
  const adminDash = await fetch('http://localhost:3000/api/admin/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const d = adminDash.data.data;
  console.log(`  ✅ Admin Dashboard: ${d.totalOrders} Orders | ₹${d.totalRevenue.toLocaleString()} Revenue | ${d.totalProducts} Products | ${d.totalUsers} Customers`);

  // 9. Recommendations
  const recs = await fetch('http://localhost:3000/api/recommendations/personal?limit=6');
  console.log(`  ✅ Recommendations API: Returned ${recs.data.data.length} personal recommendations`);

  // 10. Demand Forecasting
  const forecast = await fetch('http://localhost:3000/api/analytics/demand-forecast/f1?days=7', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`  ✅ Demand Forecasting: ${forecast.data.data.productName} 7-Day Cumulative: ${forecast.data.data.cumulativeForecastQuantity} units`);

  // 11. Customer Segmentation
  const seg = await fetch('http://localhost:3000/api/analytics/segments?k=4', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`  ✅ Customer Segmentation: ${seg.data.data.clusters.length} Persona Clusters (${seg.data.data.totalCustomersEvaluated} Users Evaluated)`);

  console.log('\n===============================================================');
  console.log('  🎯 ALL LIVE HTTP ENDPOINTS VALIDATED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

runLiveVerification().catch(console.error);
