/**
 * Machine Learning Transaction Anomaly & Fraud Detection Engine
 * Implements:
 * 1. Z-Score Statistical Spend Deviation: Z = (X - μ) / σ
 * 2. Velocity Risk Checking (Order frequency burst within short time windows)
 * 3. Quantity Hoarding & Bulk Scalping Detection
 * 4. Composite Risk Score Formulation (0 to 100) & Actionable Flags
 */

const { getDb } = require('../db/database');

/**
 * Evaluates an incoming order for potential fraud, scalping, or abnormal velocity.
 * @param {Object} orderData - { userId, customerName, total, items, address, phone }
 * @returns {Object} { riskScore, riskLevel, flags, confidence }
 */
function evaluateOrderRisk(orderData) {
  const db = getDb();
  const { userId, total, items = [], phone } = orderData;

  const flags = [];
  let riskScore = 0; // 0 (Clean) to 100 (High Risk)

  // 1. Check User Historical Spend Persona (Z-Score Deviation)
  if (userId) {
    const history = db.prepare(`
      SELECT total FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
    `).all(userId);

    if (history.length >= 3) {
      const totals = history.map(h => h.total);
      const mean = totals.reduce((s, v) => s + v, 0) / totals.length;
      const variance = totals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / totals.length;
      const stdDev = Math.sqrt(variance) || 1;

      const zScore = (total - mean) / stdDev;

      if (zScore > 3.0) {
        flags.push(`Extreme Spend Anomaly: Order total (₹${total}) is ${Math.round(zScore * 10) / 10} standard deviations above user average (₹${Math.round(mean)}).`);
        riskScore += 40;
      } else if (zScore > 2.0) {
        flags.push(`Moderate Spend Spike: Order total is ${Math.round(zScore * 10) / 10}x standard deviations above usual spending.`);
        riskScore += 20;
      }
    }
  }

  // 2. High-Velocity Rapid Order Check (Orders placed in the last 10 minutes)
  const recentWindowOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE (user_id = ? OR phone = ?) 
      AND created_at >= datetime('now', '-10 minutes')
  `).get(userId || -1, phone || '').count;

  if (recentWindowOrders >= 3) {
    flags.push(`High Velocity Anomaly: ${recentWindowOrders} orders detected from this phone/user in the past 10 minutes.`);
    riskScore += 45;
  } else if (recentWindowOrders >= 2) {
    flags.push(`Rapid Re-order Notice: 2nd order placed within 10 minutes.`);
    riskScore += 15;
  }

  // 3. Item Hoarding / Scalping Check (Abnormally high single item quantity)
  let maxItemQty = 0;
  for (const item of items) {
    if (item.quantity > maxItemQty) maxItemQty = item.quantity;
    if (item.quantity >= 10) {
      flags.push(`Bulk Hoarding Alert: ${item.quantity} units of ${item.name || item.productId} ordered.`);
      riskScore += 25;
    }
  }

  // 4. Absolute Transaction Value Outlier
  if (total > 8000) {
    flags.push(`High Value Transaction: Order total exceeds ₹8,000 threshold.`);
    riskScore += 15;
  }

  // Cap risk score
  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel = 'low';
  let badge = '🛡️ Low Risk (Safe)';
  let color = '#10b981';

  if (riskScore >= 60) {
    riskLevel = 'high';
    badge = '🚨 High Risk (Flagged)';
    color = '#ef4444';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
    badge = '⚠️ Medium Risk (Review)';
    color = '#f59e0b';
  }

  return {
    riskScore,
    riskLevel,
    badge,
    color,
    flags: flags.length > 0 ? flags : ['Transaction normal within standard customer behavior parameters.'],
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = { evaluateOrderRisk };
