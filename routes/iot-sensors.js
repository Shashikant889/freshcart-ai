/**
 * FreshCart AI — Cold Chain IoT Telemetry & Spoilage Monitor (routes/iot-sensors.js)
 * 
 * Simulates real-time IoT sensors in Quick-Commerce Dark Store fulfillment centers.
 * Integrates HACCP cold chain safety compliance:
 * - Zone 1: Dairy & Cut Fruit Walk-in Chiller (2°C to 4°C)
 * - Zone 2: Deep Freeze Meat & Frozen ( -18°C)
 * - Zone 3: Ambient Produce & Bakery (20°C to 22°C)
 */

const express = require('express');
const router = express.Router();

// Stateful in-memory sensor readings (with small simulated variance)
let sensorState = {
  chiller: {
    zoneId: 'CHILLER-Z1',
    name: 'Walk-In Chiller (Dairy & Produce)',
    temperatureC: 3.1,
    targetTempC: 3.0,
    humidityPct: 86,
    status: 'OPTIMAL',
    compressorDutyPct: 62,
    doorOpeningsLastHour: 14,
    lastDefrostCycle: '42m ago'
  },
  freezer: {
    zoneId: 'FREEZER-Z2',
    name: 'Deep Freezer (Frozen Foods)',
    temperatureC: -18.4,
    targetTempC: -18.0,
    humidityPct: 61,
    status: 'OPTIMAL',
    compressorDutyPct: 78,
    doorOpeningsLastHour: 6,
    lastDefrostCycle: '2h ago'
  },
  ambient: {
    zoneId: 'AMBIENT-Z3',
    name: 'Ambient Rack Area (Pantry & Bakery)',
    temperatureC: 21.5,
    targetTempC: 21.0,
    humidityPct: 52,
    status: 'OPTIMAL',
    ventilationAirflowCfm: 1250,
    doorOpeningsLastHour: 38,
    lastDefrostCycle: 'N/A'
  },
  activeIncidents: []
};

// GET /api/iot/telemetry - Live sensor readings
router.get('/telemetry', (req, res) => {
  // Add subtle realistic micro-fluctuation (+/- 0.1°C) if not in forced anomaly
  if (sensorState.chiller.status === 'OPTIMAL') {
    const jitter = (Math.random() - 0.5) * 0.2;
    sensorState.chiller.temperatureC = parseFloat((3.0 + jitter).toFixed(1));
  }
  if (sensorState.freezer.status === 'OPTIMAL') {
    const jitter = (Math.random() - 0.5) * 0.3;
    sensorState.freezer.temperatureC = parseFloat((-18.2 + jitter).toFixed(1));
  }

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    storeId: 'HUB-01 (Bandra West)',
    complianceStandard: 'HACCP & ISO 22000 Food Safety',
    telemetry: sensorState,
    overallHealth: sensorState.activeIncidents.length === 0 ? 'HEALTHY' : 'WARNING'
  });
});

// POST /api/iot/simulate-anomaly - Simulate refrigeration failure
router.post('/simulate-anomaly', (req, res) => {
  const { zone = 'chiller', temp = 8.6 } = req.body || {};
  
  if (zone === 'chiller') {
    sensorState.chiller.temperatureC = parseFloat(temp);
    sensorState.chiller.status = 'TEMPERATURE_EXCURSION';
    sensorState.chiller.compressorDutyPct = 100;
  } else if (zone === 'freezer') {
    sensorState.freezer.temperatureC = -11.0;
    sensorState.freezer.status = 'TEMPERATURE_EXCURSION';
  }

  const incident = {
    id: `INC-${Date.now().toString(36).toUpperCase()}`,
    zoneId: zone === 'chiller' ? 'CHILLER-Z1' : 'FREEZER-Z2',
    timestamp: new Date().toISOString(),
    description: `Temperature spike to ${sensorState[zone].temperatureC}°C exceeded critical threshold (Max 4.5°C).`,
    severity: 'CRITICAL',
    automatedActionsTriggered: [
      'Dispatched SMS/Push alarm to Dark Store Manager',
      'Triggered 25% Flash Clearance Markdown on perishable dairy items to avoid food waste',
      'Rerouted incoming temperature-sensitive orders to Hub-02 (Andheri)'
    ]
  };

  sensorState.activeIncidents.unshift(incident);

  res.json({
    success: true,
    message: `IoT Cold-Chain Anomaly Simulated for ${zone}. Automated mitigating actions engaged.`,
    incident,
    updatedTelemetry: sensorState
  });
});

// POST /api/iot/reset - Reset back to optimal operating parameters
router.post('/reset', (req, res) => {
  sensorState.chiller.temperatureC = 3.1;
  sensorState.chiller.status = 'OPTIMAL';
  sensorState.chiller.compressorDutyPct = 62;

  sensorState.freezer.temperatureC = -18.4;
  sensorState.freezer.status = 'OPTIMAL';
  sensorState.freezer.compressorDutyPct = 78;

  sensorState.activeIncidents = [];

  res.json({
    success: true,
    message: 'Cold chain sensors reset to optimal baseline readings.',
    telemetry: sensorState
  });
});

module.exports = router;
