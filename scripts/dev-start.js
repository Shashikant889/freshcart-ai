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
console.log('\x1b[32m%s\x1b[0m', '🌿 AI-Driven Intelligent Grocery Retail System Using Machine Learning');
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

const { spawn } = require('child_process');

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

function spawnPythonService() {
  return new Promise((resolve) => {
    const venvPython = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
    const pythonExe = fs.existsSync(venvPython) ? venvPython : 'python';
    
    console.log(`[2/4] 🚀 Spawning Python AI Microservice on port ${AI_PORT} using ${pythonExe}...`);
    
    const pyProcess = spawn(pythonExe, ['-m', 'uvicorn', 'ml.service.app:app', '--host', '127.0.0.1', '--port', String(AI_PORT)], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PYTHONPATH: path.join(__dirname, '..') },
      stdio: 'pipe'
    });

    pyProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Application startup complete') || msg.includes('Uvicorn running')) {
        console.log(`[2/4] ✅ Python AI Microservice started successfully on port ${AI_PORT}`);
      }
    });

    pyProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Application startup complete') || msg.includes('Uvicorn running')) {
        console.log(`[2/4] ✅ Python AI Microservice started successfully on port ${AI_PORT}`);
      }
    });

    // Clean up child process on exit
    const cleanup = () => {
      try {
        pyProcess.kill();
      } catch (e) {}
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });

    // Poll until /health returns 200
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const isLive = await checkPythonService();
      if (isLive) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= 15) {
        clearInterval(interval);
        console.log('[2/4] ⚠️ Python microservice startup timed out. Falling back to in-process Node ML engines.');
        resolve(false);
      }
    }, 500);
  });
}

async function startServer() {
  let isPythonRunning = await checkPythonService();
  if (!isPythonRunning) {
    isPythonRunning = await spawnPythonService();
  }

  console.log(`[3/4] Launching Node.js Express Application Server on port ${PORT}...`);
  await require('../server.js').start(PORT);

  setTimeout(() => {
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------');
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', '🚀 AI-Driven Intelligent Grocery Retail System is RUNNING LOCALLY:');
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
