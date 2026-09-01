const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DEFAULT_DB_PATH = path.join(__dirname, 'freshcart.db');
let currentDbPath = DEFAULT_DB_PATH;
let persistToFile = true;
let dbInstance = null;
let SQL = null;

async function initDb(options = {}) {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  const dbPath = options.dbPath || process.env.DB_PATH || DEFAULT_DB_PATH;
  currentDbPath = dbPath;
  
  if (options.persist !== undefined) {
    persistToFile = options.persist;
  } else if (process.env.NODE_ENV === 'test') {
    persistToFile = false;
  } else {
    persistToFile = true;
  }

  if (options.forceReinit && dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {}
    dbInstance = null;
  }

  if (!dbInstance) {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      dbInstance = new SQL.Database(fileBuffer);
      dbInstance.run(`
        CREATE INDEX IF NOT EXISTS idx_products_cat_price ON products(category, price ASC);
        CREATE INDEX IF NOT EXISTS idx_products_cat_rating ON products(category, rating DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
      `);
    } else {
      dbInstance = new SQL.Database();
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      dbInstance.run(schema);
      if (persistToFile) {
        saveDb();
      }
    }
  }

  return getDbWrapper();
}

function saveDb() {
  if (dbInstance && persistToFile) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(currentDbPath, buffer);
  }
}

function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized! Call await initDb() at startup.');
  }
  return getDbWrapper();
}

function getDbWrapper() {
  return {
    rawDb: dbInstance,
    exec(sql) {
      dbInstance.run(sql);
      saveDb();
    },
    transaction(fn) {
      return function (...args) {
        dbInstance.run('BEGIN TRANSACTION');
        try {
          const result = fn(...args);
          dbInstance.run('COMMIT');
          return result;
        } catch (err) {
          try { dbInstance.run('ROLLBACK'); } catch (e) {}
          throw err;
        }
      };
    },
    prepare(sql) {
      return {
        all(...params) {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const stmt = dbInstance.prepare(sql);
          stmt.bind(flatParams);
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
        get(...params) {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const stmt = dbInstance.prepare(sql);
          stmt.bind(flatParams);
          let result = undefined;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        },
        run(...params) {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const stmt = dbInstance.prepare(sql);
          stmt.bind(flatParams);
          stmt.step();
          stmt.free();
          const res = dbInstance.exec('SELECT last_insert_rowid() as id');
          const lastInsertRowid = res[0]?.values[0]?.[0] || 0;
          return { lastInsertRowid, changes: 1 };
        }
      };
    }
  };
}

function closeDb(options = {}) {
  if (dbInstance) {
    if (persistToFile && options.save !== false) {
      saveDb();
    }
    try {
      dbInstance.close();
    } catch (e) {}
    dbInstance = null;
  }
}

module.exports = { initDb, getDb, saveDb, closeDb, DB_PATH: DEFAULT_DB_PATH };
