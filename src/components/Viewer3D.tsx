import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Compass, Eye, Flame, Layers, Maximize2, RefreshCw, RotateCcw, Shield, Sliders, Sparkles, TrendingDown, UploadCloud, Zap } from 'lucide-react';
import { ModelGeometry, TechnologyType, ViewMode } from '../types';
import { createPbrMaterial } from '../utils/pbrTextures';
import { findOptimalOrientation, OrientationOptimizationResult } from '../utils/orientationOptimizer';

interface Viewer3DProps {
  geometry: THREE.BufferGeometry | null;
  modelInfo: ModelGeometry | null;
  technology: TechnologyType;
  colorHex: string;
  unit: 'mm' | 'cm' | 'in';
  activeViewMode?: ViewMode;
  onUnitChange: (unit: 'mm' | 'cm' | 'in') => void;
  onFileUpload: (file: File) => void;
  onSnapshotCapture: (dataUrl: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onOrientationOptimized?: (result: OrientationOptimizationResult) => void;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  geometry,
  modelInfo,
  technology,
  colorHex,
  unit,
  activeViewMode = 'solid',
  onUnitChange,
  onFileUpload,
  onSnapshotCapture,
  onViewModeChange,
  onOrientationOptimized,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(activeViewMode);
  const [sliceProgress, setSliceProgress] = useState<number>(100);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [capturedFlash, setCapturedFlash] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState<OrientationOptimizationResult | null>(null);

  // Sync external viewMode changes (e.g. from Chatbot)
  useEffect(() => {
    if (activeViewMode && activeViewMode !== viewMode) {
      setViewMode(activeViewMode);
    }
  }, [activeViewMode]);

  // Three.js instances ref
  const threeRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    mesh: THREE.Mesh | null;
    wireframeMesh: THREE.LineSegments | null;
    gridHelper: THREE.GridHelper | null;
    clipPlane: THREE.Plane | null;
    animationFrameId: number | null;
    isInteracting: boolean;
    prevMousePos: { x: number; y: number };
    spherical: { radius: number; theta: number; phi: number };
    target: THREE.Vector3;
    isAnimatingRotation: boolean;
    animStartTime: number;
    startQuat: THREE.Quaternion;
    targetQuat: THREE.Quaternion;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    mesh: null,
    wireframeMesh: null,
    gridHelper: null,
    clipPlane: null,
    animationFrameId: null,
    isInteracting: false,
    prevMousePos: { x: 0, y: 0 },
    spherical: { radius: 180, theta: Math.PI / 4, phi: Math.PI / 3 },
    target: new THREE.Vector3(0, 0, 0),
    isAnimatingRotation: false,
    animStartTime: 0,
    startQuat: new THREE.Quaternion(),
    targetQuat: new THREE.Quaternion(),
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2500);
    camera.position.set(140, 110, 160);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    // 3-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(120, 160, 110);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.65); // cyan fill
    fillLight.position.set(-110, 90, -110);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.7); // amber rim
    rimLight.position.set(0, -90, -130);
    scene.add(rimLight);

    // Build Platform / Grid
    const grid = new THREE.GridHelper(260, 26, 0x475569, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    // Clipping plane for layer slicing simulation
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);

    threeRefs.current = {
      ...threeRefs.current,
      renderer,
      scene,
      camera,
      gridHelper: grid,
      clipPlane,
    };

    // Render loop with smooth animation slerp
    const animate = () => {
      const { renderer, scene, camera, spherical, target, mesh } = threeRefs.current;

      // Handle smooth quaternion rotation animation if active
      if (threeRefs.current.isAnimatingRotation && mesh) {
        const elapsed = (performance.now() - threeRefs.current.animStartTime) / 1000.0;
        const progress = Math.min(1.0, elapsed / 0.9);
        // Smooth easing cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        mesh.quaternion.slerpQuaternions(threeRefs.current.startQuat, threeRefs.current.targetQuat, ease);

        if (progress >= 1.0) {
          threeRefs.current.isAnimatingRotation = false;
        }
      }

      if (renderer && scene && camera) {
        const x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        const y = target.y + spherical.radius * Math.cos(spherical.phi);
        const z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

        camera.position.set(x, y, z);
        camera.lookAt(target);

        renderer.render(scene, camera);
      }
      threeRefs.current.animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeRefs.current.animationFrameId) {
        cancelAnimationFrame(threeRefs.current.animationFrameId);
      }
      renderer.dispose();
    };
  }, []);

  // Update Mesh when geometry, color, or viewMode changes
  useEffect(() => {
    const { scene, clipPlane } = threeRefs.current;
    if (!scene || !geometry) return;

    // Remove existing mesh
    if (threeRefs.current.mesh) {
      scene.remove(threeRefs.current.mesh);
      threeRefs.current.mesh.geometry.dispose();
      threeRefs.current.mesh = null;
    }
    if (threeRefs.current.wireframeMesh) {
      scene.remove(threeRefs.current.wireframeMesh);
      threeRefs.current.wireframeMesh.geometry.dispose();
      threeRefs.current.wireframeMesh = null;
    }

    geometry.computeBoundingBox();
    const box = geometry.boundingBox || new THREE.Box3();
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 20);

    // Center geometry horizontally and seat on build plate Y = 0
    geometry.center();
    geometry.computeBoundingBox();
    const centeredBox = geometry.boundingBox || new THREE.Box3();
    geometry.translate(0, -centeredBox.min.y, 0);

    // Position camera
    threeRefs.current.spherical.radius = maxDim * 2.3;
    threeRefs.current.target.set(0, size.y / 2, 0);

    // Create realistic PBR material
    const material = createPbrMaterial(
      technology,
      colorHex,
      viewMode,
      clipPlane ? [clipPlane] : []
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    threeRefs.current.mesh = mesh;

    // High-tech subtle edge outlines in solid mode
    if (viewMode === 'solid') {
      const wireGeo = new THREE.WireframeGeometry(geometry);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
      });
      const wireLines = new THREE.LineSegments(wireGeo, wireMat);
      scene.add(wireLines);
      threeRefs.current.wireframeMesh = wireLines;
    }
  }, [geometry, colorHex, viewMode, technology]);

  // Handle Layer Slicing Plane
  useEffect(() => {
    const { clipPlane, mesh } = threeRefs.current;
    if (!clipPlane || !mesh || !geometry) return;

    if (viewMode === 'layers') {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox || new THREE.Box3();
      const size = new THREE.Vector3();
      box.getSize(size);

      const targetHeight = (sliceProgress / 100) * size.y;
      clipPlane.constant = targetHeight;
    } else {
      clipPlane.constant = 10000;
    }
  }, [sliceProgress, viewMode, geometry]);

  // Toggle Grid
  useEffect(() => {
    if (threeRefs.current.gridHelper) {
      threeRefs.current.gridHelper.visible = showGrid;
    }
  }, [showGrid]);

  // Capture Canvas Snapshot (1024x1024 high resolution)
  const handleCaptureSnapshot = () => {
    const { renderer, scene, camera } = threeRefs.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    onSnapshotCapture(dataUrl);

    setCapturedFlash(true);
    setTimeout(() => setCapturedFlash(false), 300);
  };

  // Trigger Optimal Orientation with Smooth Slerp Animation
  const handleTriggerOptimalOrientation = () => {
    if (!geometry || !threeRefs.current.mesh) return;

    setIsOptimizing(true);
    const result = findOptimalOrientation(geometry);
    setOptimizationStats(result);

    const mesh = threeRefs.current.mesh;
    threeRefs.current.startQuat.copy(mesh.quaternion);
    threeRefs.current.targetQuat.copy(result.rotationQuaternion);
    threeRefs.current.animStartTime = performance.now();
    threeRefs.current.isAnimatingRotation = true;

    if (onOrientationOptimized) {
      onOrientationOptimized(result);
    }

    setTimeout(() => {
      setIsOptimizing(false);
    }, 1000);
  };

  const handleSelectMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    threeRefs.current.isInteracting = true;
    threeRefs.current.prevMousePos = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!threeRefs.current.isInteracting) return;

    const deltaX = e.clientX - threeRefs.current.prevMousePos.x;
    const deltaY = e.clientY - threeRefs.current.prevMousePos.y;
    threeRefs.current.prevMousePos = { x: e.clientX, y: e.clientY };

    const { spherical } = threeRefs.current;
    spherical.theta -= deltaX * 0.01;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.01));
  };

  const handleMouseUp = () => {
    threeRefs.current.isInteracting = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const { spherical } = threeRefs.current;
    spherical.radius = Math.max(30, Math.min(1000, spherical.radius + e.deltaY * 0.2));
  };

  const resetCamera = (preset?: 'iso' | 'top' | 'front') => {
    const { spherical } = threeRefs.current;
    if (preset === 'top') {
      spherical.phi = 0.1;
      spherical.theta = 0;
    } else if (preset === 'front') {
      spherical.phi = Math.PI / 2;
      spherical.theta = 0;
    } else {
      spherical.phi = Math.PI / 3;
      spherical.theta = Math.PI / 4;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-[520px] lg:h-[620px] rounded-xl overflow-hidden bg-neutral-950 border transition-colors ${
        isDraggingFile ? 'border-amber-500 bg-amber-950/10' : 'border-neutral-800'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Snapshot Flash Overlay */}
      {capturedFlash && (
        <div className="absolute inset-0 bg-white/40 pointer-events-none transition-opacity duration-300 animate-pulse" />
      )}

      {/* Drag & Drop Visual Backdrop Alert */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/85 backdrop-blur-sm border-2 border-dashed border-amber-500 m-4 rounded-lg pointer-events-none">
          <UploadCloud className="w-14 h-14 text-amber-400 mb-3 animate-bounce" />
          <p className="text-base font-semibold text-neutral-100">Suelte el archivo 3D aquí</p>
          <p className="text-xs text-neutral-400 mt-1">Compatible con .STL (Binario / ASCII), .STEP y .3MF</p>
        </div>
      )}

      {/* Top Left: Model File & Dimensions HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm pointer-events-none">
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-3 text-neutral-200 pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-800">
            <span className="text-xs font-semibold text-neutral-100 truncate max-w-[200px]">
              {modelInfo?.fileName || 'Cargue un archivo CAD'}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {modelInfo?.fileSize ? `${(modelInfo.fileSize / 1024).toFixed(0)} KB` : '0 KB'}
            </span>
          </div>

          {modelInfo && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">Bounding Box:</span>
                <span className="font-mono text-neutral-200 tabular-nums">
                  {modelInfo.boundingBox.x} × {modelInfo.boundingBox.y} × {modelInfo.boundingBox.z} {unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Volumen Real:</span>
                <span className="font-mono text-amber-400 tabular-nums">{modelInfo.volumeCm3} cm³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Superficie:</span>
                <span className="font-mono text-neutral-200 tabular-nums">{modelInfo.surfaceAreaCm2} cm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Triángulos:</span>
                <span className="font-mono text-neutral-200 tabular-nums">
                  {modelInfo.trianglesCount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Heatmap Legend (when viewMode is heatmap) */}
        {viewMode === 'heatmap' && (
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 pointer-events-auto shadow-xl flex flex-col gap-1.5 animate-in fade-in duration-200">
            <div className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              Mapa de Calor DFAM (Espesor de Pared)
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Crítico (&lt; {technology === 'sla' ? '0.4' : technology === 'cnc' ? '1.5' : '0.8'} mm)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Umbral
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Seguro
              </span>
            </div>
          </div>
        )}

        {/* Orientation Optimization Feedback Badge */}
        {optimizationStats && (
          <div className="bg-neutral-900/90 backdrop-blur-md border border-amber-500/40 rounded-lg p-2.5 text-xs text-neutral-200 pointer-events-auto shadow-xl flex flex-col gap-1 animate-in fade-in duration-200">
            <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Orientación Óptima Aplicada
            </div>
            <div className="text-[10px] text-neutral-300">
              Altura Z: {optimizationStats.initialZHeightMm}mm → <strong className="text-amber-400">{optimizationStats.optimizedZHeightMm}mm</strong> (-{optimizationStats.zHeightReductionPercent}%)
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Ahorro estimado en tiempo y soportes: ~{optimizationStats.estimatedTimeSavingsPercent}%
            </div>
          </div>
        )}
      </div>

      {/* Top Right: View Modes & Unit Selector Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Unit Selector */}
        <div className="flex items-center p-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg shadow-lg">
          {(['mm', 'cm', 'in'] as const).map((u) => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                unit === u
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* View Mode Segmented Controls including Heatmap */}
        <div className="flex items-center p-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg shadow-lg">
          <button
            onClick={() => handleSelectMode('solid')}
            title="Vista Sólida PBR con texturas de fabricación"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              viewMode === 'solid'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sólido PBR
          </button>
          <button
            onClick={() => handleSelectMode('wireframe')}
            title="Malla Wireframe"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              viewMode === 'wireframe'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Malla
          </button>
          <button
            onClick={() => handleSelectMode('xray')}
            title="Radiografía Translúcida X-Ray"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              viewMode === 'xray'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            X-Ray
          </button>
          <button
            onClick={() => handleSelectMode('layers')}
            title="Simulador de Laminado por Capas"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
              viewMode === 'layers'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Capas
          </button>
          <button
            onClick={() => handleSelectMode('heatmap')}
            title="Mapa de Calor DFAM para detección de paredes finas"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
              viewMode === 'heatmap'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            DFAM Heatmap
          </button>
        </div>
      </div>

      {/* Layer Slicing Slider HUD (when in 'layers' mode) */}
      {viewMode === 'layers' && (
        <div className="absolute top-18 right-4 z-20 w-64 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-300 mb-1.5">
            <span className="font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Altura de Corte Z:
            </span>
            <span className="font-mono text-amber-400 tabular-nums">{sliceProgress}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={sliceProgress}
            onChange={(e) => setSliceProgress(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>Cama (0%)</span>
            <span>Capa Superior (100%)</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Toolbar: Optimal Orientation, Camera Presets, & Snapshot */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl">
        {/* Optimal Orientation Button */}
        <button
          onClick={handleTriggerOptimalOrientation}
          disabled={isOptimizing}
          title="Calcula la orientación espacial 3D que minimiza la altura Z y reduce soportes"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
        >
          <Compass className={`w-3.5 h-3.5 text-amber-400 ${isOptimizing ? 'animate-spin' : ''}`} />
          Optimizar Orientación
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          onClick={() => resetCamera('iso')}
          title="Vista Isométrica"
          className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          Iso
        </button>
        <button
          onClick={() => resetCamera('top')}
          title="Vista Superior Planta"
          className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          Planta
        </button>
        <button
          onClick={() => resetCamera('front')}
          title="Vista Frontal Alzado"
          className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          Frontal
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Alternar Cama de Fabricación"
          className={`p-1.5 rounded transition-colors text-xs ${
            showGrid ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Cama
        </button>

        <button
          onClick={() => resetCamera()}
          title="Centrar Modelo"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Snapshot Capture for formal PDF quote */}
        <button
          onClick={handleCaptureSnapshot}
          title="Capturar render de alta resolución para la ficha técnica PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          Captura HD
        </button>
      </div>

      {/* Bottom Right: Quick Orbit Helper */}
      <div className="absolute bottom-4 right-4 z-10 hidden sm:block text-[11px] text-neutral-400 pointer-events-none font-mono">
        Click + Arrastre: Rotar · Scroll: Zoom · Shift + Drag: Desplazar
      </div>
    </div>
  );
};
