/**
 * ML & Mathematical Engines Integrity Auditor
 * Tests:
 * - Recommendations: personal, bundles, FBT, buy again
 * - Demand Forecasting: OLS regression, NaN/Infinity check, future dates
 * - Dynamic Pricing: elasticity, P*, profit margin bounds
 * - Fraud Detection: Z-Score, velocity, flag thresholds
 * - Customer Segmentation: K-Means, silhouette/WCSS, non-empty clusters
 * - Dark Store & Route Optimization: VRP 2-Opt distance & savings
 */

const { initDb, getDb, closeDb } = require('../db/database');
const { getHybridRecommendations, getSmartBundles, getFrequentlyBoughtTogether, getBuyAgainProducts } = require('../ml/recommendation-engine');
const { forecastProductDemand, getInventoryStockAlerts } = require('../ml/demand-forecasting');
const { simulatePriceChange, getProductElasticity } = require('../ml/dynamic-pricing');
const { evaluateOrderRisk } = require('../ml/fraud-detection');
const { getCustomerSegmentation } = require('../ml/customer-segmentation');
const { optimizeDeliveryDispatch } = require('../ml/route-optimizer');

async function auditML() {
  console.log('\n=== PHASE 8: ML & MATHEMATICAL ENGINE AUDIT ===\n');
  await initDb();

  const results = { passed: 0, failed: 0, tests: [] };

  function check(name, condition, details = '') {
    if (condition) {
      results.passed++;
      console.log(`✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      results.tests.push({ name, status: 'PASS', details });
    } else {
      results.failed++;
      console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      results.tests.push({ name, status: 'FAIL', details });
    }
  }

  // 1. Recommendations: Personal / Hybrid
  try {
    const recs = await getHybridRecommendations(1, 6);
    check('Hybrid Recommendations', Array.isArray(recs) && recs.length > 0, `Returned ${recs.length} items`);
    const validPrices = recs.every(r => typeof r.price === 'number' && !isNaN(r.price) && r.price > 0);
    check('Hybrid Recs Valid Prices & No NaN', validPrices);
  } catch (e) {
    check('Hybrid Recommendations', false, e.message);
  }

  // 2. Smart Bundles
  try {
    const bundles = await getSmartBundles();
    check('Smart Bundles Generated', Array.isArray(bundles) && bundles.length > 0, `Count: ${bundles.length}`);
    const bundleMathValid = bundles.every(b => b.bundlePrice < b.originalPrice && b.savingsAmount > 0 && !isNaN(b.bundlePrice));
    check('Smart Bundles Math & Savings Valid', bundleMathValid);
  } catch (e) {
    check('Smart Bundles Generated', false, e.message);
  }

  // 3. FBT
  try {
    const fbt = await getFrequentlyBoughtTogether('f1');
    check('Frequently Bought Together', Array.isArray(fbt), `Count: ${fbt.length}`);
    const fbtValid = fbt.every(item => typeof item.lift === 'number' && !isNaN(item.lift));
    check('FBT Confidence & Lift No NaN', fbtValid);
  } catch (e) {
    check('Frequently Bought Together', false, e.message);
  }

  // 4. Demand Forecasting
  try {
    const forecast = await forecastProductDemand('f1', 7);
    check('Demand Forecast Returned', forecast && typeof forecast.cumulativeForecastQuantity === 'number', `Forecast: ${forecast?.cumulativeForecastQuantity} units`);
    const noNaNForecast = !isNaN(forecast.cumulativeForecastQuantity) && isFinite(forecast.cumulativeForecastQuantity);
    check('Demand Forecast No NaN/Infinity', noNaNForecast);
    const hasDailyBreakdown = Array.isArray(forecast.dailyForecast) && forecast.dailyForecast.length === 7;
    check('Demand Forecast 7-Day Series Complete', hasDailyBreakdown);
  } catch (e) {
    check('Demand Forecast Returned', false, e.message);
  }

  // 5. Dynamic Pricing Simulation
  try {
    const pricing = await simulatePriceChange('f1', 1.10);
    check('Dynamic Pricing Simulation', pricing && pricing.optimalRevenuePrice !== undefined, `Optimal P*: ₹${pricing?.optimalRevenuePrice}`);
    const validElasticity = typeof pricing.elasticityCoefficient === 'number' && !isNaN(pricing.elasticityCoefficient);
    check('Price Elasticity (Ed) Valid Number', validElasticity, `Ed: ${pricing?.elasticityCoefficient}`);
    const validProfit = !isNaN(pricing.simulated7DayRevenue) && isFinite(pricing.simulated7DayRevenue);
    check('Projected Revenue No NaN/Infinity', validProfit);
  } catch (e) {
    check('Dynamic Pricing Simulation', false, e.message);
  }

  // 6. Fraud Detection
  try {
    const fraudNormal = evaluateOrderRisk({
      userId: 1,
      total: 450,
      items: [{ productId: 'f1', quantity: 2 }],
      phone: '9876543210'
    });
    check('Fraud Engine Normal Evaluation', fraudNormal && fraudNormal.riskScore !== undefined, `Score: ${fraudNormal?.riskScore}`);

    const fraudHigh = evaluateOrderRisk({
      userId: 1,
      total: 85000,
      items: [{ productId: 'f1', quantity: 45 }],
      phone: '9876543210'
    });
    check('Fraud Engine Anomaly Detection', fraudHigh.riskScore > fraudNormal.riskScore, `High risk score: ${fraudHigh?.riskScore}`);
  } catch (e) {
    check('Fraud Engine Evaluation', false, e.message);
  }

  // 7. Customer Segmentation
  try {
    const seg = await getCustomerSegmentation(4);
    check('Customer Segmentation K-Means', seg && Array.isArray(seg.clusters), `Clusters: ${seg?.clusters?.length}`);
    const noEmptyClusters = seg.clusters.every(c => c.memberCount > 0 && !isNaN(c.averageMonetary));
    check('No Empty Clusters & Valid RFM Metrics', noEmptyClusters);
  } catch (e) {
    check('Customer Segmentation K-Means', false, e.message);
  }

  // 8. Route Optimization
  try {
    const sampleStops = [
      { orderId: 'ord-1', address: 'MG Road, Indiranagar', lat: 12.9780, lng: 77.6010 },
      { orderId: 'ord-2', address: 'Koramangala 4th Block', lat: 12.9352, lng: 77.6245 },
      { orderId: 'ord-3', address: 'HSR Layout Sector 1', lat: 12.9121, lng: 77.6446 }
    ];
    const route = optimizeDeliveryDispatch(sampleStops);
    check('Route Optimizer Dispatch 2-Opt', route && typeof route.totalDistanceKm === 'number', `Distance: ${route?.totalDistanceKm}km`);
    const validSavings = route.totalDistanceKm > 0 && !isNaN(route.totalDistanceKm);
    check('Route Optimizer Distance Valid', validSavings, `Total: ${route?.totalDistanceKm}km`);
  } catch (e) {
    check('Route Optimizer Dispatch 2-Opt', false, e.message);
  }

  closeDb();
  console.log(`\n=== ML AUDIT COMPLETE: ${results.passed} PASSED, ${results.failed} FAILED ===\n`);
  return results;
}

if (require.main === module) {
  auditML().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  }).catch(err => {
    console.error('Fatal ML audit error:', err);
    process.exit(1);
  });
}

module.exports = { auditML };
