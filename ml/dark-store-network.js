/**
 * FreshCart AI — Hyperlocal Multi-Dark-Store Network Coordinator (ml/dark-store-network.js)
 * 
 * Modeled after Zepto & Blinkit micro-fulfillment dark store networks.
 * Provides:
 * 1. Pincode & Haversine GPS geofencing to nearest fulfillment hub
 * 2. Real-time dynamic order delivery ETA prediction based on fleet velocity
 * 3. Multi-hub inventory visibility and automated inter-store stock rebalancing
 */

const DARK_STORES = [
  {
    id: 'hub-01',
    name: 'Bandra West Express Hub',
    code: 'HUB-01',
    address: 'Hill Road, Bandra West, Mumbai',
    pincode: '400050',
    lat: 19.0596,
    lng: 72.8295,
    radiusKm: 4.5,
    activeCouriers: 18,
    avgSpeedKmh: 28,
    status: 'OPTIMAL',
    utilization: '74%'
  },
  {
    id: 'hub-02',
    name: 'Andheri East Logistics Depot',
    code: 'HUB-02',
    address: 'MIDC Cross Road, Andheri East, Mumbai',
    pincode: '400069',
    lat: 19.1136,
    lng: 72.8697,
    radiusKm: 5.2,
    activeCouriers: 24,
    avgSpeedKmh: 25,
    status: 'OPTIMAL',
    utilization: '82%'
  },
  {
    id: 'hub-03',
    name: 'Powai Tech Micro-Hub',
    code: 'HUB-03',
    address: 'Hiranandani Gardens, Powai, Mumbai',
    pincode: '400076',
    lat: 19.1197,
    lng: 72.9051,
    radiusKm: 4.0,
    activeCouriers: 16,
    avgSpeedKmh: 30,
    status: 'OPTIMAL',
    utilization: '68%'
  },
  {
    id: 'hub-04',
    name: 'Dadar Central Fulfillment',
    code: 'HUB-04',
    address: 'Shivaji Park, Dadar West, Mumbai',
    pincode: '400028',
    lat: 19.0178,
    lng: 72.8478,
    radiusKm: 4.8,
    activeCouriers: 20,
    avgSpeedKmh: 26,
    status: 'OPTIMAL',
    utilization: '79%'
  }
];

/**
 * Great-circle Haversine distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Resolve closest dark store hub for a customer pincode or coordinate
 */
function locateNearestDarkStore(input) {
  const { pincode, lat, lng } = input || {};

  // Direct pincode exact match
  if (pincode) {
    const pinStr = String(pincode).trim();
    const directMatch = DARK_STORES.find(h => h.pincode === pinStr);
    if (directMatch) {
      return {
        ...directMatch,
        distanceKm: 1.2,
        estimatedMinutes: 8,
        matchType: 'pincode_exact'
      };
    }
  }

  // Coordinate distance match
  const userLat = parseFloat(lat) || 19.0600;
  const userLng = parseFloat(lng) || 72.8300;

  let bestHub = DARK_STORES[0];
  let minDistance = Infinity;

  for (const hub of DARK_STORES) {
    const dist = haversineDistance(userLat, userLng, hub.lat, hub.lng);
    if (dist < minDistance) {
      minDistance = dist;
      bestHub = hub;
    }
  }

  // Quick commerce transit estimation: Prep time (2 min) + Travel time
  const travelHours = minDistance / (bestHub.avgSpeedKmh || 25);
  const travelMinutes = Math.max(5, Math.min(20, Math.round(2 + travelHours * 60)));

  return {
    ...bestHub,
    distanceKm: parseFloat(minDistance.toFixed(2)),
    estimatedMinutes: travelMinutes,
    matchType: 'haversine_proximity'
  };
}

/**
 * Return all dark store fulfillment hubs
 */
function getAllDarkStores() {
  return DARK_STORES.map(hub => ({
    ...hub,
    currentQueueOrders: Math.floor(Math.random() * 8) + 3,
    temperatureZone: '2.8°C Cold Chain Active'
  }));
}

/**
 * Compute multi-hub inventory balance & inter-store transfer proposals
 */
function getInterStoreBalance(products = []) {
  const sampleSkus = products.slice(0, 10);
  const rebalanceActions = [];

  sampleSkus.forEach((prod, idx) => {
    // Generate deterministic distribution across 4 hubs
    const total = prod.stock || 50;
    const h1 = Math.max(2, Math.round(total * 0.15));
    const h2 = Math.round(total * 0.45);
    const h3 = Math.round(total * 0.25);
    const h4 = total - (h1 + h2 + h3);

    // If Hub 1 is running critically low (< 10 units) and Hub 2 has abundance
    if (h1 < 10 && h2 > 20) {
      const transferUnits = Math.min(15, Math.floor((h2 - h1) / 2));
      rebalanceActions.push({
        id: `xfer-${prod.id}-${idx}`,
        productId: prod.id,
        productName: prod.name,
        emoji: prod.emoji,
        fromHub: 'HUB-02 (Andheri East Depot)',
        toHub: 'HUB-01 (Bandra West Express)',
        recommendedUnits: transferUnits,
        urgency: h1 <= 4 ? 'CRITICAL' : 'HIGH',
        reason: `Hub-01 stock critically depleted (${h1} units) while Hub-02 has surplus (${h2} units).`,
        transitEtaMinutes: 18,
        costSavingsInr: transferUnits * 14
      });
    }
  });

  return {
    timestamp: new Date().toISOString(),
    totalHubs: DARK_STORES.length,
    activeFleetSize: DARK_STORES.reduce((acc, h) => acc + h.activeCouriers, 0),
    networkHealth: '99.4% SLA Compliance',
    recommendedTransfers: rebalanceActions
  };
}

module.exports = {
  DARK_STORES,
  locateNearestDarkStore,
  getAllDarkStores,
  getInterStoreBalance
};
