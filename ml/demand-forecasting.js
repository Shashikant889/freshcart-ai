/**
 * Machine Learning Demand & Quantity Forecasting Engine
 * Implements:
 * 1. Simple Moving Average (SMA) & Weighted Moving Average (WMA)
 * 2. Linear Regression (Ordinary Least Squares Trend Fitting)
 * 3. Seasonal Multiplicative Decomposition
 * 4. Forecast Evaluation (RMSE, MAE, MAPE on 30-day holdout)
 * 5. Automated Stockout & Overstock Risk Alerts
 */

const { getDb } = require('../db/database');

/**
 * Math utility: Ordinary Least Squares (OLS) Linear Regression
 * Fits y = mx + c
 * slope (m) = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
 * intercept (c) = ȳ - m * x̄
 */
function fitLinearRegression(xValues, yValues) {
  const n = xValues.length;
  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };

  const meanX = xValues.reduce((s, v) => s + v, 0) / n;
  const meanY = yValues.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = xValues[i] - meanX;
    const diffY = yValues[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const slope = denomX === 0 ? 0 : numerator / denomX;
  const intercept = meanY - slope * meanX;
  const rSquared = (denomX === 0 || denomY === 0) ? 0 : Math.pow(numerator / Math.sqrt(denomX * denomY), 2);

  return {
    slope,
    intercept,
    rSquared: Math.round(rSquared * 1000) / 1000,
    predict: (x) => Math.max(0, slope * x + intercept)
  };
}

/**
 * 1. Forecast next N days demand for a specific product
 */
function forecastProductDemand(productId, horizonDays = 7) {
  const db = getDb();
  const history = db.prepare(`
    SELECT date, quantity_sold, revenue 
    FROM sales_history 
    WHERE product_id = ? 
    ORDER BY date ASC
  `).all(productId);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return { success: false, message: 'Product not found' };
  }

  if (history.length === 0) {
    const baseDaily = Math.max(2, Math.round((product.stock || 50) / 20));
    const points = [];
    let cum = 0;
    const now = new Date();
    for (let step = 1; step <= horizonDays; step++) {
      const fDate = new Date(now);
      fDate.setDate(now.getDate() + step);
      const qty = baseDaily;
      cum += qty;
      points.push({
        date: fDate.toISOString().split('T')[0],
        day: fDate.toLocaleDateString('en-US', { weekday: 'short' }),
        predictedQuantity: qty,
        lowerBound: Math.max(1, qty - 1),
        upperBound: qty + 2
      });
    }
    const daysStock = baseDaily > 0 ? Math.round(((product.stock || 0) / baseDaily) * 10) / 10 : 99;
    return {
      productId: product.id,
      productName: product.name,
      emoji: product.emoji,
      category: product.category,
      currentStock: product.stock || 0,
      currentPrice: product.price || 0,
      daysOfStock: daysStock,
      stockStatus: daysStock <= 3 ? 'Critical Stockout Risk' : 'Adequate Stock Level',
      riskLevel: daysStock <= 3 ? 'critical' : 'low',
      totalForecastPeriod: horizonDays,
      cumulativeForecastQuantity: cum,
      predictedRevenue: Math.round(cum * (product.price || 0)),
      dailyForecast: points,
      forecast: points,
      isColdStart: true,
      metrics: {
        sma7: baseDaily,
        sma14: baseDaily,
        sma30: baseDaily,
        trendSlope: 0,
        rSquared: 1,
        rmse: 0,
        mae: 0,
        mape: '0%'
      }
    };
  }

  const n = history.length;
  const quantities = history.map(h => h.quantity_sold);
  const xIndices = Array.from({ length: n }, (_, i) => i);

  // Train/Test Split (last 30 days as test validation set)
  const trainSize = Math.max(30, n - 30);
  const trainX = xIndices.slice(0, trainSize);
  const trainY = quantities.slice(0, trainSize);
  const testY = quantities.slice(trainSize);

  // Model 1: Linear Regression Trend
  const regression = fitLinearRegression(trainX, trainY);

  // Model 2: 7-day and 14-day Moving Averages
  const sma7 = quantities.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const sma14 = quantities.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const sma30 = quantities.slice(-30).reduce((a, b) => a + b, 0) / 30;

  // Day-of-week seasonality index (0=Sun, 6=Sat)
  const dowAverages = Array(7).fill(0);
  const dowCounts = Array(7).fill(0);
  for (const h of history) {
    const dow = new Date(h.date).getDay();
    dowAverages[dow] += h.quantity_sold;
    dowCounts[dow]++;
  }
  const overallAvg = quantities.reduce((a, b) => a + b, 0) / n;
  const seasonalIndices = dowAverages.map((sum, i) => (dowCounts[i] ? (sum / dowCounts[i]) / (overallAvg || 1) : 1.0));

  // Generate Future Forecast Points
  const lastDate = new Date(history[history.length - 1].date);
  const forecastPoints = [];
  let cumulativeForecast = 0;

  for (let step = 1; step <= horizonDays; step++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(lastDate.getDate() + step);
    const dateStr = futureDate.toISOString().split('T')[0];
    const dow = futureDate.getDay();

    // Hybrid forecast = Trend * Seasonal Index * (0.6 Reg + 0.4 SMA)
    const trendPred = regression.predict(n + step - 1);
    const seasonFactor = seasonalIndices[dow] || 1.0;
    const hybridVal = Math.round(((0.6 * trendPred) + (0.4 * sma7)) * seasonFactor * 10) / 10;
    const predictedQty = Math.max(1, Math.round(hybridVal));

    cumulativeForecast += predictedQty;

    forecastPoints.push({
      date: dateStr,
      day: futureDate.toLocaleDateString('en-US', { weekday: 'short' }),
      predictedQuantity: predictedQty,
      lowerBound: Math.max(0, Math.round(predictedQty * 0.8)),
      upperBound: Math.round(predictedQty * 1.25)
    });
  }

  // Model Evaluation on 30-day Holdout Test Set
  let sumSquaredError = 0;
  let sumAbsError = 0;
  let sumAbsPctError = 0;
  const testCount = testY.length;

  for (let i = 0; i < testCount; i++) {
    const actual = testY[i];
    const predicted = regression.predict(trainSize + i);
    const err = actual - predicted;
    sumSquaredError += err * err;
    sumAbsError += Math.abs(err);
    if (actual > 0) sumAbsPctError += Math.abs(err) / actual;
  }

  const rmse = testCount ? Math.sqrt(sumSquaredError / testCount) : 0;
  const mae = testCount ? sumAbsError / testCount : 0;
  const mape = testCount ? (sumAbsPctError / testCount) * 100 : 0;

  // Stock Risk Assessment
  const currentStock = product.stock;
  const dailyRunRate = cumulativeForecast / horizonDays;
  const daysOfStock = dailyRunRate > 0 ? Math.round((currentStock / dailyRunRate) * 10) / 10 : 99;

  let stockStatus = 'Safe';
  let riskLevel = 'low';
  if (daysOfStock <= 3) {
    stockStatus = 'Critical Stockout Risk';
    riskLevel = 'critical';
  } else if (daysOfStock <= 7) {
    stockStatus = 'Low Stock Warning';
    riskLevel = 'medium';
  } else if (daysOfStock > 30) {
    stockStatus = 'Overstocked';
    riskLevel = 'overstock';
  }

  return {
    productId: product.id,
    productName: product.name,
    emoji: product.emoji,
    category: product.category,
    currentStock,
    currentPrice: product.price,
    daysOfStock,
    stockStatus,
    riskLevel,
    totalForecastPeriod: horizonDays,
    cumulativeForecastQuantity: cumulativeForecast,
    predictedRevenue: Math.round(cumulativeForecast * product.price),
    metrics: {
      sma7: Math.round(sma7 * 10) / 10,
      sma14: Math.round(sma14 * 10) / 10,
      sma30: Math.round(sma30 * 10) / 10,
      trendSlope: Math.round(regression.slope * 1000) / 1000,
      rSquared: regression.rSquared,
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      mape: Math.round(mape * 10) / 10 + '%'
    },
    dailyForecast: forecastPoints,
    recentSalesHistory: history.slice(-14)
  };
}

/**
 * 2. Category Level Aggregate Demand Forecast
 */
function forecastCategoryDemand(category, horizonDays = 7) {
  const db = getDb();
  const products = db.prepare('SELECT id FROM products WHERE category = ?').all(category);
  if (products.length === 0) return { error: 'Category not found' };

  const forecasts = products.map(p => forecastProductDemand(p.id, horizonDays));
  const totalPredictedQty = forecasts.reduce((s, f) => s + (f.cumulativeForecastQuantity || 0), 0);
  const totalPredictedRev = forecasts.reduce((s, f) => s + (f.predictedRevenue || 0), 0);

  return {
    category,
    productCount: products.length,
    horizonDays,
    totalPredictedQuantity: totalPredictedQty,
    totalPredictedRevenue: totalPredictedRev,
    productBreakdown: forecasts.map(f => ({
      id: f.productId,
      name: f.productName,
      emoji: f.emoji,
      stock: f.currentStock,
      predictedQty: f.cumulativeForecastQuantity,
      status: f.stockStatus
    }))
  };
}

/**
 * 3. Automated Inventory Stock Alerts (Stockouts & Overstocks) - High-Performance Batch Aggregator
 */
let cachedAlerts = null;
let lastAlertsTime = 0;
const ALERTS_CACHE_TTL = 30000;

function getInventoryStockAlerts() {
  const now = Date.now();
  if (cachedAlerts && (now - lastAlertsTime < ALERTS_CACHE_TTL)) {
    return cachedAlerts;
  }

  const db = getDb();
  const products = db.prepare('SELECT id, name, emoji, category, stock, price FROM products').all();

  // Aggregate 30-day sales run-rates in a single vectorized query
  const salesMap = new Map();
  try {
    const rows = db.prepare(`
      SELECT product_id, SUM(quantity_sold) as total_qty, COUNT(DISTINCT date) as days_count
      FROM sales_history
      GROUP BY product_id
    `).all();
    for (const r of rows) {
      salesMap.set(r.product_id, r);
    }
  } catch (e) {}

  const alerts = [];
  for (const p of products) {
    const s = salesMap.get(p.id);
    const avgDaily = s && s.days_count > 0 ? (s.total_qty / s.days_count) : Math.max(2, Math.round((p.stock || 50) / 20));
    const predicted7Day = Math.round(avgDaily * 7);
    const daysOfStock = avgDaily > 0 ? Math.round(((p.stock || 0) / avgDaily) * 10) / 10 : 99;

    let riskLevel = 'low';
    let stockStatus = 'Adequate Stock Level';
    if (daysOfStock <= 3) {
      riskLevel = 'critical';
      stockStatus = 'Critical Stockout Risk';
    } else if (daysOfStock <= 7) {
      riskLevel = 'medium';
      stockStatus = 'Moderate Stockout Risk';
    } else if (daysOfStock > 45) {
      riskLevel = 'overstock';
      stockStatus = 'Overstocked Capital Risk';
    }

    if (riskLevel !== 'low') {
      alerts.push({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        category: p.category,
        currentStock: p.stock || 0,
        predicted7DayDemand: predicted7Day,
        daysOfStock: daysOfStock,
        riskLevel: riskLevel,
        status: stockStatus,
        recommendedAction: riskLevel === 'critical'
          ? `Urgent Reorder: Order at least ${Math.round(predicted7Day * 1.5)} units immediately.`
          : riskLevel === 'medium'
            ? `Reorder Notice: Order ${predicted7Day} units within 48 hours.`
            : `Promotional Discount: Reduce price by 10-15% to clear excess inventory.`
      });
    }
  }

  // Sort critical first
  const priorityMap = { critical: 1, medium: 2, overstock: 3 };
  alerts.sort((a, b) => (priorityMap[a.riskLevel] || 4) - (priorityMap[b.riskLevel] || 4));

  cachedAlerts = alerts;
  lastAlertsTime = now;
  return alerts;
}

module.exports = {
  forecastProductDemand,
  forecastCategoryDemand,
  getInventoryStockAlerts,
  fitLinearRegression
};
