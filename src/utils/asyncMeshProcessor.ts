import * as THREE from 'three';
import { WorkerAnalysisResult } from '../workers/meshWorker';

let activeWorker: Worker | null = null;

function getWorker(): Worker {
  if (!activeWorker) {
    activeWorker = new Worker(new URL('../workers/meshWorker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return activeWorker;
}

/**
 * Analyzes geometry asynchronously in a Web Worker to avoid freezing the main UI thread
 */
export function analyzeMeshAsync(
  geometry: THREE.BufferGeometry,
  minWallThicknessMm: number,
  technology: string
): Promise<WorkerAnalysisResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker();
      const posAttr = geometry.attributes.position;
      // Copy array so we don't detach main thread buffer
      const positionsCopy = new Float32Array(posAttr.array);

      const handler = (e: MessageEvent) => {
        if (e.data.type === 'ANALYSIS_COMPLETE') {
          worker.removeEventListener('message', handler);
          resolve(e.data.result);
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage(
        {
          type: 'ANALYZE_MESH',
          positions: positionsCopy,
          minWallThicknessMm,
          technology,
        },
        [positionsCopy.buffer]
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Auto-repairs mesh asynchronously in a Web Worker
 */
export function autoRepairMeshAsync(
  geometry: THREE.BufferGeometry,
  minWallThicknessMm: number
): Promise<{ repairedGeometry: THREE.BufferGeometry; result: WorkerAnalysisResult }> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker();
      const posAttr = geometry.attributes.position;
      const positionsCopy = new Float32Array(posAttr.array);

      const handler = (e: MessageEvent) => {
        if (e.data.type === 'REPAIR_COMPLETE') {
          worker.removeEventListener('message', handler);
          const result: WorkerAnalysisResult = e.data.result;

          const repairedGeo = new THREE.BufferGeometry();
          if (result.repairedPositions) {
            repairedGeo.setAttribute('position', new THREE.BufferAttribute(result.repairedPositions, 3));
          } else {
            repairedGeo.setAttribute('position', posAttr.clone());
          }
          repairedGeo.computeVertexNormals();

          resolve({ repairedGeometry: repairedGeo, result });
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage(
        {
          type: 'AUTO_REPAIR',
          positions: positionsCopy,
          minWallThicknessMm,
        },
        [positionsCopy.buffer]
      );
    } catch (err) {
      reject(err);
    }
  });
}
