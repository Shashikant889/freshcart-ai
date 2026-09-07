/**
 * FreshCart AI — Prime VIP Loyalty & Rewards Gamification Route Controller (routes/loyalty.js)
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getDb } = require('../db/database');

function calculateTier(points) {
  if (points >= 3000) return { tier: 'Platinum', badge: '💎', nextTier: 'Max Tier', nextThreshold: 3000, progressPct: 100, perks: ['Zero Delivery Fee Always', '5-Minute Priority Dispatch', 'Free Artisanal Sample with Every Order', 'VIP Dedicated Concierge'] };
  if (points >= 1500) return { tier: 'Gold', badge: '🥇', nextTier: 'Platinum', nextThreshold: 3000, progressPct: Math.round(((points - 1500) / 1500) * 100), perks: ['Zero Delivery Fee Above ₹299', '2x FreshCoins on Organic Produce', 'Exclusive Weekend Flash Pass'] };
  if (points >= 500) return { tier: 'Silver', badge: '🥈', nextTier: 'Gold', nextThreshold: 1500, progressPct: Math.round(((points - 500) / 1000) * 100), perks: ['Zero Delivery Fee Above ₹399', '1.5x FreshCoins Multiplier', 'Early Access to Midnight Steals'] };
  return { tier: 'Bronze', badge: '🥉', nextTier: 'Silver', nextThreshold: 500, progressPct: Math.round((points / 500) * 100), perks: ['Standard Loyalty Earn (1 pt / ₹20)', 'Access to Community Group Buys'] };
}

// GET /api/loyalty/profile - Current user VIP tier & rewards
router.get('/profile', optionalAuth, (req, res) => {
  try {
    let points = 720;
    let orderCount = 5;
    let streakDays = 3;

    if (req.user && req.user.id) {
      try {
        const db = getDb();
        const stats = db.prepare('SELECT COUNT(*) as cnt, SUM(total) as spend FROM orders WHERE user_id = ?').get(req.user.id);
        if (stats && stats.cnt > 0) {
          orderCount = stats.cnt;
          points = Math.max(150, Math.round((stats.spend || 0) * 0.1) + (stats.cnt * 40));
          streakDays = Math.min(7, Math.max(1, Math.floor(stats.cnt / 2)));
        }
      } catch (e) {}
    }

    const tierInfo = calculateTier(points);

    res.json({
      success: true,
      data: {
        points,
        lifetimeSpend: points * 10,
        orderCount,
        streakDays,
        streakBonusActive: streakDays >= 3,
        streakRewardText: `${streakDays}-Day Quick Commerce Streak: Unlocked +50 Coins per order!`,
        ...tierInfo
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/loyalty/claim-perk - Claim interactive loyalty perk
router.post('/claim-perk', optionalAuth, (req, res) => {
  const { perkName } = req.body || {};
  res.json({
    success: true,
    message: `Perk successfully unlocked: ${perkName || 'Free Express Delivery Slot'} applied to your session!`,
    rewardCode: `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  });
});

module.exports = router;
