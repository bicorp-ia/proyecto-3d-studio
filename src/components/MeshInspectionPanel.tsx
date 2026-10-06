import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Compass, Cpu, FileBox, Flame, Layers, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';
import { DFAMIssue, Material, ModelGeometry } from '../types';

interface MeshInspectionPanelProps {
  modelInfo: ModelGeometry | null;
  activeMaterial: Material;
  onAutoRepair: () => void;
  isRepairing: boolean;
  onSelectSampleCAD: (type: 'bracket' | 'manifold' | 'drone_arm' | 'geared_coupling') => void;
  isHeatmapActive?: boolean;
  onToggleHeatmap?: () => void;
  onOptimizeOrientation?: () => void;
}

export const MeshInspectionPanel: React.FC<MeshInspectionPanelProps> = ({
  modelInfo,
  activeMaterial,
  onAutoRepair,
  isRepairing,
  onSelectSampleCAD,
  isHeatmapActive = false,
  onToggleHeatmap,
  onOptimizeOrientation,
}) => {
  if (!modelInfo) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 text-center">
        <FileBox className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-neutral-200">Sin modelo 3D activo</h3>
        <p className="text-xs text-neutral-400 mt-1 mb-4">
          Arrastre un archivo .STL o seleccione uno de nuestros modelos industriales de muestra:
        </p>
        <div className="grid grid-cols-2 gap-2 text-left">
          <button
            onClick={() => onSelectSampleCAD('bracket')}
            className="p-2.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-xs transition-colors"
          >
            <div className="font-medium text-neutral-200">Soporte Aeroespacial</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Topológico · Titanio / PA12-CF</div>
          </button>
          <button
            onClick={() => onSelectSampleCAD('manifold')}
            className="p-2.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-xs transition-colors"
          >
            <div className="font-medium text-neutral-200">Manifold Hidráulico</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Canales internos CFD · SLS</div>
          </button>
          <button
            onClick={() => onSelectSampleCAD('drone_arm')}
            className="p-2.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-xs transition-colors"
          >
            <div className="font-medium text-neutral-200">Brazo de Dron Robótico</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Estructural ligero · FDM CF</div>
          </button>
          <button
            onClick={() => onSelectSampleCAD('geared_coupling')}
            className="p-2.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-xs transition-colors"
          >
            <div className="font-medium text-neutral-200">Acoplamiento Métrico M32</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Tolerancia ISO 2768-f · CNC</div>
          </button>
        </div>
      </div>
    );
  }

  const isWatertight = modelInfo.isManifold && modelInfo.holesCount === 0 && modelInfo.invertedNormalsCount === 0;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-5">
      {/* Header & Worker Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Diagnóstico de Malla & Analizador DFAM
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
            <span>Inspección geométrica en tiempo real para {activeMaterial.technology.toUpperCase()}</span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800/40">
              Web Worker Asíncrono
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isWatertight ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Malla Estanca
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Requiere Reparación
            </div>
          )}
        </div>
      </div>

      {/* Mesh Diagnostics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
          <div className="text-[11px] text-neutral-400">Estado Manifold</div>
          <div className="text-sm font-semibold mt-1 flex items-center gap-1 text-neutral-200">
            {modelInfo.isManifold ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Manifold
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> No-Manifold
              </span>
            )}
          </div>
        </div>

        <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
          <div className="text-[11px] text-neutral-400">Normales Invertidas</div>
          <div className="text-sm font-mono mt-1 text-neutral-200 tabular-nums">
            {modelInfo.invertedNormalsCount === 0 ? (
              <span className="text-emerald-400">0 invertidas</span>
            ) : (
              <span className="text-amber-400">{modelInfo.invertedNormalsCount} detectadas</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
          <div className="text-[11px] text-neutral-400">Espesor Mín. Detectado</div>
          <div className="text-sm font-mono mt-1 text-neutral-200 tabular-nums">
            <span className={modelInfo.minThicknessDetectedMm && modelInfo.minThicknessDetectedMm < activeMaterial.minWallThicknessMm ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {modelInfo.minThicknessDetectedMm ? `${modelInfo.minThicknessDetectedMm} mm` : '1.2 mm'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Strip: Heatmap Toggle & Optimal Orientation & Auto-Repair */}
      <div className="flex flex-wrap items-center gap-2">
        {onToggleHeatmap && (
          <button
            onClick={onToggleHeatmap}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isHeatmapActive
                ? 'bg-red-500/20 border-red-500 text-red-200 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            {isHeatmapActive ? 'Desactivar Mapa de Calor' : 'Ver Mapa de Calor DFAM'}
          </button>
        )}

        {onOptimizeOrientation && (
          <button
            onClick={onOptimizeOrientation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Optimizar Orientación en Cama
          </button>
        )}

        {!isWatertight && (
          <button
            onClick={onAutoRepair}
            disabled={isRepairing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors ml-auto disabled:opacity-50 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            {isRepairing ? 'Reparando en Web Worker...' : 'Auto-Reparar Malla'}
          </button>
        )}
      </div>

      {/* DFAM Check: Wall Thickness & Feasibility Cards */}
      <div>
        <div className="text-xs font-semibold text-neutral-200 mb-2 flex items-center justify-between">
          <span>Verificación DFAM de Viabilidad Técnica:</span>
          <span className="text-[11px] text-neutral-400">
            Espesor límite para {activeMaterial.name}: <strong className="text-amber-400 font-mono">≥ {activeMaterial.minWallThicknessMm} mm</strong>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {modelInfo.dfamIssues.map((issue, idx) => {
            const isSafe = issue.severity === 'safe';
            const isWarn = issue.severity === 'warning';

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  isSafe
                    ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-200'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-red-950/20 border-red-500/30 text-red-200'
                }`}
              >
                {isSafe ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : isWarn ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <div className="font-semibold text-neutral-100">{issue.title}</div>
                  <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">{issue.message}</p>
                  <div className="mt-1 text-[11px] font-mono text-neutral-400">
                    Criterio: <span className="text-neutral-200">{issue.recommendedValue}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Sample Switcher Footer */}
      <div className="pt-2 border-t border-neutral-800">
        <span className="text-[11px] text-neutral-400 block mb-2">Cargar muestras CAD para pruebas:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectSampleCAD('bracket')}
            className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Soporte Aeroespacial (FDM/SLS)
          </button>
          <button
            onClick={() => onSelectSampleCAD('manifold')}
            className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Manifold Hidráulico (SLS)
          </button>
          <button
            onClick={() => onSelectSampleCAD('drone_arm')}
            className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Brazo Robótico (PA12-CF)
          </button>
          <button
            onClick={() => onSelectSampleCAD('geared_coupling')}
            className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Acoplamiento Métrico (CNC)
          </button>
        </div>
      </div>
    </div>
  );
};
