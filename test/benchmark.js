/**
 * FreshCart AI — Real-Time Empirical Latency Benchmarking Harness
 * Measures Node.js Express endpoints and Python FastAPI AI microservice latency.
 */

const { startTestServer } = require('./test-helper');
const { generateToken } = require('../middleware/auth');
const http = require('http');

function measurePythonEndpoint(path, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const dataStr = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataStr ? { 'Content-Length': Buffer.byteLength(dataStr) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        resolve({ durationMs, status: res.statusCode });
      });
    });
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

function computeStats(samples) {
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((acc, v) => acc + v, 0);
  const avg = sum / samples.length;
  const median = samples[Math.floor(samples.length / 2)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const min = samples[0];
  const max = samples[samples.length - 1];
  return {
    avg: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    samples: samples.length
  };
}

async function runBenchmark() {
  console.log('\n===============================================================');
  console.log('  ⚡ FRESHCART AI: EMPIRICAL PERFORMANCE & LATENCY BENCHMARK');
  console.log('===============================================================\n');

  const harness = await startTestServer();
  const adminToken = generateToken({ id: 999, email: 'admin@freshcart.com', role: 'admin' });
  const authHeader = { Authorization: `Bearer ${adminToken}` };

  const results = {
    nodeEndpoints: {},
    pythonEndpoints: {}
  };

  const ITERATIONS = 20;

  // 1. Node.js Application Endpoints
  console.log('📊 Benchmarking Node.js Express Application Endpoints...');

  const nodeEndpoints = [
    { name: 'GET /api/products', fn: () => harness.request('GET', '/api/products') },
    { name: 'GET /api/recommendations/personal', fn: () => harness.request('GET', '/api/recommendations/personal?userId=2&limit=6') },
    { name: 'GET /api/analytics/demand-forecast/:id', fn: () => harness.request('GET', '/api/analytics/demand-forecast/f1?days=7', authHeader) },
    { name: 'GET /api/pricing/simulate/:id', fn: () => harness.request('GET', '/api/pricing/simulate/f1?price=140') },
    { name: 'GET /api/supplier/reorder-alerts', fn: () => harness.request('GET', '/api/supplier/reorder-alerts', authHeader) },
    { name: 'POST /api/supplier/warehouse-picker-route', fn: () => harness.request('POST', '/api/supplier/warehouse-picker-route', authHeader, { productIds: ['f1', 'v2', 'd1', 'b1', 's2'] }) },
    { name: 'GET /api/dispatch/optimize', fn: () => harness.request('GET', '/api/dispatch/optimize?batchSize=8') }
  ];

  for (const ep of nodeEndpoints) {
    // Warmup
    await ep.fn();
    const latencies = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = process.hrtime.bigint();
      await ep.fn();
      const end = process.hrtime.bigint();
      latencies.push(Number(end - start) / 1e6);
    }
    const stats = computeStats(latencies);
    results.nodeEndpoints[ep.name] = stats;
    console.log(`  🔹 ${ep.name.padEnd(46)}: Avg = ${stats.avg}ms | Med = ${stats.median}ms | p95 = ${stats.p95}ms | Max = ${stats.max}ms`);
  }

  // 2. Python FastAPI Microservice Endpoints
  console.log('\n🐍 Benchmarking Python FastAPI Inference Endpoints (Port 8000)...');

  const pyEndpoints = [
    { name: 'GET /health', path: '/health', method: 'GET', body: null },
    { name: 'POST /predict/recommendations', path: '/predict/recommendations', method: 'POST', body: { user_id: 1, top_k: 5 } },
    { name: 'POST /predict/demand', path: '/predict/demand', method: 'POST', body: { product_id: 'f1', horizon_days: 7 } },
    { name: 'POST /predict/price', path: '/predict/price', method: 'POST', body: { product_id: 'f1', category: 'Fruits', base_price: 120.0 } },
    { name: 'POST /predict/fraud', path: '/predict/fraud', method: 'POST', body: { total: 4500.0, total_items: 5, unique_skus: 3, max_item_quantity: 2 } },
    { name: 'POST /optimize/inventory', path: '/optimize/inventory', method: 'POST', body: { sku_id: 'f1', unit_price: 120.0, avg_daily_demand: 8.5 } },
    { name: 'POST /optimize/warehouse', path: '/optimize/warehouse', method: 'POST', body: { product_ids: ['f1', 'v2', 'd1', 'b1', 's2'] } },
    { name: 'POST /optimize/delivery', path: '/optimize/delivery', method: 'POST', body: { vehicle_capacity_kg: 25.0, orders: [{ id: 'O1', lat: 19.08, lng: 72.88, demand: 3.0 }, { id: 'O2', lat: 19.09, lng: 72.89, demand: 4.0 }] } }
  ];

  for (const ep of pyEndpoints) {
    try {
      // Warmup
      await measurePythonEndpoint(ep.path, ep.method, ep.body);
      const latencies = [];
      for (let i = 0; i < ITERATIONS; i++) {
        const res = await measurePythonEndpoint(ep.path, ep.method, ep.body);
        latencies.push(res.durationMs);
      }
      const stats = computeStats(latencies);
      results.pythonEndpoints[ep.name] = stats;
      console.log(`  🔹 ${ep.name.padEnd(46)}: Avg = ${stats.avg}ms | Med = ${stats.median}ms | p95 = ${stats.p95}ms | Max = ${stats.max}ms`);
    } catch (err) {
      console.warn(`  ⚠️ Python service not reachable for ${ep.name}: ${err.message}`);
    }
  }

  await harness.close();
  console.log('\n===============================================================');
  console.log('  🎯 BENCHMARK COMPLETE — DATA READY FOR PERFORMANCE REPORT');
  console.log('===============================================================\n');

  return results;
}

if (require.main === module) {
  runBenchmark().then(res => {
    const fs = require('fs');
    fs.writeFileSync('test/benchmark-results.json', JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runBenchmark };
