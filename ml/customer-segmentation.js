/**
 * Machine Learning Customer Segmentation & RFM Analytics Engine
 * Implements:
 * 1. RFM Feature Extraction (Recency, Frequency, Monetary value per user)
 * 2. Feature Normalization (Min-Max Feature Scaling)
 * 3. K-Means Clustering from scratch (Euclidean distance, convergence check)
 * 4. Elbow Method (Within-Cluster Sum of Squares - WCSS)
 * 5. Persona Mapping and Marketing Strategy Generator
 */

const { getDb } = require('../db/database');

/**
 * 1. Extract RFM metrics for all registered users
 */
function extractRFMMetrics() {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at,
      COUNT(DISTINCT o.id) as frequency,
      COALESCE(SUM(o.total), 0) as monetary,
      MAX(o.created_at) as last_order_date
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.role = 'customer'
    GROUP BY u.id
  `).all();

  const now = new Date();

  return users.map(u => {
    let recencyDays = 999;
    if (u.last_order_date) {
      const diffMs = now - new Date(u.last_order_date);
      recencyDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      const accountAgeMs = now - new Date(u.created_at);
      recencyDays = Math.max(0, Math.floor(accountAgeMs / (1000 * 60 * 60 * 24)));
    }

    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      recency: recencyDays,
      frequency: u.frequency,
      monetary: Math.round(u.monetary)
    };
  });
}

/**
 * Math utility: Euclidean Distance in N-dimensional space
 */
function euclideanDistance(pointA, pointB) {
  let sum = 0;
  for (let i = 0; i < pointA.length; i++) {
    const diff = pointA[i] - pointB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * 2. K-Means Clustering Algorithm (Custom Pure JS Implementation)
 */
function runKMeans(dataPoints, k = 4, maxIterations = 100) {
  if (dataPoints.length === 0) return { centroids: [], clusters: [], wcss: 0 };
  if (dataPoints.length < k) k = dataPoints.length;

  const numFeatures = dataPoints[0].length;

  // Feature Scaling: Min-Max Normalization to [0, 1]
  const mins = Array(numFeatures).fill(Infinity);
  const maxs = Array(numFeatures).fill(-Infinity);

  for (const point of dataPoints) {
    for (let f = 0; f < numFeatures; f++) {
      if (point[f] < mins[f]) mins[f] = point[f];
      if (point[f] > maxs[f]) maxs[f] = point[f];
    }
  }

  const normalizedPoints = dataPoints.map(point =>
    point.map((val, f) => (maxs[f] === mins[f] ? 0.5 : (val - mins[f]) / (maxs[f] - mins[f])))
  );

  // Initialize Centroids using deterministic spread (k-means++ style)
  let centroids = [];
  centroids.push([...normalizedPoints[0]]);

  while (centroids.length < k) {
    let farthestPoint = normalizedPoints[0];
    let maxMinDist = -1;

    for (const p of normalizedPoints) {
      const minDist = Math.min(...centroids.map(c => euclideanDistance(p, c)));
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        farthestPoint = p;
      }
    }
    centroids.push([...farthestPoint]);
  }

  // Iterative Optimization (Expectation-Maximization)
  let assignments = new Array(normalizedPoints.length).fill(0);
  let iteration = 0;
  let hasChanged = true;

  while (hasChanged && iteration < maxIterations) {
    hasChanged = false;
    iteration++;

    // Step 1: Assign each point to nearest centroid
    for (let i = 0; i < normalizedPoints.length; i++) {
      const point = normalizedPoints[i];
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let c = 0; c < k; c++) {
        const dist = euclideanDistance(point, centroids[c]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = c;
        }
      }

      if (assignments[i] !== closestIdx) {
        assignments[i] = closestIdx;
        hasChanged = true;
      }
    }

    // Step 2: Re-calculate centroids
    const clusterSums = Array.from({ length: k }, () => new Array(numFeatures).fill(0));
    const clusterCounts = new Array(k).fill(0);

    for (let i = 0; i < normalizedPoints.length; i++) {
      const cluster = assignments[i];
      clusterCounts[cluster]++;
      for (let f = 0; f < numFeatures; f++) {
        clusterSums[cluster][f] += normalizedPoints[i][f];
      }
    }

    for (let c = 0; c < k; c++) {
      if (clusterCounts[c] > 0) {
        for (let f = 0; f < numFeatures; f++) {
          centroids[c][f] = clusterSums[c][f] / clusterCounts[c];
        }
      }
    }
  }

  // Calculate WCSS (Within-Cluster Sum of Squares)
  let wcss = 0;
  for (let i = 0; i < normalizedPoints.length; i++) {
    const cluster = assignments[i];
    const dist = euclideanDistance(normalizedPoints[i], centroids[cluster]);
    wcss += dist * dist;
  }

  // Denormalize centroids back to original feature scale
  const originalScaleCentroids = centroids.map(c =>
    c.map((normVal, f) => (maxs[f] === mins[f] ? mins[f] : normVal * (maxs[f] - mins[f]) + mins[f]))
  );

  return {
    k,
    iterations: iteration,
    wcss: Math.round(wcss * 100) / 100,
    centroids: originalScaleCentroids,
    assignments
  };
}

/**
 * 3. Perform Customer Segmentation with Persona Mapping
 */
function getCustomerSegmentation(k = 4) {
  const rfmList = extractRFMMetrics();
  if (rfmList.length === 0) return { clusters: [], summary: {} };

  // Feature vectors: [Recency, Frequency, Monetary]
  const dataPoints = rfmList.map(u => [u.recency, u.frequency, u.monetary]);

  const clusteringResult = runKMeans(dataPoints, k);

  // Persona classification rules based on cluster centroids
  const personaTemplates = [
    {
      type: 'Champions & VIPs',
      badge: '👑 Champion',
      color: '#10b981',
      description: 'High-value frequent shoppers with very recent purchases. Top revenue drivers.',
      strategy: 'VIP perks, early access to new seasonal products, exclusive loyalty rewards.'
    },
    {
      type: 'Loyal Regulars',
      badge: '⭐ Loyal',
      color: '#3b82f6',
      description: 'Consistent weekly grocery shoppers with stable basket sizes.',
      strategy: 'Subscription offers, free delivery bundles, volume discounts on pantry staples.'
    },
    {
      type: 'Potential & Budget',
      badge: '🌱 Budget/Growth',
      color: '#f59e0b',
      description: 'Price-conscious shoppers or newer accounts with low-to-moderate order counts.',
      strategy: 'Discount coupons on high-margin items, seasonal bundle deals, free delivery over ₹500.'
    },
    {
      type: 'At-Risk / Lapsed',
      badge: '⚠️ At-Risk',
      color: '#ef4444',
      description: 'Previously active customers who have not placed an order in over 60 days.',
      strategy: 'Win-back campaigns, personalized "We Miss You" ₹100 discount coupon.'
    }
  ];

  // Map each cluster to the most fitting persona
  const clusterProfiles = clusteringResult.centroids.map((c, idx) => {
    const recency = Math.round(c[0]);
    const frequency = Math.round(c[1]);
    const monetary = Math.round(c[2]);

    // Match persona based on centroid characteristics
    let personaIndex = 0;
    if (monetary > 5000 && frequency > 15 && recency < 30) {
      personaIndex = 0; // Champion
    } else if (frequency > 8 && recency < 45) {
      personaIndex = 1; // Loyal
    } else if (recency > 50) {
      personaIndex = 3; // At-Risk
    } else {
      personaIndex = 2; // Budget/Growth
    }

    const template = personaTemplates[personaIndex] || personaTemplates[idx % personaTemplates.length];

    return {
      clusterId: idx,
      persona: template.type,
      badge: template.badge,
      color: template.color,
      description: template.description,
      recommendedStrategy: template.strategy,
      averageRecencyDays: recency,
      averageFrequency: frequency,
      averageMonetary: monetary,
      members: []
    };
  });

  // Assign members to clusters
  rfmList.forEach((user, i) => {
    const clusterId = clusteringResult.assignments[i];
    if (clusterProfiles[clusterId]) {
      clusterProfiles[clusterId].members.push({
        userId: user.userId,
        name: user.name,
        email: user.email,
        recency: user.recency,
        frequency: user.frequency,
        monetary: user.monetary
      });
    }
  });

  // Add member count and percentage
  const totalUsers = rfmList.length;
  clusterProfiles.forEach(cp => {
    cp.memberCount = cp.members.length;
    cp.percentageOfTotal = Math.round((cp.memberCount / totalUsers) * 100) + '%';
  });

  // Compute Elbow Method WCSS curve for k=2..6
  const elbowCurve = [];
  for (let testK = 2; testK <= Math.min(6, dataPoints.length); testK++) {
    const res = runKMeans(dataPoints, testK);
    elbowCurve.push({ k: testK, wcss: res.wcss });
  }

  return {
    algorithm: 'K-Means Clustering + RFM (Recency, Frequency, Monetary)',
    totalCustomersEvaluated: totalUsers,
    optimalK: k,
    wcss: clusteringResult.wcss,
    iterations: clusteringResult.iterations,
    elbowCurve,
    clusters: clusterProfiles
  };
}

module.exports = {
  extractRFMMetrics,
  runKMeans,
  getCustomerSegmentation
};
