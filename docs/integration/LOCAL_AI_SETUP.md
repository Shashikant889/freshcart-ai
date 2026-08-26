# FreshCart AI: Local Development & Multi-Service Setup Guide

This guide explains how to start and manage both the **Node.js Application Server** and the **Python AI & Optimization Inference Microservice** for local development.

---

## 1. Prerequisites

- **Node.js:** v18.0+ or v20.0+ (Installed & available on PATH)
- **Python:** v3.10, v3.11, or v3.12 (Virtual environment at `.venv/`)

---

## 2. Quick Start: Running the Full Stack Locally

### Step 1: Start the Python AI Microservice (Port 8000)
In a dedicated terminal:
```bash
# Activate virtual environment and start FastAPI inference service:
.venv\Scripts\python -m ml.service.app
```
*The service will load all 7 serialized model artifacts into memory and listen on `http://127.0.0.1:8000`.*

### Step 2: Start the Node.js Application Server (Port 3000)
In a second terminal:
```bash
# Start Express application server:
npm start
```
*The web storefront will become accessible at `http://localhost:3000` and the Admin Portal at `http://localhost:3000/admin.html`.*

---

## 3. Environment Variables & Configuration

The Node.js and Python services can be configured via environment variables:

| Variable | Default | Service | Description |
|---|---|---|---|
| `PORT` | `3000` | Node.js | Express application HTTP port |
| `AI_SERVICE_HOST` | `127.0.0.1` | Node.js & Python | Python AI service host IP |
| `AI_SERVICE_PORT` | `8000` | Node.js & Python | Python AI service port |
| `AI_TIMEOUT_MS` | `1500` | Node.js | Maximum milliseconds before falling back to Node heuristic |
| `JWT_SECRET` | `freshcart-ai-secret-key-2025` | Node.js | Secret key for JWT auth verification |

---

## 4. Validating System Health & Integration

### Run Full-Stack Master Audit (56 Automated Checks)
```bash
npm run audit
```

### Run All 7 Multi-Tier Test Suites (113 Assertions)
```bash
npm run test:all
```

### Run AI Gateway Integration Tests Independently
```bash
npm run test:integration
```

### Run Python Inference Microservice Self-Test
```bash
.venv\Scripts\python -m ml.service.test_service
```

---

## 5. Graceful Fallback Verification (Zero-Downtime Guarantee)

If the Python service is stopped or crashes during runtime:
1. The Node.js server automatically catches the connection refusal or timeout within `1500ms`.
2. Seamlessly switches to in-process Node heuristic algorithms (`ml/*.js`).
3. Sets `isFallback: true` and `engine: "node_fallback"` in the JSON response metadata.
4. The frontend displays dynamic data without 500 errors or UI crashes.
5. Once the Python service is restarted on port 8000, subsequent requests automatically resume using the trained Python ML models.
