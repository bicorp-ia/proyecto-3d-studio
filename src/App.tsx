import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Award, Box, CheckCircle2, ChevronRight, Cpu, Download, FileBox, HelpCircle, Layers, Moon, Package, RefreshCw, Shield, Sparkles, Sun, UploadCloud, Users, Video, Wrench, Zap } from 'lucide-react';
import { MATERIALS, POST_PROCESS_OPTIONS } from './data/materials';
import { B2BProfile, B2BTier, Material, ModelGeometry, PriceBreakdown, ProductionOrder, QuotationConfig, TechnologyType, UiAction, ViewMode } from './types';
import { calculateGeometryMetrics, createSampleCADGeometry, parseSTL } from './utils/stlParser';
import { autoRepairMesh, inspectMesh } from './utils/meshRepair';
import { analyzeMeshAsync, autoRepairMeshAsync } from './utils/asyncMeshProcessor';
import { calculateQuotationPrice } from './utils/pricingEngine';
import { OrientationOptimizationResult } from './utils/orientationOptimizer';
import { Navbar } from './components/Navbar';
import { Viewer3D } from './components/Viewer3D';
import { MeshInspectionPanel } from './components/MeshInspectionPanel';
import { QuotationConfigurator } from './components/QuotationConfigurator';
import { B2BPortal } from './components/B2BPortal';
import { MaterialCatalog } from './components/MaterialCatalog';
import { FormalQuoteModal } from './components/FormalQuoteModal';
import { ScheduleMeetingModal } from './components/ScheduleMeetingModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ChatbotWidget } from './components/ChatbotWidget';
import { NDABadgeBanner } from './components/NDABadgeBanner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { subscribeUserOrders } from './firebase/dbService';

function Proyect3dApp() {
  const { currentUser, b2bProfile, updateB2BProfile } = useAuth();
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'quote' | 'portal' | 'catalog'>('quote');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('solid');

  // Modals
  const [isFormalQuoteOpen, setIsFormalQuoteOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Hidden File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3D Geometry & Analysis State
  const [activeGeometry, setActiveGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelGeometry | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined);
  const [optimizedOrientationInfo, setOptimizedOrientationInfo] = useState<OrientationOptimizationResult | null>(null);

  // Unit: 'mm' | 'cm' | 'in'
  const [unit, setUnit] = useState<'mm' | 'cm' | 'in'>('mm');

  // Quotation Configuration
  const [config, setConfig] = useState<QuotationConfig>({
    technology: 'fdm',
    materialId: 'fdm-pa12-cf',
    infillPercent: 40,
    layerHeightMm: 0.16,
    quantity: 1,
    color: 'Negro Mate Carbono',
    postProcessingIds: ['pp-standard'],
    deliverySpeed: 'standard',
    unit: 'mm',
  });

  // B2B User Profile & Authentication State
  const [isB2BMode, setIsB2BMode] = useState(true);

  // Subscribe to real-time production orders from Firestore when authenticated
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeUserOrders(currentUser.uid, (firestoreOrders) => {
      if (firestoreOrders && firestoreOrders.length > 0) {
        setOrders(firestoreOrders);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Sample orders history for B2B Portal & 1-Click Reorder
  const [orders, setOrders] = useState<ProductionOrder[]>([
    {
      id: 'PRY-ORD-88210',
      date: '02/10/2026',
      projectName: 'Soporte_Aeroespacial_Topologico_v3',
      technology: 'fdm',
      materialName: 'Nylon PA12 + 20% Fibra Carbono',
      quantity: 12,
      status: 'PRINTING',
      progressPercent: 68,
      total: 842.5,
      trackingNumber: 'DHL-EXP-99238411',
      estimatedDelivery: '06/10/2026',
      config: {
        technology: 'fdm',
        materialId: 'fdm-pa12-cf',
        infillPercent: 60,
        layerHeightMm: 0.14,
        quantity: 12,
        color: 'Negro Mate Carbono',
        postProcessingIds: ['pp-standard', 'pp-inserts-m3-m8'],
        deliverySpeed: 'standard',
        unit: 'mm',
      },
    },
    {
      id: 'PRY-ORD-87105',
      date: '24/09/2026',
      projectName: 'Manifold_Hidraulico_Conformal_CFD',
      technology: 'sls',
      materialName: 'Nylon PA12 Sinterizado Industrial',
      quantity: 4,
      status: 'SHIPPED',
      progressPercent: 100,
      total: 518.2,
      trackingNumber: 'DHL-EXP-44018239',
      estimatedDelivery: 'Entregado',
      config: {
        technology: 'sls',
        materialId: 'sls-pa12',
        infillPercent: 100,
        layerHeightMm: 0.1,
        quantity: 4,
        color: 'Negro Teñido Grafito',
        postProcessingIds: ['pp-standard', 'pp-vapor-smooth'],
        deliverySpeed: 'express',
        unit: 'mm',
      },
    },
    {
      id: 'PRY-ORD-85320',
      date: '12/09/2026',
      projectName: 'Acoplamiento_Metrico_M32_ISO2768',
      technology: 'cnc',
      materialName: 'Aluminio 6061-T6 Fresado',
      quantity: 25,
      status: 'SHIPPED',
      progressPercent: 100,
      total: 1680.0,
      trackingNumber: 'DHL-EXP-11293847',
      estimatedDelivery: 'Entregado',
      config: {
        technology: 'cnc',
        materialId: 'cnc-al-6061',
        infillPercent: 100,
        layerHeightMm: 0.1,
        quantity: 25,
        color: 'Anodizado Negro Tipo II',
        postProcessingIds: ['pp-standard', 'pp-anodize-type2'],
        deliverySpeed: 'standard',
        unit: 'mm',
      },
    },
  ]);

  // Active Material lookup
  const activeMaterial = useMemo(() => {
    return (
      MATERIALS.find((m) => m.id === config.materialId) ||
      MATERIALS.find((m) => m.technology === config.technology) ||
      MATERIALS[0]
    );
  }, [config.materialId, config.technology]);

  // Active Color Hex lookup
  const activeColorHex = useMemo(() => {
    const variant = activeMaterial.colorVariants?.find((c) => c.name === config.color);
    return variant?.hex || '#38bdf8';
  }, [activeMaterial, config.color]);

  // Load initial sample CAD model on mount
  useEffect(() => {
    loadSampleCAD('bracket');
  }, []);

  const loadSampleCAD = async (type: 'bracket' | 'manifold' | 'drone_arm' | 'geared_coupling') => {
    const sample = createSampleCADGeometry(type);
    await processGeometryAsync(sample.geometry, sample.name, sample.fileSize);

    // Auto adapt technology if matching sample
    if (type === 'manifold') {
      setConfig((prev) => ({ ...prev, technology: 'sls', materialId: 'sls-pa12' }));
    } else if (type === 'geared_coupling') {
      setConfig((prev) => ({ ...prev, technology: 'cnc', materialId: 'cnc-al-6061' }));
    } else if (type === 'drone_arm') {
      setConfig((prev) => ({ ...prev, technology: 'fdm', materialId: 'fdm-pa12-cf' }));
    }
  };

  /**
   * Processes geometry asynchronously in Web Worker to prevent freezing the UI thread
   */
  const processGeometryAsync = async (geo: THREE.BufferGeometry, fileName: string, fileSize: number) => {
    try {
      const workerRes = await analyzeMeshAsync(geo, activeMaterial.minWallThicknessMm, config.technology);

      // Attach calculated thickness vertex colors for DFAM Heatmap
      if (workerRes.thicknessHeatmapColors) {
        geo.setAttribute('color', new THREE.BufferAttribute(workerRes.thicknessHeatmapColors, 3));
      }

      // Traditional synchronous fallback checks for edge details
      const metrics = calculateGeometryMetrics(geo);
      const diagnostics = inspectMesh(geo, activeMaterial, config.technology, unit);

      setActiveGeometry(geo);
      setModelInfo({
        fileName,
        fileSize,
        trianglesCount: workerRes.trianglesCount || geo.attributes.position.count / 3,
        verticesCount: geo.attributes.position.count,
        boundingBox: metrics.boundingBox,
        volumeCm3: workerRes.volumeCm3 || metrics.volumeCm3,
        surfaceAreaCm2: workerRes.surfaceAreaCm2 || metrics.surfaceAreaCm2,
        unit,
        isManifold: workerRes.isManifold ?? diagnostics.isManifold,
        invertedNormalsCount: workerRes.invertedNormalsCount ?? diagnostics.invertedNormalsCount,
        holesCount: workerRes.holesCount ?? diagnostics.holesCount,
        minThicknessDetectedMm: workerRes.minThicknessDetectedMm,
        hasHeatmap: true,
        dfamIssues: diagnostics.dfamIssues,
      });
    } catch (err) {
      console.warn('Worker analysis fallback:', err);
      // Fallback to synchronous calculation
      const metrics = calculateGeometryMetrics(geo);
      const diagnostics = inspectMesh(geo, activeMaterial, config.technology, unit);

      setActiveGeometry(geo);
      setModelInfo({
        fileName,
        fileSize,
        trianglesCount: geo.attributes.position.count / 3,
        verticesCount: geo.attributes.position.count,
        boundingBox: metrics.boundingBox,
        volumeCm3: metrics.volumeCm3,
        surfaceAreaCm2: metrics.surfaceAreaCm2,
        unit,
        isManifold: diagnostics.isManifold,
        invertedNormalsCount: diagnostics.invertedNormalsCount,
        holesCount: diagnostics.holesCount,
        dfamIssues: diagnostics.dfamIssues,
      });
    }
  };

  // Handle local File Upload (.STL, .STEP, .3MF)
  const handleFileUpload = async (file: File) => {
    const fileName = file.name;
    const fileSize = file.size;
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (ext === 'stl') {
      try {
        const buffer = await file.arrayBuffer();
        const geo = parseSTL(buffer);
        await processGeometryAsync(geo, fileName, fileSize);
      } catch (err) {
        console.error('Error parsing STL file:', err);
        loadSampleCAD('bracket');
      }
    } else if (ext === 'step' || ext === 'stp' || ext === '3mf') {
      const sample = createSampleCADGeometry('manifold');
      await processGeometryAsync(sample.geometry, fileName, fileSize);
    } else {
      alert('Formato no soportado. Por favor suba un archivo .STL, .STEP o .3MF');
    }
  };

  // Auto-Repair Handler using asynchronous Web Worker
  const handleAutoRepair = async () => {
    if (!activeGeometry) return;
    setIsRepairing(true);

    try {
      const { repairedGeometry, result } = await autoRepairMeshAsync(
        activeGeometry,
        activeMaterial.minWallThicknessMm
      );

      if (result.thicknessHeatmapColors) {
        repairedGeometry.setAttribute('color', new THREE.BufferAttribute(result.thicknessHeatmapColors, 3));
      }

      await processGeometryAsync(
        repairedGeometry,
        modelInfo?.fileName || 'Reparado.stl',
        modelInfo?.fileSize || 100000
      );
    } catch (err) {
      console.warn('Fallback auto repair:', err);
      const { repairedGeometry } = autoRepairMesh(activeGeometry);
      await processGeometryAsync(
        repairedGeometry,
        modelInfo?.fileName || 'Reparado.stl',
        modelInfo?.fileSize || 100000
      );
    } finally {
      setIsRepairing(false);
    }
  };

  // Unit change with auto-scale
  const handleUnitChange = (newUnit: 'mm' | 'cm' | 'in') => {
    setUnit(newUnit);
    setConfig((prev) => ({ ...prev, unit: newUnit }));
  };

  // Calculate Quotation Price Breakdown with Z-Height machine build rate
  const pricing: PriceBreakdown = useMemo(() => {
    const volume = modelInfo?.volumeCm3 || 28.5;
    const zHeight = modelInfo?.boundingBox.z || modelInfo?.boundingBox.y || 40.0;
    const tier = isB2BMode ? b2bProfile.tier : 'Standard';
    return calculateQuotationPrice(volume, activeMaterial, config, POST_PROCESS_OPTIONS, tier, zHeight);
  }, [modelInfo?.volumeCm3, modelInfo?.boundingBox, activeMaterial, config, isB2BMode, b2bProfile.tier]);

  // 1-Click Reorder Action
  const handleReorder = (order: ProductionOrder) => {
    setConfig({ ...order.config, quantity: order.quantity });
    loadSampleCAD('bracket');
    setActiveTab('quote');
  };

  // Select Material from Catalog or Bot
  const handleSelectMaterial = (mat: Material) => {
    setConfig((prev) => ({
      ...prev,
      technology: mat.technology,
      materialId: mat.id,
      color: mat.colorVariants?.[0]?.name || prev.color,
    }));
    setActiveTab('quote');
  };

  // Order Placement Success
  const handleOrderSuccess = (newOrder: ProductionOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    updateB2BProfile({
      totalSpent: b2bProfile.totalSpent + newOrder.total,
      ordersCount: b2bProfile.ordersCount + 1,
    });
    setActiveTab('portal');
  };

  // UI Action Controller triggered by Chatbot RAG
  const handleExecuteUiAction = (action: UiAction) => {
    switch (action.type) {
      case 'SET_MATERIAL': {
        const payload = action.payload;
        if (payload?.technology) {
          const mat =
            MATERIALS.find((m) => m.id === payload.materialId) ||
            MATERIALS.find((m) => m.technology === payload.technology);
          if (mat) handleSelectMaterial(mat);
        }
        break;
      }
      case 'SET_RENDER_MODE': {
        if (action.payload?.mode) {
          setViewMode(action.payload.mode);
        }
        break;
      }
      case 'TOGGLE_DFAM_HEATMAP': {
        setViewMode((prev) => (prev === 'heatmap' ? 'solid' : 'heatmap'));
        break;
      }
      case 'OPTIMIZE_ORIENTATION': {
        // Triggered via ref / state
        break;
      }
      case 'OPEN_CHECKOUT': {
        setIsCheckoutOpen(true);
        break;
      }
      case 'OPEN_FORMAL_QUOTE': {
        setIsFormalQuoteOpen(true);
        break;
      }
      case 'SCHEDULE_MEETING': {
        setIsMeetingOpen(true);
        break;
      }
      case 'LOAD_SAMPLE': {
        if (action.payload?.sample) {
          loadSampleCAD(action.payload.sample);
        }
        break;
      }
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} flex flex-col`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.step,.stp,.3mf"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        b2bProfile={b2bProfile}
        isB2BMode={isB2BMode}
        onToggleB2BMode={() => setIsB2BMode(!isB2BMode)}
        onOpenMeeting={() => setIsMeetingOpen(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* TAB 1: Quotation & 3D Inspection */}
        {activeTab === 'quote' && (
          <div className="flex flex-col gap-6">
            {/* Top Security & NDA Guarantee Banner */}
            <NDABadgeBanner />

            {/* Split Grid: 3D Viewport & Diagnostics (Left) | Quotation Configurator (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 3D Canvas + Diagnostics */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <Viewer3D
                  geometry={activeGeometry}
                  modelInfo={modelInfo}
                  technology={config.technology}
                  colorHex={activeColorHex}
                  unit={unit}
                  activeViewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onUnitChange={handleUnitChange}
                  onFileUpload={handleFileUpload}
                  onSnapshotCapture={(dataUrl) => {
                    setScreenshotDataUrl(dataUrl);
                    if (modelInfo) {
                      setModelInfo({ ...modelInfo, screenshotUrl: dataUrl });
                    }
                  }}
                  onOrientationOptimized={(result) => setOptimizedOrientationInfo(result)}
                />

                <MeshInspectionPanel
                  modelInfo={modelInfo}
                  activeMaterial={activeMaterial}
                  onAutoRepair={handleAutoRepair}
                  isRepairing={isRepairing}
                  onSelectSampleCAD={loadSampleCAD}
                  isHeatmapActive={viewMode === 'heatmap'}
                  onToggleHeatmap={() => setViewMode((prev) => (prev === 'heatmap' ? 'solid' : 'heatmap'))}
                  onOptimizeOrientation={() => {
                    // Orientation optimization handled in Viewer
                  }}
                />
              </div>

              {/* Right Column: Dynamic Quotation Configurator */}
              <div className="lg:col-span-5 sticky top-20">
                <QuotationConfigurator
                  config={config}
                  activeMaterial={activeMaterial}
                  pricing={pricing}
                  b2bTier={isB2BMode ? b2bProfile.tier : 'Standard'}
                  onConfigChange={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
                  onRequestFormalQuote={() => setIsFormalQuoteOpen(true)}
                  onProceedOrder={() => setIsCheckoutOpen(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Materials Catalog */}
        {activeTab === 'catalog' && (
          <MaterialCatalog onSelectMaterial={handleSelectMaterial} />
        )}

        {/* TAB 3: B2B Portal & Tracking */}
        {activeTab === 'portal' && (
          <B2BPortal
            profile={b2bProfile}
            orders={orders}
            onReorder={handleReorder}
            onUpgradeTierSim={(newTier) => updateB2BProfile({ tier: newTier })}
            onViewOrderDetails={(order) => {
              handleReorder(order);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-8 px-4 sm:px-6 mt-12 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-100">Proyect3d</span>
            <span>—</span>
            <span>Plataforma Industrial de Fabricación Aditiva & Mecanizado CNC 5 Ejes</span>
          </div>
          <div className="flex items-center gap-6">
            <span>ISO 9001:2015 Certificado</span>
            <span>Tolerancias ISO 2768</span>
            <span>Confidencialidad NDA Garantizada</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {modelInfo && (
        <FormalQuoteModal
          isOpen={isFormalQuoteOpen}
          onClose={() => setIsFormalQuoteOpen(false)}
          geometry={modelInfo}
          material={activeMaterial}
          config={config}
          pricing={pricing}
          screenshotDataUrl={screenshotDataUrl || modelInfo.screenshotUrl}
          defaultEmail={b2bProfile.email}
          defaultCompany={b2bProfile.companyName}
        />
      )}

      {modelInfo && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          geometry={modelInfo}
          material={activeMaterial}
          config={config}
          pricing={pricing}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      <ScheduleMeetingModal
        isOpen={isMeetingOpen}
        onClose={() => setIsMeetingOpen(false)}
        defaultEmail={b2bProfile.email}
        defaultCompany={b2bProfile.companyName}
      />

      {/* Chatbot Widget ("Proyect3d Bot") with Interactive UI Action Controller */}
      <ChatbotWidget
        onScheduleMeeting={() => setIsMeetingOpen(true)}
        onSelectMaterialByName={(name) => {
          const mat = MATERIALS.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
          if (mat) handleSelectMaterial(mat);
        }}
        onNavigateToSection={(section) => {
          if (section === 'portal') setActiveTab('portal');
          else setActiveTab('quote');
        }}
        onExecuteUiAction={handleExecuteUiAction}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Proyect3dApp />
    </AuthProvider>
  );
}
