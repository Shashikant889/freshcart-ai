const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getDb } = require('../db/database');

// Active in-memory group buying lobbies
const groupLobbies = new Map();

// Helper to initialize sample demo group lobbies
if (groupLobbies.size === 0) {
  groupLobbies.set('GRP-INDIRA-88', {
    groupId: 'GRP-INDIRA-88',
    communityName: 'Sunshine Residency, Indiranagar',
    hostName: 'Priya Mehta',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour left
    members: [
      { name: 'Priya Mehta (Host)', itemsCount: 4, subtotal: 620 },
      { name: 'Rohan Verma', itemsCount: 3, subtotal: 450 },
      { name: 'Ananya Deshmukh', itemsCount: 5, subtotal: 890 }
    ],
    targetTier: { minMembers: 5, discountPercent: 12 },
    currentDiscountPercent: 8, // 3 members unlocked 8% tier
    status: 'active'
  });
}

// GET /api/group-orders/lobbies - List active community group buying lobbies
router.get('/lobbies', (req, res) => {
  const list = Array.from(groupLobbies.values());
  res.json({
    success: true,
    count: list.length,
    data: list
  });
});

// POST /api/group-orders/create - Create new group buy lobby
router.post('/create', optionalAuth, (req, res) => {
  const { communityName, hostName } = req.body;
  if (!communityName || !hostName) {
    return res.status(400).json({ success: false, message: 'Community name and host name are required' });
  }

  const groupId = 'GRP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const newLobby = {
    groupId,
    communityName,
    hostName,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours
    members: [
      { name: `${hostName} (Host)`, itemsCount: 0, subtotal: 0 }
    ],
    targetTier: { minMembers: 4, discountPercent: 10 },
    currentDiscountPercent: 5,
    status: 'active'
  };

  groupLobbies.set(groupId, newLobby);
  res.status(201).json({
    success: true,
    message: 'Group buying lobby created! Share the ID with neighbors.',
    data: newLobby
  });
});

// POST /api/group-orders/:groupId/join - Join existing community lobby
router.post('/:groupId/join', optionalAuth, (req, res) => {
  const lobby = groupLobbies.get(req.params.groupId);
  if (!lobby) {
    return res.status(404).json({ success: false, message: 'Group buying lobby not found' });
  }

  const { memberName, itemsCount = 1, subtotal = 300 } = req.body;
  lobby.members.push({
    name: memberName || `Neighbor #${lobby.members.length + 1}`,
    itemsCount: parseInt(itemsCount) || 1,
    subtotal: parseFloat(subtotal) || 300
  });

  // Dynamically update tiered volume discount
  if (lobby.members.length >= 6) {
    lobby.currentDiscountPercent = 15;
  } else if (lobby.members.length >= 4) {
    lobby.currentDiscountPercent = 10;
  } else if (lobby.members.length >= 2) {
    lobby.currentDiscountPercent = 8;
  }

  res.json({
    success: true,
    message: `Joined ${lobby.communityName}! You unlocked ${lobby.currentDiscountPercent}% community group discount.`,
    data: lobby
  });
});

module.exports = router;
