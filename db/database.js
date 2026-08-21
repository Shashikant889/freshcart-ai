const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'freshcart.db');
let dbInstance = null;
let SQL = null;

async function initDb() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (!dbInstance) {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } else {
      dbInstance = new SQL.Database();
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      dbInstance.run(schema);
      saveDb();
    }
  }

  return getDbWrapper();
}

function saveDb() {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
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

function closeDb() {
  if (dbInstance) {
    saveDb();
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = { initDb, getDb, saveDb, closeDb, DB_PATH };
