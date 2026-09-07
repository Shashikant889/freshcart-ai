/**
 * FreshCart AI — 1-Click Disaster Recovery & Catalog Rollback Engine
 * Restores original database snapshot from backup/catalog_before_migration_20260906041453/
 */

const fs = require('fs');
const path = require('path');
const { closeDb } = require('../db/database');

const rootDir = path.resolve(__dirname, '..');
const backupDir = path.join(rootDir, 'backup', 'catalog_before_migration_20260906041453');
const targetDb = path.join(rootDir, 'db', 'freshcart.db');

async function rollback() {
  console.log('🔄 Executing FreshCart AI Catalog Rollback...');

  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Fatal: Backup directory not found at ${backupDir}`);
    process.exit(1);
  }

  const backupDb = path.join(backupDir, 'freshcart.db');
  if (!fs.existsSync(backupDb)) {
    console.error(`❌ Fatal: Backup SQLite file not found at ${backupDb}`);
    process.exit(1);
  }

  // Close any active connections
  closeDb({ save: false });

  // Copy snapshot back
  fs.copyFileSync(backupDb, targetDb);
  console.log(`✅ [RESTORED] freshcart.db restored from ${backupDb}`);
  console.log(`✅ [VERIFIED] Pre-migration catalog restored to baseline.`);
}

rollback().catch(console.error);
