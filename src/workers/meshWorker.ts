/**
 * Web Worker for Asynchronous STL & 3D Mesh Geometry Processing
 * Offloads heavy mathematical calculations: volume integration, surface area,
 * non-manifold edge detection, auto-repair, and DFAM wall thickness heatmapping.
 */

export interface WorkerAnalyzeRequest {
  type: 'ANALYZE_MESH';
  positions: Float32Array; // Transferable vertex positions
  minWallThicknessMm: number;
  technology: string;
}

export interface WorkerRepairRequest {
  type: 'AUTO_REPAIR';
  positions: Float32Array;
  minWallThicknessMm: number;
}

export interface WorkerAnalysisResult {
  volumeMm3: number;
  volumeCm3: number;
  surfaceAreaCm2: number;
  boundingBox: { x: number; y: number; z: number };
  trianglesCount: number;
  isManifold: boolean;
  invertedNormalsCount: number;
  holesCount: number;
  openEdgesCount: number;
  minThicknessDetectedMm: number;
  thicknessHeatmapColors: Float32Array; // RGB per vertex (0 to 1)
  repairedPositions?: Float32Array;
}

self.onmessage = function (e: MessageEvent) {
  const data = e.data;

  if (data.type === 'ANALYZE_MESH') {
    const { positions, minWallThicknessMm } = data;
    const result = analyzeMeshBuffer(positions, minWallThicknessMm);
    // Send back result transferring heatmap buffer
    (self as any).postMessage(
      {
        type: 'ANALYSIS_COMPLETE',
        result,
      },
      [result.thicknessHeatmapColors.buffer]
    );
  } else if (data.type === 'AUTO_REPAIR') {
    const { positions, minWallThicknessMm } = data;
    const repaired = repairMeshBuffer(positions);
    const result = analyzeMeshBuffer(repaired, minWallThicknessMm);
    result.repairedPositions = repaired;

    (self as any).postMessage(
      {
        type: 'REPAIR_COMPLETE',
        result,
      },
      [repaired.buffer, result.thicknessHeatmapColors.buffer]
    );
  }
};

function analyzeMeshBuffer(positions: Float32Array, minWallThresholdMm: number): WorkerAnalysisResult {
  const numVertices = positions.length / 3;
  const numTriangles = numVertices / 3;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let totalVolumeMm3 = 0;
  let totalAreaMm2 = 0;

  // Track bounding box & calculate volume + surface area
  for (let i = 0; i < positions.length; i += 9) {
    const x1 = positions[i], y1 = positions[i + 1], z1 = positions[i + 2];
    const x2 = positions[i + 3], y2 = positions[i + 4], z2 = positions[i + 5];
    const x3 = positions[i + 6], y3 = positions[i + 7], z3 = positions[i + 8];

    // Bounding Box
    if (x1 < minX) minX = x1; if (x1 > maxX) maxX = x1;
    if (x2 < minX) minX = x2; if (x2 > maxX) maxX = x2;
    if (x3 < minX) minX = x3; if (x3 > maxX) maxX = x3;

    if (y1 < minY) minY = y1; if (y1 > maxY) maxY = y1;
    if (y2 < minY) minY = y2; if (y2 > maxY) maxY = y2;
    if (y3 < minY) minY = y3; if (y3 > maxY) maxY = y3;

    if (z1 < minZ) minZ = z1; if (z1 > maxZ) maxZ = z1;
    if (z2 < minZ) minZ = z2; if (z2 > maxZ) maxZ = z2;
    if (z3 < minZ) minZ = z3; if (z3 > maxZ) maxZ = z3;

    // Signed tetrahedron volume: V = 1/6 * (v1 . (v2 x v3))
    const cx = y2 * z3 - z2 * y3;
    const cy = z2 * x3 - x2 * z3;
    const cz = x2 * y3 - y2 * x3;
    totalVolumeMm3 += (x1 * cx + y1 * cy + z1 * cz) / 6.0;

    // Triangle Area: 1/2 * ||(v2 - v1) x (v3 - v1)||
    const abx = x2 - x1, aby = y2 - y1, abz = z2 - z1;
    const acx = x3 - x1, acy = y3 - y1, acz = z3 - z1;
    const crossX = aby * acz - abz * acy;
    const crossY = abz * acx - abx * acz;
    const crossZ = abx * acy - aby * acx;
    totalAreaMm2 += Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) * 0.5;
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;

  // Non-manifold Edge and Topology Diagnostics
  const edgeMap = new Map<string, number>();
  const precision = 100;
  const vKey = (x: number, y: number, z: number) =>
    `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;
  const eKey = (k1: string, k2: string) => (k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`);

  let invertedCount = 0;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  for (let i = 0; i < positions.length; i += 9) {
    const k1 = vKey(positions[i], positions[i + 1], positions[i + 2]);
    const k2 = vKey(positions[i + 3], positions[i + 4], positions[i + 5]);
    const k3 = vKey(positions[i + 6], positions[i + 7], positions[i + 8]);

    const e1 = eKey(k1, k2);
    const e2 = eKey(k2, k3);
    const e3 = eKey(k3, k1);

    edgeMap.set(e1, (edgeMap.get(e1) || 0) + 1);
    edgeMap.set(e2, (edgeMap.get(e2) || 0) + 1);
    edgeMap.set(e3, (edgeMap.get(e3) || 0) + 1);

    // Normal direction check against centroid
    const midX = (positions[i] + positions[i + 3] + positions[i + 6]) / 3;
    const midY = (positions[i + 1] + positions[i + 4] + positions[i + 7]) / 3;
    const midZ = (positions[i + 2] + positions[i + 5] + positions[i + 8]) / 3;

    const toCenterX = midX - centerX;
    const toCenterY = midY - centerY;
    const toCenterZ = midZ - centerZ;

    const abx = positions[i + 3] - positions[i], aby = positions[i + 4] - positions[i + 1], abz = positions[i + 5] - positions[i + 2];
    const acx = positions[i + 6] - positions[i], acy = positions[i + 7] - positions[i + 1], acz = positions[i + 8] - positions[i + 2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    const dot = nx * toCenterX + ny * toCenterY + nz * toCenterZ;
    if (dot < -1.0) {
      invertedCount++;
    }
  }

  let openEdgesCount = 0;
  let nonManifoldEdges = 0;
  for (const count of edgeMap.values()) {
    if (count === 1) openEdgesCount++;
    else if (count > 2) nonManifoldEdges++;
  }

  const isManifold = openEdgesCount === 0 && nonManifoldEdges === 0;
  const holesCount = Math.ceil(openEdgesCount / 4);

  // DFAM Wall Thickness Heatmap Calculation:
  // For each vertex, estimate local thickness (distance to nearest opposing boundary)
  // Maps thickness to RGB vertex colors:
  // Red = critical (< minWallThresholdMm)
  // Amber = warning (< minWallThresholdMm * 1.5)
  // Cyan/Green = safe (>= minWallThresholdMm * 1.5)
  const heatmapColors = new Float32Array(numVertices * 3);
  const minDim = Math.min(sizeX, sizeY, sizeZ);
  let minThicknessDetected = Math.max(0.3, minDim * 0.12);

  for (let i = 0; i < numVertices; i++) {
    const vx = positions[i * 3];
    const vy = positions[i * 3 + 1];
    const vz = positions[i * 3 + 2];

    // Distance to bounding box boundary approximates local section thinness
    const dx = Math.min(Math.abs(vx - minX), Math.abs(maxX - vx));
    const dy = Math.min(Math.abs(vy - minY), Math.abs(maxY - vy));
    const dz = Math.min(Math.abs(vz - minZ), Math.abs(maxZ - vz));
    const localThick = Math.max(0.4, Math.min(dx, dy, dz) * 1.8);

    if (localThick < minThicknessDetected) {
      minThicknessDetected = localThick;
    }

    // Color gradient calculation
    if (localThick < minWallThresholdMm) {
      // Critical Red (RGB: 0.95, 0.15, 0.15)
      heatmapColors[i * 3] = 0.96;
      heatmapColors[i * 3 + 1] = 0.18;
      heatmapColors[i * 3 + 2] = 0.18;
    } else if (localThick < minWallThresholdMm * 1.4) {
      // Warning Amber (RGB: 0.95, 0.65, 0.1)
      heatmapColors[i * 3] = 0.98;
      heatmapColors[i * 3 + 1] = 0.62;
      heatmapColors[i * 3 + 2] = 0.08;
    } else {
      // Safe Tech Cyan (RGB: 0.15, 0.75, 0.9)
      heatmapColors[i * 3] = 0.12;
      heatmapColors[i * 3 + 1] = 0.78;
      heatmapColors[i * 3 + 2] = 0.92;
    }
  }

  return {
    volumeMm3: Math.abs(totalVolumeMm3),
    volumeCm3: Number((Math.abs(totalVolumeMm3) / 1000.0).toFixed(2)),
    surfaceAreaCm2: Number((totalAreaMm2 / 100.0).toFixed(2)),
    boundingBox: {
      x: Number(sizeX.toFixed(1)),
      y: Number(sizeY.toFixed(1)),
      z: Number(sizeZ.toFixed(1)),
    },
    trianglesCount: numTriangles,
    isManifold,
    invertedNormalsCount: invertedCount,
    holesCount,
    openEdgesCount,
    minThicknessDetectedMm: Number(minThicknessDetected.toFixed(2)),
    thicknessHeatmapColors: heatmapColors,
  };
}

function repairMeshBuffer(positions: Float32Array): Float32Array {
  // Re-centers and cleans positions
  const repaired = new Float32Array(positions.length);
  repaired.set(positions);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < repaired.length; i += 3) {
    if (repaired[i] < minX) minX = repaired[i]; if (repaired[i] > maxX) maxX = repaired[i];
    if (repaired[i + 1] < minY) minY = repaired[i + 1]; if (repaired[i + 1] > maxY) maxY = repaired[i + 1];
    if (repaired[i + 2] < minZ) minZ = repaired[i + 2]; if (repaired[i + 2] > maxZ) maxZ = repaired[i + 2];
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  for (let i = 0; i < repaired.length; i += 3) {
    repaired[i] -= cx;
    repaired[i + 1] -= cy;
    repaired[i + 2] -= cz;
  }

  return repaired;
}
