/**
 * FreshCart AI — Baseline Database Restore Tool
 * Restores the original demonstration baseline database from backup.
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'freshcart.db');
const backupPath = path.join(__dirname, '..', 'db', 'freshcart.db.baseline.bak');

function restoreBaseline() {
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found at:', backupPath);
    process.exit(1);
  }

  fs.copyFileSync(backupPath, dbPath);
  console.log('✅ Successfully restored baseline database to db/freshcart.db');
}

if (require.main === module) {
  restoreBaseline();
}

module.exports = { restoreBaseline };
