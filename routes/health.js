const express = require('express');
const router = express.Router();
const os = require('os');
const { getDb } = require('../db/database');
const aiClient = require('../services/ai-client');

const serverStartTime = Date.now();

// GET /api/health - Comprehensive System Health & Diagnostics
router.get('/', async (req, res) => {
  const db = getDb();
  let dbStatus = 'healthy';
  let tableCounts = {};

  try {
    const tables = ['users', 'products', 'orders', 'order_items', 'cart_items', 'user_interactions', 'sales_history'];
    for (const tbl of tables) {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${tbl}`).get();
      tableCounts[tbl] = row ? row.count : 0;
    }
  } catch (err) {
    dbStatus = 'degraded: ' + err.message;
  }

  // Check Python AI Microservice Health
  let aiHealth = { online: false, status: 'offline', mode: 'node_fallback' };
  try {
    const healthResult = await aiClient.checkHealth();
    aiHealth = {
      online: healthResult.online || false,
      status: healthResult.status || 'unknown',
      version: healthResult.version || '2.0.0',
      modelsLoaded: healthResult.models_loaded || {},
      mode: healthResult.online ? 'python_microservice' : 'node_fallback'
    };
  } catch (e) {
    aiHealth.error = e.message;
  }

  const memory = process.memoryUsage();

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024)
    },
    process: {
      pid: process.pid,
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
      rssMB: Math.round(memory.rss / 1024 / 1024 * 100) / 100
    },
    database: {
      engine: 'SQLite 3 (WebAssembly via sql.js)',
      status: dbStatus,
      tables: tableCounts
    },
    aiGateway: aiHealth
  });
});

module.exports = router;
