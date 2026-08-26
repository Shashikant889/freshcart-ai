/**
 * FreshCart AI — Test Server & Database Lifecycle Harness
 * 
 * Provides ephemeral test server initialization, database isolation in memory (no disk mutations),
 * dynamic port allocation (port 0), and clean teardown.
 */

const http = require('http');
const { createApp } = require('../server');
const { initDb, closeDb } = require('../db/database');

/**
 * Starts an isolated, in-process Express test server with non-persistent DB.
 */
async function startTestServer() {
  process.env.NODE_ENV = 'test';

  // Initialize DB in memory without persisting to disk
  await initDb({ persist: false, forceReinit: true });
  const app = createApp();

  const server = http.createServer(app);

  await new Promise((resolve) => {
    // Port 0 tells the OS to assign a free ephemeral port
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });

  const address = server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  /**
   * HTTP request helper pre-bound to the test server instance.
   */
  function request(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * Cleanly shuts down the test server and database.
   */
  async function close() {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
    closeDb({ save: false });
  }

  return {
    app,
    server,
    port,
    baseUrl,
    request,
    close
  };
}

module.exports = { startTestServer };
