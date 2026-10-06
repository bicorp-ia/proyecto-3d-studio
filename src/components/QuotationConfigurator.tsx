import React from 'react';
import { Check, ChevronRight, Clock, Download, FileText, Info, Layers, Package, Percent, ShieldCheck, Sparkles, Truck, Zap } from 'lucide-react';
import { MATERIALS, POST_PROCESS_OPTIONS, TECHNOLOGIES } from '../data/materials';
import { B2BTier, Material, PriceBreakdown, QuotationConfig, TechnologyType } from '../types';

interface QuotationConfiguratorProps {
  config: QuotationConfig;
  activeMaterial: Material;
  pricing: PriceBreakdown;
  b2bTier: B2BTier;
  onConfigChange: (updated: Partial<QuotationConfig>) => void;
  onRequestFormalQuote: () => void;
  onProceedOrder: () => void;
}

export const QuotationConfigurator: React.FC<QuotationConfiguratorProps> = ({
  config,
  activeMaterial,
  pricing,
  b2bTier,
  onConfigChange,
  onRequestFormalQuote,
  onProceedOrder,
}) => {
  // Filter materials for active technology
  const availableMaterials = MATERIALS.filter((m) => m.technology === config.technology);

  // Filter post processing applicable to active technology
  const applicablePostProcess = POST_PROCESS_OPTIONS.filter((p) =>
    p.applicableTech.includes(config.technology)
  );

  const handleTechChange = (tech: TechnologyType) => {
    const firstMat = MATERIALS.find((m) => m.technology === tech);
    onConfigChange({
      technology: tech,
      materialId: firstMat ? firstMat.id : config.materialId,
      color: firstMat?.colorVariants[0]?.name || config.color,
    });
  };

  const handleMaterialChange = (matId: string) => {
    const mat = MATERIALS.find((m) => m.id === matId);
    onConfigChange({
      materialId: matId,
      color: mat?.colorVariants[0]?.name || config.color,
    });
  };

  const togglePostProcess = (id: string) => {
    const current = config.postProcessingIds;
    if (id === 'pp-standard') return; // standard is always free base

    const exists = current.includes(id);
    const updated = exists ? current.filter((x) => x !== id) : [...current, id];
    onConfigChange({ postProcessingIds: updated });
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-6">
      {/* 1. Technology Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-neutral-200">1. Tecnología de Fabricación:</label>
          <span className="text-[11px] text-neutral-400 font-mono">
            {TECHNOLOGIES.find((t) => t.id === config.technology)?.standardTolerance}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TECHNOLOGIES.map((tech) => {
            const isSelected = config.technology === tech.id;
            return (
              <button
                key={tech.id}
                onClick={() => handleTechChange(tech.id)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-100 uppercase">{tech.id}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
                <div className="text-[11px] font-medium text-neutral-300 mt-1 truncate">
                  {tech.name.split(' (')[0]}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                  Espesor min: {tech.minWallThicknessMm} mm
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Material Selector & Specs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-200">2. Material de Ingeniería:</label>
          <span className="text-[11px] text-amber-400 font-medium">
            HDT: {activeMaterial.heatDeflection} · Resistencia: {activeMaterial.tensileStrength}
          </span>
        </div>

        <select
          value={config.materialId}
          onChange={(e) => handleMaterialChange(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-amber-500"
        >
          {availableMaterials.map((mat) => (
            <option key={mat.id} value={mat.id}>
              {mat.name} ({mat.tensileStrength} · {mat.heatDeflection}) — {(mat.costPerGram * 1000).toFixed(0)}€/kg
            </option>
          ))}
        </select>

        {/* Material Specs card */}
        <div className="mt-2.5 p-3 rounded-lg bg-neutral-950/50 border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span>{activeMaterial.description}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-400 pt-1.5 border-t border-neutral-800">
            <span>Densidad: <strong className="text-neutral-200 font-mono">{activeMaterial.density} g/cm³</strong></span>
            <span>Espesor mínimo: <strong className="text-neutral-200 font-mono">{activeMaterial.minWallThicknessMm} mm</strong></span>
            <span>Uso idóneo: <span className="text-neutral-200">{activeMaterial.recommendedUse}</span></span>
          </div>
        </div>

        {/* Color picker */}
        {activeMaterial.colorVariants && activeMaterial.colorVariants.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-neutral-400">Color / Acabado:</span>
            <div className="flex items-center gap-2">
              {activeMaterial.colorVariants.map((c) => (
                <button
                  key={c.name}
                  onClick={() => onConfigChange({ color: c.name })}
                  title={c.name}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors ${
                    config.color === c.name
                      ? 'border-amber-500/60 bg-amber-500/10 text-neutral-100'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Infill & Layer Resolution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Infill % */}
        <div className="p-3 bg-neutral-950/40 border border-neutral-800 rounded-lg">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-300 font-medium">Densidad de Relleno (Infill):</span>
            <span className="font-mono text-amber-400 font-bold tabular-nums">{config.infillPercent}%</span>
          </div>
          <input
            type="range"
            min="15"
            max="100"
            step="5"
            disabled={config.technology === 'cnc' || config.technology === 'sls'}
            value={config.infillPercent}
            onChange={(e) => onConfigChange({ infillPercent: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>15% Ligero</span>
            <span>50% Estructural</span>
            <span>100% Macizo</span>
          </div>
        </div>

        {/* Layer Resolution */}
        <div className="p-3 bg-neutral-950/40 border border-neutral-800 rounded-lg">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-300 font-medium">Resolución de Capa:</span>
            <span className="font-mono text-amber-400 font-bold tabular-nums">{config.layerHeightMm} mm</span>
          </div>
          <input
            type="range"
            min={config.technology === 'sla' ? '0.025' : '0.08'}
            max="0.30"
            step="0.02"
            value={config.layerHeightMm}
            onChange={(e) => onConfigChange({ layerHeightMm: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>Ultra-Fina (0.05)</span>
            <span>Estándar (0.16)</span>
            <span>Rápida (0.28)</span>
          </div>
        </div>
      </div>

      {/* 4. Post-Processing Treatments */}
      <div>
        <label className="text-xs font-semibold text-neutral-200 mb-2 block">
          4. Acabados y Post-procesado Especial:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {applicablePostProcess.map((pp) => {
            const isSelected = pp.id === 'pp-standard' || config.postProcessingIds.includes(pp.id);
            return (
              <button
                key={pp.id}
                onClick={() => togglePostProcess(pp.id)}
                className={`p-2.5 rounded-lg border text-left flex items-start justify-between gap-2 transition-colors ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-neutral-200 flex items-center gap-1.5">
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    {pp.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                    {pp.description}
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-300 shrink-0 tabular-nums">
                  {pp.cost === 0 ? 'Incluido' : `+${pp.cost.toFixed(2)}€`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Quantity & Delivery Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-neutral-200">5. Cantidad de Unidades:</span>
            {pricing.quantityDiscountPercent > 0 && (
              <span className="text-[11px] text-emerald-400 font-mono">
                Descuento volumen: -{pricing.quantityDiscountPercent}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="5000"
              value={config.quantity}
              onChange={(e) => onConfigChange({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm font-mono text-center text-neutral-100 focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-1">
              {[1, 5, 20, 50, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => onConfigChange({ quantity: q })}
                  className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                    config.quantity === q
                      ? 'bg-neutral-800 border-amber-500/50 text-amber-400 font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Speed */}
        <div>
          <div className="text-xs font-semibold text-neutral-200 mb-1.5">Plazo de Entrega:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConfigChange({ deliverySpeed: 'standard' })}
              className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                config.deliverySpeed === 'standard'
                  ? 'bg-neutral-800 border-amber-500/50 text-neutral-100'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <div className="font-medium flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Estándar
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{activeMaterial.leadTimeDays} a 5 días</div>
            </button>
            <button
              onClick={() => onConfigChange({ deliverySpeed: 'express' })}
              className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                config.deliverySpeed === 'express'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <div className="font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Express 24-48h
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Producción prioritaria (+25%)</div>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Transparent Mathematical Breakdown & Order Actions */}
      <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between pb-2 border-b border-neutral-800/80">
          <span>Desglose de Costes Transparente:</span>
          <span className="text-[11px] font-mono text-neutral-400">Fórmula Industrial Proyect3d</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-neutral-400 block">Materia Prima:</span>
            <span className="font-mono text-neutral-200 tabular-nums">
              {pricing.weightGrams}g × {(activeMaterial.costPerGram * 1000).toFixed(0)}€/kg
            </span>
            <div className="text-amber-400 font-semibold font-mono tabular-nums">{pricing.materialCost.toFixed(2)} €</div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-400 block">Tiempo Máquina:</span>
            <span className="font-mono text-neutral-200 tabular-nums">
              {pricing.estimatedHours}h × {activeMaterial.machineHourlyRate.toFixed(2)}€/h
            </span>
            <div className="text-amber-400 font-semibold font-mono tabular-nums">{pricing.machineTimeCost.toFixed(2)} €</div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-400 block">Preparación & Post-pro:</span>
            <span className="font-mono text-neutral-200 tabular-nums">Setup + acabados</span>
            <div className="text-amber-400 font-semibold font-mono tabular-nums">
              {(pricing.setupFixedCost + pricing.postProcessingCost).toFixed(2)} €
            </div>
          </div>

          <div>
            <span className="text-[11px] text-neutral-400 block">Precio / Unidad:</span>
            <span className="font-mono text-neutral-400 tabular-nums">
              {pricing.quantityDiscountPercent > 0 || pricing.b2bDiscountPercent > 0 ? (
                <span className="text-emerald-400">
                  Descuento: -{(pricing.quantityDiscountPercent + pricing.b2bDiscountPercent)}%
                </span>
              ) : (
                'Tarifa base'
              )}
            </span>
            <div className="text-neutral-100 font-bold font-mono text-sm tabular-nums">
              {pricing.unitPrice.toFixed(2)} €
            </div>
          </div>
        </div>

        {/* Total Price Bar */}
        <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-400">
              Total ({config.quantity} {config.quantity === 1 ? 'unidad' : 'unidades'}):
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
                {pricing.total.toFixed(2)} €
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({pricing.subtotal.toFixed(2)} € + IVA 21%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRequestFormalQuote}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors whitespace-nowrap shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Solicitud Cotización Formal (PDF)
            </button>
            <button
              onClick={onProceedOrder}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors whitespace-nowrap shadow-md"
            >
              <Package className="w-3.5 h-3.5" />
              Lanzar Producción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
