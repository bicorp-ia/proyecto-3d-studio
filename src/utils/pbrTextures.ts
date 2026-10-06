import * as THREE from 'three';
import { TechnologyType } from '../types';

let fdmLayerTextureCache: THREE.CanvasTexture | null = null;
let slsPowderTextureCache: THREE.CanvasTexture | null = null;
let cncBrushedTextureCache: THREE.CanvasTexture | null = null;

/**
 * Generates procedural horizontal layer lines texture for FDM materials
 */
export function getFdmLayerTexture(): THREE.CanvasTexture {
  if (fdmLayerTextureCache) return fdmLayerTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  // Draw subtle repetitive horizontal layer line micro-grooves
  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = '#606060';
    ctx.fillRect(0, y, 128, 1.5);
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, y + 1.5, 128, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 24);
  fdmLayerTextureCache = texture;
  return texture;
}

/**
 * Generates procedural fine matte powder stipple texture for SLS / MJF
 */
export function getSlsPowderTexture(): THREE.CanvasTexture {
  if (slsPowderTextureCache) return slsPowderTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  const imgData = ctx.getImageData(0, 0, 128, 128);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 32;
    const v = Math.min(255, Math.max(0, 128 + noise));
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  slsPowderTextureCache = texture;
  return texture;
}

/**
 * Generates procedural brushed metal toolmarks texture for CNC
 */
export function getCncBrushedTexture(): THREE.CanvasTexture {
  if (cncBrushedTextureCache) return cncBrushedTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Concentric spiral toolpaths
  ctx.strokeStyle = 'rgba(210, 210, 210, 0.25)';
  ctx.lineWidth = 1;
  for (let r = 10; r < 200; r += 6) {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  cncBrushedTextureCache = texture;
  return texture;
}

/**
 * Creates realistic Physically Based Rendering (PBR) material based on manufacturing technology
 */
export function createPbrMaterial(
  technology: TechnologyType,
  baseColorHex: string,
  viewMode: 'solid' | 'wireframe' | 'xray' | 'layers' | 'heatmap',
  clipPlanes: THREE.Plane[] = []
): THREE.Material {
  const color = new THREE.Color(baseColorHex);

  // 1. DFAM Heatmap Mode: uses vertex colors
  if (viewMode === 'heatmap') {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.1,
      clippingPlanes: clipPlanes,
      side: THREE.DoubleSide,
    });
  }

  // 2. Wireframe Mode
  if (viewMode === 'wireframe') {
    return new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
  }

  // 3. X-Ray Radiography Mode
  if (viewMode === 'xray') {
    return new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.75,
      ior: 1.5,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  // 4. Technology-specific PBR simulations
  switch (technology) {
    case 'fdm': {
      // FDM: plastic with subtle layer line bump map
      const layerBump = getFdmLayerTexture();
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.05,
        bumpMap: layerBump,
        bumpScale: 0.04,
        clippingPlanes: clipPlanes,
        side: THREE.DoubleSide,
      });
    }

    case 'sla': {
      // SLA Resina: translucent optical depth with subsurface look
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.15,
        metalness: 0.08,
        transmission: 0.7,
        ior: 1.52,
        thickness: 1.5,
        specularIntensity: 0.9,
        transparent: true,
        opacity: 0.88,
        clippingPlanes: clipPlanes,
        side: THREE.DoubleSide,
      });
    }

    case 'sls': {
      // SLS / MJF: fine grainy matte powder finish
      const powderBump = getSlsPowderTexture();
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.88,
        metalness: 0.02,
        bumpMap: powderBump,
        bumpScale: 0.03,
        clippingPlanes: clipPlanes,
        side: THREE.DoubleSide,
      });
    }

    case 'cnc': {
      // CNC 5-Axis: mirror chamfers and brushed metallic reflections
      const brushedBump = getCncBrushedTexture();
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.22,
        metalness: 0.95,
        bumpMap: brushedBump,
        bumpScale: 0.02,
        clippingPlanes: clipPlanes,
        side: THREE.DoubleSide,
      });
    }

    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.1,
        clippingPlanes: clipPlanes,
        side: THREE.DoubleSide,
      });
  }
}
