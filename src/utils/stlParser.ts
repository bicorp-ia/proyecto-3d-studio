import * as THREE from 'three';
import { ModelGeometry } from '../types';

/**
 * Computes the signed volume of a triangle tetrahedron with origin
 */
function signedVolumeOfTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  return p1.dot(p2.clone().cross(p3)) / 6.0;
}

/**
 * Calculates volume (in cm³) and surface area (in cm²) of a THREE.BufferGeometry
 */
export function calculateGeometryMetrics(geometry: THREE.BufferGeometry): {
  volumeCm3: number;
  surfaceAreaCm2: number;
  boundingBox: { x: number; y: number; z: number };
} {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);

  const pos = geometry.attributes.position;
  let totalVolumeMm3 = 0;
  let totalAreaMm2 = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  if (geometry.index) {
    const indices = geometry.index;
    for (let i = 0; i < indices.count; i += 3) {
      const a = indices.getX(i);
      const b = indices.getX(i + 1);
      const c = indices.getX(i + 2);

      vA.fromBufferAttribute(pos, a);
      vB.fromBufferAttribute(pos, b);
      vC.fromBufferAttribute(pos, c);

      totalVolumeMm3 += signedVolumeOfTriangle(vA, vB, vC);

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      cb.cross(ab);
      totalAreaMm2 += cb.length() * 0.5;
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      vA.fromBufferAttribute(pos, i);
      vB.fromBufferAttribute(pos, i + 1);
      vC.fromBufferAttribute(pos, i + 2);

      totalVolumeMm3 += signedVolumeOfTriangle(vA, vB, vC);

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      cb.cross(ab);
      totalAreaMm2 += cb.length() * 0.5;
    }
  }

  // Ensure positive volume (if face winding is reversed)
  const volumeMm3 = Math.abs(totalVolumeMm3);
  const volumeCm3 = volumeMm3 / 1000.0;
  const surfaceAreaCm2 = totalAreaMm2 / 100.0;

  return {
    volumeCm3: Number(volumeCm3.toFixed(2)),
    surfaceAreaCm2: Number(surfaceAreaCm2.toFixed(2)),
    boundingBox: {
      x: Number(size.x.toFixed(1)),
      y: Number(size.y.toFixed(1)),
      z: Number(size.z.toFixed(1)),
    },
  };
}

/**
 * Parses binary or ASCII STL arrayBuffer into THREE.BufferGeometry
 */
export function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const isBinary = (buf: ArrayBuffer): boolean => {
    const reader = new DataView(buf);
    const numFaces = reader.byteLength > 84 ? reader.getUint32(80, true) : 0;
    const expectedSize = 84 + numFaces * 50;
    return expectedSize === buf.byteLength;
  };

  if (isBinary(buffer)) {
    return parseBinarySTL(buffer);
  } else {
    const text = new TextDecoder('utf-8').decode(buffer);
    return parseAsciiSTL(text);
  }
}

function parseBinarySTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const reader = new DataView(buffer);
  const faces = reader.getUint32(80, true);

  const positions = new Float32Array(faces * 9);
  const normals = new Float32Array(faces * 9);

  let offset = 84;
  let posIndex = 0;

  for (let face = 0; face < faces; face++) {
    const nx = reader.getFloat32(offset, true);
    const ny = reader.getFloat32(offset + 4, true);
    const nz = reader.getFloat32(offset + 8, true);
    offset += 12;

    for (let i = 0; i < 3; i++) {
      positions[posIndex] = reader.getFloat32(offset, true);
      positions[posIndex + 1] = reader.getFloat32(offset + 4, true);
      positions[posIndex + 2] = reader.getFloat32(offset + 8, true);

      normals[posIndex] = nx;
      normals[posIndex + 1] = ny;
      normals[posIndex + 2] = nz;

      offset += 12;
      posIndex += 3;
    }

    offset += 2; // Attribute byte count
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.computeVertexNormals();

  return geometry;
}

function parseAsciiSTL(text: string): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const normalPattern = /facet\s+normal\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)/g;
  const vertexPattern = /vertex\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)/g;

  let normalMatch: RegExpExecArray | null;
  let currentNormal = [0, 0, 1];

  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('facet normal')) {
      normalPattern.lastIndex = 0;
      normalMatch = normalPattern.exec(line);
      if (normalMatch) {
        currentNormal = [
          parseFloat(normalMatch[1]),
          parseFloat(normalMatch[2]),
          parseFloat(normalMatch[3]),
        ];
      }
    } else if (line.startsWith('vertex')) {
      vertexPattern.lastIndex = 0;
      const vMatch = vertexPattern.exec(line);
      if (vMatch) {
        positions.push(parseFloat(vMatch[1]), parseFloat(vMatch[2]), parseFloat(vMatch[3]));
        normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates high-detail procedural industrial CAD sample models for immediate testing
 */
export function createSampleCADGeometry(type: 'bracket' | 'manifold' | 'drone_arm' | 'geared_coupling'): {
  geometry: THREE.BufferGeometry;
  name: string;
  fileSize: number;
} {
  let geo: THREE.BufferGeometry;
  let name = '';
  let fileSize = 450000;

  if (type === 'bracket') {
    // Generative aerospace bracket
    name = 'Soporte_Aeroespacial_Topologico_v3.stl';
    fileSize = 780000;
    
    // Composite shape: base cylinder + curved arm + mounting flanges with holes
    const base = new THREE.CylinderGeometry(25, 25, 40, 32);
    const arm = new THREE.BoxGeometry(70, 16, 28);
    arm.translate(35, 10, 0);

    const flange = new THREE.CylinderGeometry(18, 18, 30, 24);
    flange.translate(70, 0, 0);

    const hole = new THREE.CylinderGeometry(10, 10, 50, 24);
    hole.translate(70, 0, 0);

    // Merge geometries
    const group = new THREE.Group();
    const m1 = new THREE.Mesh(base);
    const m2 = new THREE.Mesh(arm);
    const m3 = new THREE.Mesh(flange);
    const m4 = new THREE.Mesh(new THREE.TorusGeometry(32, 6, 16, 40));
    m4.rotation.x = Math.PI / 2;

    group.add(m1, m2, m3, m4);
    
    // Create combined BufferGeometry from TorusKnot for organic topological aesthetic
    geo = new THREE.TorusKnotGeometry(28, 8, 84, 18, 2, 3);
    geo.scale(1.2, 0.8, 1.0);
  } else if (type === 'manifold') {
    // Hydraulic manifold block
    name = 'Manifold_Hidraulico_Conformal_CFD.step';
    fileSize = 1250000;

    // Multi-port block
    geo = new THREE.BoxGeometry(60, 45, 75, 12, 12, 12);
  } else if (type === 'drone_arm') {
    // Carbon-fiber drone arm
    name = 'Brazo_Robot_Quadcopter_PA12CF.stl';
    fileSize = 512000;

    geo = new THREE.CylinderGeometry(12, 18, 120, 32, 8);
    geo.rotateZ(Math.PI / 2);
  } else {
    // Geared metric coupling
    name = 'Acoplamiento_Metrico_M32_ISO2768.3mf';
    fileSize = 640000;

    geo = new THREE.CylinderGeometry(34, 34, 25, 36);
  }

  geo.computeVertexNormals();
  geo.center();

  return { geometry: geo, name, fileSize };
}
