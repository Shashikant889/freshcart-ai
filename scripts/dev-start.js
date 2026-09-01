/**
 * FreshCart AI — Unified Local Development Launcher (scripts/dev-start.js)
 * 
 * Orchestrates:
 * 1. Verification of Node.js environment & SQLite database files
 * 2. Automatic database seeding if not initialized
 * 3. Health check / optional spawning of internal Python FastAPI AI engine (port 8000)
 * 4. Launching of Node.js Express server on http://localhost:3000/
 * 5. Formatting unified single-entry point CLI banners
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;
const AI_PORT = process.env.AI_SERVICE_PORT || 8000;
const DB_PATH = path.join(__dirname, '..', 'db', 'freshcart.db');

console.log('\x1b[32m%s\x1b[0m', '================================================================');
console.log('\x1b[32m%s\x1b[0m', '🌿 FreshCart AI — Enterprise Quick-Commerce & ML Platform');
console.log('\x1b[32m%s\x1b[0m', '================================================================');
console.log(`[1/4] Checking database at ${DB_PATH}...`);

if (!fs.existsSync(DB_PATH) || fs.statSync(DB_PATH).size < 1024) {
  console.log('[1/4] SQLite database not detected or empty. Running database seed...');
  require('../db/seed.js');
  console.log('[1/4] ✅ Database seeded successfully with 24 products, 50+ users, and 4,200+ historical orders.');
} else {
  console.log('[1/4] ✅ SQLite database is ready and initialized.');
}

console.log(`[2/4] Checking internal Python AI Microservice on port ${AI_PORT}...`);

function checkPythonService() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${AI_PORT}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`[2/4] ✅ Internal Python AI Service is LIVE on port ${AI_PORT} (FastAPI v2.0.0)`);
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  const isPythonRunning = await checkPythonService();
  if (!isPythonRunning) {
    console.log('[2/4] ℹ️ Python service not running on port 8000. In-process Node.js ML fallback engines ACTIVE.');
  }

  console.log(`[3/4] Launching Node.js Express Application Server on port ${PORT}...`);
  await require('../server.js').start(PORT);

  setTimeout(() => {
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------');
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', '🚀 FreshCart AI Unified Platform is RUNNING LOCALLY:');
    console.log('\x1b[1m\x1b[37m%s\x1b[0m', `   👉 Single Application Entry URL : http://localhost:${PORT}/`);
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------');
    console.log('   📦 Customer Storefront           : http://localhost:3000/#store');
    console.log('   🛵 10-Min Live Order Tracker     : http://localhost:3000/#orders');
    console.log('   📊 Admin & Operations Dashboard  : http://localhost:3000/#admin');
    console.log('   📈 AI Demand Forecasting View    : http://localhost:3000/#admin-forecasting');
    console.log('   📉 Dynamic Pricing Simulator     : http://localhost:3000/#admin-pricing-simulator');
    console.log('   🚚 Delivery Route Optimizer      : http://localhost:3000/#admin-dispatch-routes');
    console.log('   🏭 Warehouse 2D Picker Route     : http://localhost:3000/#admin-warehouse-picker');
    console.log('   🩺 System Diagnostics Endpoint   : http://localhost:3000/api/health');
    console.log('   🔒 Default Admin Sign-In         : admin@freshcart.com / admin123');
    console.log('   👤 Default Customer Sign-In      : customer@freshcart.com / customer123');
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------');
  }, 600);
}

startServer();
