const express = require('express');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
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

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Boot server after initializing SQLite database
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`\n  🛒  FreshCart AI-Powered Grocery E-Commerce & Recommendation System`);
      console.log(`  ================================================================`);
      console.log(`  ✅  Server running at http://localhost:${PORT}`);
      console.log(`  📊  Admin & AI Dashboard: http://localhost:${PORT}/admin`);
      console.log(`  🧠  AI Recommendations API: http://localhost:${PORT}/api/recommendations/personal`);
      console.log(`  📈  AI Demand Forecasting API: http://localhost:${PORT}/api/analytics/demand-forecast/f1`);
      console.log(`  👥  AI Customer Segmentation: http://localhost:${PORT}/api/analytics/segments`);
      console.log(`  🔍  NLP Smart Search: http://localhost:${PORT}/api/search?q=organic\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
