/**
 * FreshCart AI — Python AI Gateway & Resilient Microservice Client
 * 
 * Provides unified, non-blocking asynchronous access to the Python AI/ML and 
 * Operations Research microservice with sub-second timeouts and automatic, 
 * zero-downtime graceful fallback to in-process Node engines.
 */

const http = require('http');

// Configuration
const AI_SERVICE_HOST = process.env.AI_SERVICE_HOST || '127.0.0.1';
const AI_SERVICE_PORT = parseInt(process.env.AI_SERVICE_PORT || '8000', 10);
const AI_SERVICE_BASE_URL = `http://${AI_SERVICE_HOST}:${AI_SERVICE_PORT}`;
const REQUEST_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '1500', 10);

/**
 * Internal helper to send JSON HTTP requests with strict timeout handling.
 */
function sendRequest(endpoint, method = 'POST', payload = null) {
  return new Promise((resolve, reject) => {
    const dataString = payload ? JSON.stringify(payload) : '';
    
    const options = {
      hostname: AI_SERVICE_HOST,
      port: AI_SERVICE_PORT,
      path: endpoint,
      method: method,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseBody);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse JSON response from ${endpoint}: ${e.message}`));
          }
        } else {
          reject(new Error(`AI Service returned HTTP ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`AI Service timeout after ${REQUEST_TIMEOUT_MS}ms calling ${endpoint}`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

/**
 * 1. Health Check
 */
async function checkHealth() {
  try {
    const res = await sendRequest('/health', 'GET');
    return { online: true, ...res };
  } catch (err) {
    return { online: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * 2. Personalized Recommendations
 */
async function getRecommendations({ userId = null, cartItems = [], topK = 6, categoryFilter = null } = {}) {
  try {
    const res = await sendRequest('/predict/recommendations', 'POST', {
      user_id: userId,
      cart_items: cartItems,
      top_k: topK,
      category_filter: categoryFilter
    });
    return {
      engine: 'python_ml',
      modelUsed: res.model_used,
      isFallback: res.is_fallback,
      recommendations: res.recommendations
    };
  } catch (err) {
    // Graceful Node fallback
    const { getHybridRecommendations } = require('../ml/recommendation-engine');
    const nodeRecs = getHybridRecommendations(userId, topK);
    return {
      engine: 'node_fallback',
      modelUsed: userId ? 'Node Hybrid CF+CB Fallback' : 'Node Popularity Fallback',
      isFallback: true,
      error: err.message,
      recommendations: nodeRecs.map(r => ({
        product_id: r.id,
        name: r.name,
        category: r.category,
        price: r.price,
        score: r.score,
        reason: r.reason || 'Popular Essential'
      }))
    };
  }
}

/**
 * 3. Demand Forecasting
 */
async function forecastDemand({ productId = null, horizonDays = 7 } = {}) {
  try {
    const res = await sendRequest('/predict/demand', 'POST', {
      product_id: productId,
      horizon_days: horizonDays
    });
    return {
      engine: 'python_ml',
      modelUsed: res.model_used,
      horizonDays: res.horizon_days,
      totalForecastedUnits: res.total_forecasted_units,
      dailyForecasts: res.daily_forecasts,
      isFallback: res.is_fallback
    };
  } catch (err) {
    // Graceful Node fallback
    const { forecastProductDemand } = require('../ml/demand-forecasting');
    const nodeForecast = forecastProductDemand(productId || 'p1', horizonDays);
    const dailyPoints = nodeForecast.dailyForecast || nodeForecast.forecast || [];
    const totalUnits = dailyPoints.reduce((s, d) => s + (d.predictedQuantity || 0), 0);
    return {
      engine: 'node_fallback',
      modelUsed: 'Node OLS Trend + Seasonality Fallback',
      horizonDays: horizonDays,
      totalForecastedUnits: Math.round(totalUnits * 10) / 10,
      dailyForecasts: dailyPoints.map((d, i) => ({
        day_offset: i + 1,
        predicted_quantity: d.predictedQuantity || 0
      })),
      isFallback: true,
      error: err.message
    };
  }
}

/**
 * 4. Dynamic Pricing & Elasticity
 */
async function recommendPrice({ productId, category = 'General', basePrice, cost = null, minRatio = 0.75, maxRatio = 1.25 } = {}) {
  try {
    const res = await sendRequest('/predict/price', 'POST', {
      product_id: productId,
      category: category,
      base_price: basePrice,
      cost: cost,
      min_price_ratio: minRatio,
      max_price_ratio: maxRatio
    });
    return {
      engine: 'python_ml',
      modelUsed: res.model_used,
      basePrice: res.base_price,
      recommendedPrice: res.recommended_price,
      priceChangePct: res.price_change_pct,
      priceElasticity: res.price_elasticity,
      demandType: res.demand_type,
      demandMultiplier: res.estimated_demand_multiplier,
      disclaimer: res.disclaimer,
      isFallback: res.is_fallback
    };
  } catch (err) {
    // Graceful Node fallback
    const { simulatePriceChange } = require('../ml/dynamic-pricing');
    const nodeSim = simulatePriceChange(productId, basePrice);
    return {
      engine: 'node_fallback',
      modelUsed: 'Node Micro-Elasticity Fallback',
      basePrice: basePrice,
      recommendedPrice: nodeSim.optimalRevenuePrice,
      priceChangePct: Math.round(((nodeSim.optimalRevenuePrice - basePrice) / basePrice) * 10000) / 100,
      priceElasticity: nodeSim.elasticity,
      demandType: nodeSim.elasticityType,
      demandMultiplier: nodeSim.simulatedMultiplier,
      disclaimer: 'Simulated Node fallback estimate',
      isFallback: true,
      error: err.message
    };
  }
}

/**
 * 5. Order Fraud Risk Scoring
 */
async function scoreFraud(orderData = {}) {
  try {
    const res = await sendRequest('/predict/fraud', 'POST', {
      order_id: orderData.orderId,
      user_id: orderData.userId,
      total: orderData.total,
      total_items: orderData.totalItems || (orderData.items ? orderData.items.length : 1),
      unique_skus: orderData.uniqueSkus || (orderData.items ? orderData.items.length : 1),
      max_item_quantity: orderData.maxItemQuantity || 1,
      order_hour: orderData.orderHour !== undefined ? orderData.orderHour : new Date().getHours(),
      order_dow: orderData.orderDow !== undefined ? orderData.orderDow : new Date().getDay(),
      user_mean_spend: orderData.userMeanSpend,
      user_velocity_24h: orderData.userVelocity24h || 1,
      delivery_distance_km: orderData.deliveryDistanceKm || 5.0
    });
    return {
      engine: 'python_ml',
      modelUsed: res.model_used,
      riskScore: res.risk_score,
      riskLevel: res.risk_level,
      isAnomaly: res.is_anomaly,
      contributingFactors: res.contributing_factors,
      isFallback: res.is_fallback
    };
  } catch (err) {
    // Graceful Node fallback
    const { evaluateOrderRisk } = require('../ml/fraud-detection');
    const nodeRisk = evaluateOrderRisk(orderData);
    return {
      engine: 'node_fallback',
      modelUsed: 'Node Multi-Factor Z-Score Fallback',
      riskScore: nodeRisk.riskScore,
      riskLevel: nodeRisk.riskLevel,
      isAnomaly: nodeRisk.isAnomaly,
      contributingFactors: nodeRisk.flags,
      isFallback: true,
      error: err.message
    };
  }
}

/**
 * 6. Inventory Optimization (EOQ & ROP)
 */
async function optimizeInventory(skuData = {}) {
  try {
    const res = await sendRequest('/optimize/inventory', 'POST', {
      sku_id: skuData.skuId || skuData.productId,
      name: skuData.name,
      unit_price: skuData.unitPrice || skuData.price,
      avg_daily_demand: skuData.avgDailyDemand || 8.5,
      std_daily_demand: skuData.stdDailyDemand || 2.4,
      lead_time_days: skuData.leadTimeDays || 2.0,
      lead_time_std: skuData.leadTimeStd || 0.5,
      current_stock: skuData.currentStock || 0,
      service_level: skuData.serviceLevel || 0.95
    });
    return {
      engine: 'python_ml',
      modelUsed: res.model_used,
      economicOrderQuantity: res.economic_order_quantity,
      safetyStock: res.safety_stock,
      reorderPoint: res.reorder_point,
      needsReorder: res.needs_reorder,
      suggestedOrderQuantity: res.suggested_order_quantity,
      estimatedReorderCost: res.estimated_reorder_cost,
      isFallback: res.is_fallback
    };
  } catch (err) {
    // Graceful Node fallback
    const leadTime = skuData.leadTimeDays || 2.0;
    const avgDemand = skuData.avgDailyDemand || 8.5;
    const stdDemand = skuData.stdDailyDemand || 2.4;
    const ss = Math.round(1.645 * stdDemand * Math.sqrt(leadTime));
    const rop = Math.round((avgDemand * leadTime) + ss);
    const currStock = skuData.currentStock || 0;
    const needsReorder = currStock <= rop;
    const eoq = Math.round(Math.sqrt((2 * (avgDemand * 365) * 350) / ((skuData.unitPrice || 100) * 0.20)));

    return {
      engine: 'node_fallback',
      modelUsed: 'Node Analytical EOQ/ROP Fallback',
      economicOrderQuantity: eoq,
      safetyStock: ss,
      reorderPoint: rop,
      needsReorder: needsReorder,
      suggestedOrderQuantity: needsReorder ? eoq : 0,
      estimatedReorderCost: needsReorder ? eoq * ((skuData.unitPrice || 100) * 0.65) : 0,
      isFallback: true,
      error: err.message
    };
  }
}

/**
 * 7. Dark Store Warehouse Picking Optimization (2D TSP)
 */
async function optimizeWarehouse({ productIds = [] } = {}) {
  try {
    const res = await sendRequest('/optimize/warehouse', 'POST', {
      product_ids: productIds
    });
    return {
      engine: 'python_ml',
      algorithmUsed: res.algorithm_used,
      totalItems: res.total_items,
      totalWalkingDistanceMeters: res.total_walking_distance_meters,
      estimatedPickTimeSeconds: res.estimated_pick_time_seconds,
      pickingSequence: res.picking_sequence,
      isFallback: res.is_fallback
    };
  } catch (err) {
    // Graceful Node fallback
    const { optimizeWarehousePickerRoute } = require('../ml/dark-store-picker');
    const nodeRoute = optimizeWarehousePickerRoute(productIds);
    const seq = (nodeRoute.pickSequence || nodeRoute.optimalPickSequence || []).filter(s => !!s.id);
    return {
      engine: 'node_fallback',
      algorithmUsed: 'Node Manhattan Distance TSP Fallback',
      totalItems: nodeRoute.totalItems || seq.length,
      totalWalkingDistanceMeters: nodeRoute.totalWalkingMeters || nodeRoute.totalDistanceMeters || 45.0,
      estimatedPickTimeSeconds: nodeRoute.estimatedPickSeconds || 60,
      pickingSequence: seq.map((s, idx) => ({
        step: idx + 1,
        product_id: s.id,
        name: s.name || `Item ${s.id}`,
        aisle: s.aisle || 'A1',
        rack: s.rack || 1,
        shelf: s.shelf || 1,
        zone: s.zone || 'General',
        x: s.x || 0.0,
        y: s.y || 0.0
      })),
      isFallback: true,
      error: err.message
    };
  }
}

/**
 * 8. Delivery Routing Optimization (CVRP)
 */
async function optimizeDelivery({ orders = [], vehicleCapacityKg = 25.0 } = {}) {
  try {
    const res = await sendRequest('/optimize/delivery', 'POST', {
      orders: orders,
      vehicle_capacity_kg: vehicleCapacityKg
    });
    return {
      engine: 'python_ml',
      algorithmUsed: res.algorithm_used,
      totalOrders: res.total_orders,
      numVehiclesUsed: res.num_vehicles_used,
      totalFleetDistanceKm: res.total_fleet_distance_km,
      totalTravelTimeHours: res.total_travel_time_hours,
      fleetCapacityUtilizationPct: res.fleet_capacity_utilization_pct,
      routes: res.routes,
      isFallback: res.is_fallback
    };
  } catch (err) {
    // Graceful Node fallback
    const { optimizeDeliveryDispatch } = require('../ml/route-optimizer');
    const nodeVrp = optimizeDeliveryDispatch(orders.length || 8);
    const totDist = nodeVrp.totalDistanceKm || 12.5;
    const durHours = (nodeVrp.estimatedTotalDurationMins || 30) / 60;
    return {
      engine: 'node_fallback',
      algorithmUsed: 'Node TSP Delivery Fallback',
      totalOrders: nodeVrp.totalStops || orders.length,
      numVehiclesUsed: 1,
      totalFleetDistanceKm: totDist,
      totalTravelTimeHours: Math.round(durHours * 100) / 100,
      fleetCapacityUtilizationPct: 80.0,
      routes: [{
        vehicle_id: 'VEH-01',
        num_stops: nodeVrp.totalStops || orders.length,
        route_distance_km: totDist,
        payload_kg: 20.0,
        capacity_utilization_pct: 80.0,
        estimated_time_hours: Math.round(durHours * 100) / 100,
        stops: nodeVrp.itinerary || []
      }],
      isFallback: true,
      error: err.message
    };
  }
}

module.exports = {
  checkHealth,
  getRecommendations,
  forecastDemand,
  recommendPrice,
  scoreFraud,
  optimizeInventory,
  optimizeWarehouse,
  optimizeDelivery
};
