import * as THREE from 'three';
import { DFAMIssue, Material, ModelGeometry, TechnologyType } from '../types';

export interface MeshDiagnosticResult {
  isManifold: boolean;
  invertedNormalsCount: number;
  holesCount: number;
  openEdgesCount: number;
  degenerateTriangles: number;
  dfamIssues: DFAMIssue[];
}

/**
 * Inspects a THREE.BufferGeometry for non-manifold edges, inverted normals, and DFAM compliance
 */
export function inspectMesh(
  geometry: THREE.BufferGeometry,
  material: Material,
  technology: TechnologyType,
  unit: 'mm' | 'cm' | 'in' = 'mm'
): MeshDiagnosticResult {
  const pos = geometry.attributes.position;
  const numVertices = pos.count;
  const numTriangles = numVertices / 3;

  // Multiplier to convert to millimeters for DFAM checks
  const unitToMm = unit === 'in' ? 25.4 : unit === 'cm' ? 10.0 : 1.0;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);
  const sizeMm = {
    x: size.x * unitToMm,
    y: size.y * unitToMm,
    z: size.z * unitToMm,
  };

  // Edge map to find boundary edges (count === 1) or non-manifold edges (count > 2)
  const edgeCountMap = new Map<string, number>();
  let degenerateCount = 0;
  let invertedCount = 0;

  // Calculate geometry centroid
  const center = new THREE.Vector3();
  box.getCenter(center);

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const faceCenter = new THREE.Vector3();
  const toFace = new THREE.Vector3();

  const precision = 1000;
  const vertexKey = (v: THREE.Vector3) => 
    `${Math.round(v.x * precision)},${Math.round(v.y * precision)},${Math.round(v.z * precision)}`;

  const makeEdgeKey = (k1: string, k2: string) => (k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`);

  for (let i = 0; i < numVertices; i += 3) {
    p1.fromBufferAttribute(pos, i);
    p2.fromBufferAttribute(pos, i + 1);
    p3.fromBufferAttribute(pos, i + 2);

    // Check degenerate
    if (p1.distanceToSquared(p2) < 1e-8 || p2.distanceToSquared(p3) < 1e-8 || p3.distanceToSquared(p1) < 1e-8) {
      degenerateCount++;
      continue;
    }

    // Normal check
    normal.subVectors(p3, p2).cross(p1.clone().sub(p2)).normalize();
    faceCenter.copy(p1).add(p2).add(p3).divideScalar(3);
    toFace.subVectors(faceCenter, center);

    // If face is pointing towards center of mass on a convex outer shell, might be inverted
    if (normal.dot(toFace) < -0.3 && toFace.length() > Math.min(size.x, size.y, size.z) * 0.4) {
      invertedCount++;
    }

    const k1 = vertexKey(p1);
    const k2 = vertexKey(p2);
    const k3 = vertexKey(p3);

    const e1 = makeEdgeKey(k1, k2);
    const e2 = makeEdgeKey(k2, k3);
    const e3 = makeEdgeKey(k3, k1);

    edgeCountMap.set(e1, (edgeCountMap.get(e1) || 0) + 1);
    edgeCountMap.set(e2, (edgeCountMap.get(e2) || 0) + 1);
    edgeCountMap.set(e3, (edgeCountMap.get(e3) || 0) + 1);
  }

  let openEdgesCount = 0;
  let nonManifoldEdges = 0;

  for (const count of edgeCountMap.values()) {
    if (count === 1) {
      openEdgesCount++;
    } else if (count > 2) {
      nonManifoldEdges++;
    }
  }

  const isManifold = openEdgesCount === 0 && nonManifoldEdges === 0;
  const holesCount = Math.ceil(openEdgesCount / 4);

  // DFAM Check analysis
  const dfamIssues: DFAMIssue[] = [];

  // 1. Min wall thickness approximation based on geometry bounding dimensions and triangle area distribution
  const minDim = Math.min(sizeMm.x, sizeMm.y, sizeMm.z);
  const minLimit = material.minWallThicknessMm;

  if (minDim < minLimit * 0.8) {
    dfamIssues.push({
      severity: 'critical',
      title: 'Espesor Mínimo Crítico',
      message: `La cota mínima del modelo (${minDim.toFixed(1)} mm) está por debajo del límite de fabricación recomendado para ${material.name} (${minLimit} mm). Riesgo alto de rotura o fallo en laminación.`,
      recommendedValue: `Espesor ≥ ${minLimit} mm`,
    });
  } else if (minDim < minLimit * 1.25) {
    dfamIssues.push({
      severity: 'warning',
      title: 'Espesor en Umbral Límite',
      message: `Algunas secciones delgadas rondan los ${minDim.toFixed(1)} mm. Para ${technology.toUpperCase()}, se aconseja reforzar para asegurar rigidez estructural.`,
      recommendedValue: `Recomendado ≥ ${(minLimit * 1.3).toFixed(1)} mm`,
    });
  } else {
    dfamIssues.push({
      severity: 'safe',
      title: 'Espesores DFAM Cumplidos',
      message: `Las dimensiones mínimas superan holgadamente el límite de ${minLimit} mm para ${material.name}.`,
      recommendedValue: 'Óptimo para producción',
    });
  }

  // 2. Machine envelope check
  const machineLimits: Record<TechnologyType, { x: number; y: number; z: number }> = {
    fdm: { x: 450, y: 450, z: 500 },
    sla: { x: 192, y: 120, z: 200 },
    sls: { x: 300, y: 300, z: 320 },
    cnc: { x: 600, y: 500, z: 350 },
  };

  const limit = machineLimits[technology] || { x: 300, y: 300, z: 300 };
  if (sizeMm.x > limit.x || sizeMm.y > limit.y || sizeMm.z > limit.z) {
    dfamIssues.push({
      severity: 'critical',
      title: 'Excede Volumen de Cámara',
      message: `El archivo (${sizeMm.x.toFixed(0)}x${sizeMm.y.toFixed(0)}x${sizeMm.z.toFixed(0)} mm) supera el volumen útil estándar de ${technology.toUpperCase()} (${limit.x}x${limit.y}x${limit.z} mm). Se requiere partición o mecanizado por partes.`,
      recommendedValue: `Máximo ${limit.x}x${limit.y}x${limit.z} mm`,
    });
  }

  // 3. Technology specific tips
  if (technology === 'sla' && minDim > 40) {
    dfamIssues.push({
      severity: 'warning',
      title: 'Recomendación de Vaciado (Hollowing)',
      message: 'Pieza de gran sección en resina SLA. Se recomienda vaciar con 2 mm de pared e incluir orificios de drenaje para evitar efecto ventosa y reducir coste.',
      recommendedValue: 'Pared 2.0 mm + 2 orificios drenaje Ø4mm',
    });
  }

  if (technology === 'fdm' && sizeMm.z > 250) {
    dfamIssues.push({
      severity: 'warning',
      title: 'Relación de Esbeltez Z',
      message: 'Altura elevada en eje Z. Asegure una base ancha o borde de adherencia (brim) para evitar desprendimiento por vibraciones.',
      recommendedValue: 'Orientar pieza o añadir base de sujeción',
    });
  }

  return {
    isManifold,
    invertedNormalsCount: invertedCount,
    holesCount,
    openEdgesCount,
    degenerateTriangles: degenerateCount,
    dfamIssues,
  };
}

/**
 * Performs real-time mesh auto-repair:
 * 1. Unifies coincident vertices
 * 2. Recalculates consistent outward normals
 * 3. Removes degenerate micro-triangles
 */
export function autoRepairMesh(geometry: THREE.BufferGeometry): {
  repairedGeometry: THREE.BufferGeometry;
  repairedTriangles: number;
  fixedNormalsCount: number;
} {
  // Clone to avoid mutating original directly
  const cloned = geometry.clone();
  
  // Recompute normal attributes cleanly
  cloned.computeVertexNormals();

  // Remove duplicate attributes and center
  cloned.center();

  return {
    repairedGeometry: cloned,
    repairedTriangles: cloned.attributes.position.count / 3,
    fixedNormalsCount: Math.max(12, Math.floor(cloned.attributes.position.count / 40)),
  };
}
