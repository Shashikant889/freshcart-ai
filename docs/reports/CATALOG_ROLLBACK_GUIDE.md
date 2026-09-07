# FreshCart AI — Catalog Rollback & Disaster Recovery Guide

> **Document Type**: Operational Runbook & Disaster Recovery Protocol  
> **Directive Reference**: Section 38 ("Migration Rollback & Safety Guarantee")  
> **Target RPO / RTO**: RPO = 0 (Pre-migration state preserved) • RTO < 5 seconds  

---

## 1. Rollback Overview
If the new catalog introduces any unforeseen regressions in legacy tests, machine learning models, or external integrations, the system provides a zero-downtime, single-command automated rollback procedure.

The pre-migration snapshot is permanently archived in:
[`backup/catalog_before_migration_20260906041453/`](file:///c:/Users/shash/demo1/backup/catalog_before_migration_20260906041453/)

---

## 2. Emergency Rollback Execution

To restore the complete pre-migration database, category mappings, and product state:

```bash
node scripts/restore-catalog-backup.js
```

### What This Command Does:
1. Safely disconnects the active SQLite WebAssembly database instance.
2. Replaces `db/freshcart.db` with the pristine 252.7 MB baseline copy.
3. Restores exact pre-migration schema, categories, and product attributes.
4. Restarts the Express server cleanly.

---

## 3. Post-Rollback Verification

After executing rollback, verify that the baseline passes:

```bash
# 1. Verify product f1 exists
node -e "const { initDb, getDb, closeDb } = require('./db/database'); (async () => { await initDb(); console.log(getDb().prepare('SELECT id, name FROM products WHERE id=\"f1\"').get()); closeDb(); })();"

# 2. Run master audit suite
npm run audit:full
```
