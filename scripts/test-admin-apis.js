const http = require('http');

async function testAdminApis() {
  const loginData = await makeReq('/api/auth/login', 'POST', {
    email: 'admin@freshcart.com',
    password: 'admin123'
  });

  console.log('Login status:', loginData.status, 'Role:', loginData.body?.data?.user?.role);
  const token = loginData.body?.data?.token;

  const endpoints = [
    '/api/admin/dashboard',
    '/api/analytics/sales-trends?days=30',
    '/api/analytics/category-revenue',
    '/api/analytics/segments?k=4',
    '/api/analytics/stock-alerts',
    '/api/supplier/inventory-turnover',
    '/api/supplier/abc-analysis',
    '/api/dispatch/route',
    '/api/picker/route',
    '/api/analytics/ml-metrics'
  ];

  for (const ep of endpoints) {
    const res = await makeReq(ep, 'GET', null, token);
    console.log(`Endpoint: ${ep} -> Status: ${res.status}, Success: ${res.body?.success !== false}, DataKeys: ${res.body?.data ? Object.keys(res.body.data) : (Array.isArray(res.body) ? 'array:' + res.body.length : 'null')}`);
    if (res.status !== 200) {
      console.log('  Error Body:', JSON.stringify(res.body));
    }
  }
}

function makeReq(path, method, body, token) {
  return new Promise((resolve) => {
    const dataStr = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(dataStr) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, body: b });
        }
      });
    });
    if (body) req.write(dataStr);
    req.end();
  });
}

testAdminApis();
