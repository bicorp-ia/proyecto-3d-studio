import React from 'react';
import { FileLock2, Lock, ShieldCheck, Sparkles } from 'lucide-react';

export const NDABadgeBanner: React.FC = () => {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
          <FileLock2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
            Garantía de Confidencialidad & Protección de Propiedad Intelectual (NDA Automático)
            <span className="text-[10px] font-mono text-emerald-400 font-normal">Directiva UE 2016/943</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
            Todos los ficheros CAD (.STL, .STEP, .3MF) subidos a Proyect3d son procesados con cifrado militar AES-256 en
            centros de datos dentro de la Unión Europea y nunca se comparten con terceros.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 shrink-0">
        <span className="flex items-center gap-1 text-neutral-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ISO 9001:2015
        </span>
        <span className="flex items-center gap-1 text-neutral-300">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          AES-256 TLS 1.3
        </span>
      </div>
    </div>
  );
};
