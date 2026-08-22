/**
 * FreshCart AI — Dark Store Warehouse Picker 2D TSP Route Optimizer
 * Implements:
 * 1. 2D Coordinate Grid Layout of Micro-Fulfillment Dark Store (Aisle X, Rack Y, Shelf Z)
 * 2. Euclidean Distance Matrix for Warehouse Picking Staff
 * 3. Nearest Neighbor + 2-Opt Local Search Heuristic for Sub-90 Second Order Assembly
 */

const { getDb } = require('../db/database');

// Dark Store #04 Physical Warehouse Coordinates (Aisles A1-A6, Racks 1-10)
const PRODUCT_WAREHOUSE_LOCATIONS = {
  // Fresh Produce Zone (Aisle 1 & 2)
  f1: { aisle: 'A1', rack: 1, shelf: 2, x: 2.0, y: 3.5, zone: 'Fruits' },
  f2: { aisle: 'A1', rack: 2, shelf: 1, x: 2.0, y: 7.0, zone: 'Fruits' },
  f3: { aisle: 'A1', rack: 3, shelf: 3, x: 2.0, y: 10.5, zone: 'Fruits' },
  f4: { aisle: 'A1', rack: 4, shelf: 2, x: 2.0, y: 14.0, zone: 'Fruits' },
  f5: { aisle: 'A1', rack: 5, shelf: 1, x: 2.0, y: 17.5, zone: 'Fruits' },
  f6: { aisle: 'A1', rack: 6, shelf: 2, x: 2.0, y: 21.0, zone: 'Fruits' },

  v1: { aisle: 'A2', rack: 1, shelf: 1, x: 6.0, y: 3.5, zone: 'Vegetables' },
  v2: { aisle: 'A2', rack: 2, shelf: 2, x: 6.0, y: 7.0, zone: 'Vegetables' },
  v3: { aisle: 'A2', rack: 3, shelf: 1, x: 6.0, y: 10.5, zone: 'Vegetables' },
  v4: { aisle: 'A2', rack: 4, shelf: 3, x: 6.0, y: 14.0, zone: 'Vegetables' },
  v5: { aisle: 'A2', rack: 5, shelf: 2, x: 6.0, y: 17.5, zone: 'Vegetables' },
  v6: { aisle: 'A2', rack: 6, shelf: 1, x: 6.0, y: 21.0, zone: 'Vegetables' },

  // Chilled & Cold Storage Zone (Aisle 3 & 4)
  d1: { aisle: 'A3', rack: 1, shelf: 1, x: 10.0, y: 4.0, zone: 'Cold Dairy' },
  d2: { aisle: 'A3', rack: 2, shelf: 2, x: 10.0, y: 8.0, zone: 'Cold Dairy' },
  d3: { aisle: 'A3', rack: 3, shelf: 3, x: 10.0, y: 12.0, zone: 'Cold Dairy' },
  d4: { aisle: 'A3', rack: 4, shelf: 2, x: 10.0, y: 16.0, zone: 'Cold Dairy' },
  d5: { aisle: 'A3', rack: 5, shelf: 1, x: 10.0, y: 20.0, zone: 'Eggs' },

  // Bakery & Ambient Grains (Aisle 5)
  b1: { aisle: 'A4', rack: 1, shelf: 2, x: 14.0, y: 5.0, zone: 'Bakery' },
  b2: { aisle: 'A4', rack: 2, shelf: 1, x: 14.0, y: 10.0, zone: 'Bakery' },
  b3: { aisle: 'A4', rack: 3, shelf: 3, x: 14.0, y: 15.0, zone: 'Bakery' },

  // Snacks, Beverages & Dry Essentials (Aisle 6)
  s1: { aisle: 'A5', rack: 1, shelf: 2, x: 18.0, y: 6.0, zone: 'Snacks' },
  s2: { aisle: 'A5', rack: 2, shelf: 3, x: 18.0, y: 12.0, zone: 'Snacks' },
  s3: { aisle: 'A5', rack: 3, shelf: 1, x: 18.0, y: 18.0, zone: 'Beverages' }
};

// Dispatch & Packing Station (Start / End Node)
const PACKING_STATION = { id: 'STATION_01', name: 'Packing & QA Station #1', x: 0.0, y: 0.0, aisle: 'ENTRY', rack: 0, shelf: 0 };

function euclideanDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Optimizes the picking walk sequence for a batch of order items inside the warehouse
 * @param {Array} productIds - Array of product IDs in order
 * @returns {Object} Optimized walk path, total walking meters, estimated pick time in seconds
 */
function optimizeWarehousePickerRoute(productIds = ['f1', 'v2', 'd1', 'b1', 's2']) {
  const db = getDb();
  
  // Resolve unique locations
  const itemsToPick = [];
  const uniqueIds = Array.from(new Set(productIds));

  for (const pid of uniqueIds) {
    const loc = PRODUCT_WAREHOUSE_LOCATIONS[pid] || { aisle: 'A1', rack: 1, shelf: 1, x: 2.0, y: 5.0, zone: 'General' };
    const prod = db.prepare('SELECT name, emoji, category FROM products WHERE id = ?').get(pid) || { name: 'Item ' + pid, emoji: '📦' };
    itemsToPick.push({
      productId: pid,
      name: prod.name,
      emoji: prod.emoji,
      category: prod.category,
      ...loc
    });
  }

  if (itemsToPick.length === 0) {
    return {
      pickSequence: [PACKING_STATION],
      totalMeters: 0,
      estimatedPickSeconds: 15,
      pathSummary: 'No items to pick'
    };
  }

  // 1. Construct Nearest Neighbor Initial Tour from Packing Station
  let current = PACKING_STATION;
  const unvisited = [...itemsToPick];
  const tour = [PACKING_STATION];

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = euclideanDistance(current, unvisited[i]);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisited[nearestIdx];
    tour.push(current);
    unvisited.splice(nearestIdx, 1);
  }

  // Return to Packing Station
  tour.push(PACKING_STATION);

  // 2. Apply 2-Opt Local Search to eliminate cross-aisle backtracking
  let improved = true;
  let iterations = 0;

  function calculateTourLength(t) {
    let len = 0;
    for (let i = 0; i < t.length - 1; i++) {
      len += euclideanDistance(t[i], t[i + 1]);
    }
    return len;
  }

  while (improved && iterations < 30) {
    improved = false;
    iterations++;

    for (let i = 1; i < tour.length - 2; i++) {
      for (let j = i + 1; j < tour.length - 1; j++) {
        const dCurrent = euclideanDistance(tour[i - 1], tour[i]) + euclideanDistance(tour[j], tour[j + 1]);
        const dReversed = euclideanDistance(tour[i - 1], tour[j]) + euclideanDistance(tour[i], tour[j + 1]);

        if (dReversed < dCurrent - 0.01) {
          // Reverse segment between i and j
          const segment = tour.slice(i, j + 1).reverse();
          tour.splice(i, segment.length, ...segment);
          improved = true;
        }
      }
    }
  }

  const totalDistanceMeters = Math.round(calculateTourLength(tour) * 1.5 * 10) / 10; // 1.5m scale per grid unit
  const walkingSeconds = Math.round((totalDistanceMeters / 1.2)); // 1.2 m/s average brisk walk
  const pickingTimeSeconds = itemsToPick.length * 8; // 8 seconds per shelf grab
  const totalPickSeconds = walkingSeconds + pickingTimeSeconds;

  return {
    pickSequence: tour,
    totalItems: itemsToPick.length,
    totalWalkingMeters: totalDistanceMeters,
    estimatedPickSeconds: totalPickSeconds,
    packingStation: PACKING_STATION,
    aisleTransitions: tour.map(t => `${t.aisle || 'STATION'}-R${t.rack || 0}`).join(' ➔ ')
  };
}

module.exports = {
  optimizeWarehousePickerRoute,
  PRODUCT_WAREHOUSE_LOCATIONS,
  PACKING_STATION
};
