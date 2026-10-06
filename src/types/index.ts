export type TechnologyType = 'fdm' | 'sla' | 'sls' | 'cnc';

export interface Material {
  id: string;
  name: string;
  technology: TechnologyType;
  density: number; // g/cm³
  costPerGram: number; // EUR/g
  machineHourlyRate: number; // EUR/h
  description: string;
  tensileStrength: string;
  heatDeflection: string;
  minWallThicknessMm: number;
  leadTimeDays: number;
  colorVariants: { name: string; hex: string }[];
  recommendedUse: string;
  certifications?: string;
}

export interface PostProcessOption {
  id: string;
  name: string;
  cost: number;
  description: string;
  applicableTech: TechnologyType[];
}

export type ViewMode = 'solid' | 'wireframe' | 'xray' | 'layers' | 'heatmap';

export type UiActionType =
  | 'SET_MATERIAL'
  | 'SET_RENDER_MODE'
  | 'TOGGLE_DFAM_HEATMAP'
  | 'OPTIMIZE_ORIENTATION'
  | 'OPEN_CHECKOUT'
  | 'OPEN_FORMAL_QUOTE'
  | 'SCHEDULE_MEETING'
  | 'LOAD_SAMPLE';

export interface UiAction {
  type: UiActionType;
  label: string;
  payload?: any;
}

export interface DFAMIssue {
  severity: 'safe' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendedValue: string;
}

export interface ModelGeometry {
  fileName: string;
  fileSize: number;
  trianglesCount: number;
  verticesCount: number;
  boundingBox: { x: number; y: number; z: number }; // In current unit
  volumeCm3: number;
  surfaceAreaCm2: number;
  unit: 'mm' | 'cm' | 'in';
  isManifold: boolean;
  invertedNormalsCount: number;
  holesCount: number;
  minThicknessDetectedMm?: number;
  hasHeatmap?: boolean;
  dfamIssues: DFAMIssue[];
  screenshotUrl?: string;
  bufferGeometry?: any; // THREE.BufferGeometry instance
}

export interface QuotationConfig {
  technology: TechnologyType;
  materialId: string;
  infillPercent: number; // 15 to 100
  layerHeightMm: number; // 0.05 to 0.30
  quantity: number;
  color: string;
  postProcessingIds: string[];
  deliverySpeed: 'standard' | 'express';
  unit: 'mm' | 'cm' | 'in';
}

export interface PriceBreakdown {
  materialCost: number;
  machineTimeCost: number;
  estimatedHours: number;
  weightGrams: number;
  postProcessingCost: number;
  setupFixedCost: number;
  unitPrice: number;
  quantityDiscountPercent: number;
  b2bDiscountPercent: number;
  subtotal: number;
  taxVat: number;
  total: number;
}

export type B2BTier = 'Standard' | 'Silver' | 'Gold' | 'Partner';

export interface B2BProfile {
  companyName: string;
  vatId: string;
  contactPerson: string;
  email: string;
  tier: B2BTier;
  totalSpent: number;
  ordersCount: number;
  ndaSigned: boolean;
}

export type OrderStatus = 
  | 'CAD_VERIFIED' 
  | 'SLICING_QUEUE' 
  | 'PRINTING' 
  | 'POST_PROCESSING' 
  | 'QC_PASSED' 
  | 'SHIPPED';

export interface ProductionOrder {
  id: string;
  date: string;
  projectName: string;
  technology: TechnologyType;
  materialName: string;
  quantity: number;
  status: OrderStatus;
  progressPercent: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery: string;
  geometrySnapshot?: string;
  config: QuotationConfig;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  uiAction?: UiAction;
  suggestedAction?: {
    label: string;
    actionType: 'CHANGE_MATERIAL' | 'CHANGE_TECH' | 'SCHEDULE_MEETING' | 'CHECK_DFAM' | 'OPEN_QUOTE';
    payload?: any;
  };
}
