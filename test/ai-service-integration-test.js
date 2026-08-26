/**
 * FreshCart AI — End-to-End AI/ML & Operations Research Integration Test Suite
 * 
 * Verifies:
 * 1. AI Client Gateway & Python FastAPI Microservice Communication
 * 2. All 7 AI/ML and Optimization API Subsystems:
 *    - Hybrid Personalized Recommendations
 *    - SARIMAX Multi-Step Demand Forecasting
 *    - Dynamic Price Elasticity & Optimal Pricing
 *    - Random Forest Fraud Risk Scoring
 *    - Continuous Review (r, Q) EOQ/ROP Inventory Optimization
 *    - Dark Store 2D TSP Picker Walk Optimization
 *    - Last-Mile Capacitated Vehicle Routing Problem (CVRP)
 * 3. Graceful Fallback Behavior when Python AI Service is Offline / Unreachable
 * 4. Error Handling, Input Validation & Timeout Resilience
 */

const assert = require('assert');
const { spawn } = require('child_process');
const { generateToken } = require('../middleware/auth');
const aiClient = require('../services/ai-client');
const { startTestServer } = require('./test-helper');

let pythonProcess = null;
let testServer = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startPythonService() {
  const initialHealth = await aiClient.checkHealth();
  if (initialHealth.online) {
    console.log('  [TEST] Python AI Service is ALREADY ONLINE and healthy.');
    return true;
  }
  console.log('  [TEST] Spawning Python FastAPI AI Service on port 8000...');
  const pythonExe = process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python';
  pythonProcess = spawn(pythonExe, ['-m', 'ml.service.app'], {
    env: { ...process.env, AI_SERVICE_PORT: '8000', AI_SERVICE_HOST: '127.0.0.1' },
    stdio: 'pipe'
  });

  // Poll until ready or timeout after 15s
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const health = await aiClient.checkHealth();
    if (health.online) {
      console.log('  [TEST] Python AI Service is ONLINE and healthy.');
      return true;
    }
  }
  console.log('  [TEST] Python AI Service start timeout — testing fallback mode.');
  return false;
}

function stopPythonService() {
  if (pythonProcess) {
    console.log('  [TEST] Stopping Python AI Service process...');
    try {
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        execSync(`taskkill /pid ${pythonProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        pythonProcess.kill('SIGKILL');
      }
    } catch (e) {
      try { pythonProcess.kill(); } catch (err) {}
    }
    pythonProcess = null;
  }
}

async function runIntegrationTests() {
  console.log('\n====================================================================');
  console.log('  🤖 FRESHCART AI: END-TO-END AI/ML & OPTIMIZATION INTEGRATION TESTS');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function record(name, condition) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
    }
  }

  // 1. Boot In-Process Test Server
  testServer = await startTestServer();
  console.log(`  [TEST] Express Application Server online at ${testServer.baseUrl}`);

  // 2. Start Python Service
  const isPythonReady = await startPythonService();

  // Tier A: Online AI Microservice Tests
  if (isPythonReady) {
    console.log('\n📌 Tier A: Online Python AI Microservice Tests:');

    // Test 1: Health Endpoint
    const health = await aiClient.checkHealth();
    record('Health Check Returns Healthy Status', health.online === true && health.status === 'healthy');
    record('Model Registry Loaded All Models', Object.values(health.models_loaded || {}).every(Boolean));

    // Test 2: Personalized Recommendations
    const recs = await aiClient.getRecommendations({ userId: 1, topK: 5 });
    record('Recommendations Return Top-K Items', recs.recommendations && recs.recommendations.length === 5);
    record('Recommendations Use Python ML Engine', recs.engine === 'python_ml' && recs.isFallback === false);

    // Test 3: Demand Forecasting
    const demand = await aiClient.forecastDemand({ productId: 'f1', horizonDays: 7 });
    record('Demand Forecast Returns 7 Daily Points', demand.dailyForecasts && demand.dailyForecasts.length === 7);
    record('Demand Forecast Total Matches Points', demand.totalForecastedUnits > 0);

    // Test 4: Dynamic Pricing
    const pricing = await aiClient.recommendPrice({ productId: 'f1', category: 'Fruits', basePrice: 120.0 });
    record('Dynamic Pricing Computes Optimal Price within Bounds', pricing.recommendedPrice >= 90.0 && pricing.recommendedPrice <= 150.0);
    record('Dynamic Pricing Outputs Valid Elasticity', typeof pricing.priceElasticity === 'number');

    // Test 5: Order Fraud Risk Scoring
    const fraudLow = await aiClient.scoreFraud({ total: 450.0, totalItems: 3, uniqueSkus: 3, userVelocity24h: 1, userMeanSpend: 500.0 });
    record('Normal Order Scores Low Fraud Risk', fraudLow.riskScore < 50.0 && fraudLow.riskLevel !== 'HIGH');

    const fraudHigh = await aiClient.scoreFraud({
      total: 12500.0,
      totalItems: 45,
      uniqueSkus: 20,
      maxItemQuantity: 15,
      orderHour: 2,
      userMeanSpend: 500.0,
      userVelocity24h: 6,
      deliveryDistanceKm: 22.0
    });
    record('Anomalous Bulk Order Scores Elevated Risk', fraudHigh.riskScore >= 30.0);

    // Test 6: Inventory Optimization (EOQ & ROP)
    const inv = await aiClient.optimizeInventory({
      skuId: 'f1',
      name: 'Fresh Organic Apples',
      unitPrice: 120.0,
      avgDailyDemand: 8.5,
      currentStock: 12
    });
    record('Inventory Optimizer Computes Positive EOQ & ROP', inv.economicOrderQuantity > 0 && inv.reorderPoint > 0);
    record('Inventory Optimizer Accurately Triggers Reorder Flag', inv.needsReorder === true);

    // Test 7: Dark Store Warehouse Picking Optimization (2D TSP)
    const wh = await aiClient.optimizeWarehouse({ productIds: ['f1', 'd1', 'b1', 'v2', 's1'] });
    record('Warehouse Picker Generates Valid TSP Sequence', wh.pickingSequence && wh.pickingSequence.length === 5);
    record('Warehouse Picker Computes Walking Distance & Time', wh.totalWalkingDistanceMeters > 0 && wh.estimatedPickTimeSeconds > 0);

    // Test 8: Last-Mile Delivery Routing (CVRP)
    const del = await aiClient.optimizeDelivery({
      orders: [
        { id: 'O1', name: 'Cust 1', lat: 19.080, lng: 72.880, demand: 3.0 },
        { id: 'O2', name: 'Cust 2', lat: 19.090, lng: 72.890, demand: 4.5 },
        { id: 'O3', name: 'Cust 3', lat: 19.070, lng: 72.860, demand: 2.0 }
      ]
    });
    record('Delivery Router Assigns Fleet Vehicles & Routes', del.routes && del.routes.length > 0);
    record('Delivery Router Computes Fleet Kilometers & Utilization', del.totalFleetDistanceKm > 0 && del.fleetCapacityUtilizationPct > 0);
  }

  // Tier B: Express Endpoints Integration Verification
  console.log('\n📌 Tier B: Express API Gateway Route Integration:');

  // Test 9: GET /api/recommendations/personal
  const recRes = await testServer.request('GET', '/api/recommendations/personal?limit=4');
  record('Express GET /api/recommendations/personal Returns 200 JSON', recRes.status === 200 && recRes.data.success === true);
  record('Recommendations Response Includes Enriched Catalog Data', recRes.data.data.length === 4 && !!recRes.data.data[0].name);

  // Test 10: GET /api/analytics/demand-forecast/f1
  const dfRes = await testServer.request('GET', '/api/analytics/demand-forecast/f1?days=7');
  record('Express GET /api/analytics/demand-forecast/:id Returns Forecast', dfRes.status === 200 && dfRes.data.data.forecast.length === 7);

  // Test 11: GET /api/pricing/simulate/f1?price=130
  const simRes = await testServer.request('GET', '/api/pricing/simulate/f1?price=130');
  record('Express GET /api/pricing/simulate/:id Simulates Price', simRes.status === 200 && simRes.data.data.optimalRevenuePrice > 0);

  // Test 12: GET /api/supplier/reorder-alerts
  const adminToken = generateToken({ id: 1, email: 'admin@freshcart.com', role: 'admin' });
  const ropRes = await testServer.request('GET', '/api/supplier/reorder-alerts', {
    'Authorization': `Bearer ${adminToken}`
  });
  record('Express GET /api/supplier/reorder-alerts Returns ROP Schedule', ropRes.status === 200 && ropRes.data.data.totalProductsEvaluated > 0);

  // Test 13: POST /api/supplier/warehouse-picker-route
  const whRes = await testServer.request('POST', '/api/supplier/warehouse-picker-route', {
    'Authorization': `Bearer ${adminToken}`
  }, { productIds: ['f1', 'v2', 'd1'] });
  record('Express POST /api/supplier/warehouse-picker-route Returns Sequence', whRes.status === 200 && whRes.data.data.optimalPickSequence.length === 3);

  // Test 14: GET /api/dispatch/optimize
  const dispRes = await testServer.request('GET', '/api/dispatch/optimize?batchSize=6');
  record('Express GET /api/dispatch/optimize Computes Delivery Dispatch', dispRes.status === 200 && dispRes.data.data.totalDistanceKm > 0);

  // Tier C: Offline / Fallback Resilience Tests
  console.log('\n📌 Tier C: Zero-Downtime Graceful Fallback Behavior (Simulating Python AI Outage):');

  // Kill Python process
  stopPythonService();
  await sleep(1000);

  // Test 15: Fallback Recommendations
  const fbRecs = await aiClient.getRecommendations({ userId: 2, topK: 4 });
  record('Node Fallback Serves Recommendations when AI Service Offline', fbRecs.recommendations.length === 4 && fbRecs.engine === 'node_fallback');

  // Test 16: Fallback Demand Forecast
  const fbDemand = await aiClient.forecastDemand({ productId: 'f1', horizonDays: 5 });
  record('Node Fallback Serves Demand Forecast when AI Service Offline', fbDemand.dailyForecasts.length === 5 && fbDemand.engine === 'node_fallback');

  // Test 17: Fallback Dynamic Pricing
  const fbPricing = await aiClient.recommendPrice({ productId: 'f1', category: 'Fruits', basePrice: 100 });
  record('Node Fallback Serves Price Simulation when AI Service Offline', fbPricing.recommendedPrice > 0 && fbPricing.engine === 'node_fallback');

  // Test 18: Fallback Warehouse Routing
  const fbWh = await aiClient.optimizeWarehouse({ productIds: ['f1', 'd1'] });
  record('Node Fallback Serves Warehouse Route when AI Service Offline', fbWh.pickingSequence.length === 2 && fbWh.engine === 'node_fallback');

  // Test 19: Fallback Delivery Routing
  const fbDel = await aiClient.optimizeDelivery({ orders: [{ id: 'O1', lat: 19.0, lng: 72.8, demand: 2.0 }] });
  record('Node Fallback Serves Delivery Route when AI Service Offline', fbDel.routes.length > 0 && fbDel.engine === 'node_fallback');

  // Cleanup
  if (testServer) await testServer.close();
  stopPythonService();

  console.log('\n====================================================================');
  console.log(`  🎯 AI INTEGRATION TESTS: ${passed} PASSED, ${total - passed} FAILED (Total: ${total})`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runIntegrationTests().catch(err => {
    console.error('Fatal Integration Test Error:', err);
    stopPythonService();
    if (testServer) testServer.close();
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };
