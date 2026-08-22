const express = require('express');
const router = express.Router();
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { getDb } = require('../db/database');

// In-memory wallet storage per user/session with persistent ledger support
const userWallets = new Map();

function getWallet(key) {
  if (!userWallets.has(key)) {
    userWallets.set(key, {
      balance: 150.00, // ₹150 welcome bonus
      cashbackEarned: 45.00,
      transactions: [
        { id: 'TXN-W1', type: 'credit', amount: 150.00, desc: '🎁 Welcome Bonus Credited', date: new Date().toISOString() },
        { id: 'TXN-W2', type: 'credit', amount: 45.00, desc: '🪙 5% Cashback on Order #ORD-DEMO', date: new Date(Date.now() - 86400000).toISOString() }
      ]
    });
  }
  return userWallets.get(key);
}

// GET /api/wallet/balance - Get current wallet balance & ledger
router.get('/balance', optionalAuth, (req, res) => {
  const key = req.user ? `user_${req.user.id}` : (req.headers['x-session-id'] || 'guest');
  const wallet = getWallet(key);
  res.json({
    success: true,
    data: wallet
  });
});

// POST /api/wallet/topup - Add money to FreshWallet
router.post('/topup', optionalAuth, (req, res) => {
  const { amount } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid top-up amount required' });
  }

  const key = req.user ? `user_${req.user.id}` : (req.headers['x-session-id'] || 'guest');
  const wallet = getWallet(key);
  wallet.balance = Math.round((wallet.balance + numAmount) * 100) / 100;

  const txn = {
    id: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    type: 'credit',
    amount: numAmount,
    desc: '⚡ Wallet Instant UPI Top-Up',
    date: new Date().toISOString()
  };
  wallet.transactions.unshift(txn);

  res.json({
    success: true,
    message: `₹${numAmount} successfully added to FreshWallet!`,
    data: wallet
  });
});

// POST /api/wallet/pay-split - Calculate split payment between Wallet & Gateway
router.post('/pay-split', optionalAuth, (req, res) => {
  const { totalAmount, useWallet = true } = req.body;
  const numTotal = parseFloat(totalAmount);
  if (isNaN(numTotal) || numTotal <= 0) {
    return res.status(400).json({ success: false, message: 'Valid total amount required' });
  }

  const key = req.user ? `user_${req.user.id}` : (req.headers['x-session-id'] || 'guest');
  const wallet = getWallet(key);

  let walletDeduction = 0;
  let remainingGatewayPayable = numTotal;

  if (useWallet && wallet.balance > 0) {
    walletDeduction = Math.min(wallet.balance, numTotal);
    remainingGatewayPayable = Math.round((numTotal - walletDeduction) * 100) / 100;
  }

  res.json({
    success: true,
    data: {
      orderTotal: numTotal,
      walletAvailable: wallet.balance,
      walletDeducted: Math.round(walletDeduction * 100) / 100,
      gatewayPayable: remainingGatewayPayable,
      isFullyPaidByWallet: remainingGatewayPayable === 0
    }
  });
});

module.exports = router;
