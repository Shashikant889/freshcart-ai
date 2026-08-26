const express = require('express');
const path = require('path');
const { initDb } = require('./db/database');

function createApp() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/cart', require('./routes/cart').router);
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/recommendations', require('./routes/recommendations'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/assistant', require('./routes/assistant'));
  app.use('/api/pricing', require('./routes/pricing'));
  app.use('/api/dispatch', require('./routes/dispatch'));
  app.use('/api/visual', require('./routes/visual'));
  app.use('/api/nutrition', require('./routes/nutrition'));
  app.use('/api/wallet', require('./routes/wallet'));
  app.use('/api/group-orders', require('./routes/group-orders'));
  app.use('/api/supplier', require('./routes/supplier'));

  // Serve Admin Dashboard page
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  // Global API Error Handler (Never expose stack traces to client)
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ success: false, message: 'Malformed JSON payload' });
    }
    const status = err.status || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message;
    res.status(status).json({ success: false, message });
  });

  // Serve frontend for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}

// Boot server after initializing SQLite database
async function start(port = process.env.PORT || 3000) {
  try {
    await initDb();
    const app = createApp();
    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        console.log(`\n  🛒  FreshCart AI-Powered Grocery E-Commerce & Recommendation System`);
        console.log(`  ================================================================`);
        console.log(`  ✅  Server running at http://localhost:${port}`);
        console.log(`  📊  Admin & AI Dashboard: http://localhost:${port}/admin`);
        console.log(`  🧠  AI Recommendations API: http://localhost:${port}/api/recommendations/personal`);
        console.log(`  📈  AI Demand Forecasting API: http://localhost:${port}/api/analytics/demand-forecast/f1`);
        console.log(`  👥  AI Customer Segmentation: http://localhost:${port}/api/analytics/segments`);
        console.log(`  🔍  NLP Smart Search: http://localhost:${port}/api/search?q=organic\n`);
        resolve({ app, server, port });
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { createApp, start };
