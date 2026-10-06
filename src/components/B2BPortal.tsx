import React, { useState } from 'react';
import { Award, CheckCircle2, ChevronRight, Clock, Copy, CreditCard, ExternalLink, FileCheck, Layers, Package, RefreshCw, Shield, Sparkles, TrendingUp, Truck, UserCheck } from 'lucide-react';
import { B2BProfile, B2BTier, ProductionOrder } from '../types';

interface B2BPortalProps {
  profile: B2BProfile;
  orders: ProductionOrder[];
  onReorder: (order: ProductionOrder) => void;
  onUpgradeTierSim: (newTier: B2BTier) => void;
  onViewOrderDetails: (order: ProductionOrder) => void;
}

export const B2BPortal: React.FC<B2BPortalProps> = ({
  profile,
  orders,
  onReorder,
  onUpgradeTierSim,
  onViewOrderDetails,
}) => {
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<ProductionOrder>(orders[0]);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const tierBenefits: Record<B2BTier, { discount: string; leadTime: string; perks: string[] }> = {
    Standard: {
      discount: '0% acumulado',
      leadTime: 'Estándar 3-5 días',
      perks: ['Acceso a cotizador online 24/7', 'Almacenamiento seguro CAD con NDA', 'Soporte vía tickets'],
    },
    Silver: {
      discount: '5% permanente en todas las órdenes',
      leadTime: 'Cola de máquina prioritaria',
      perks: ['Descuento del 5% adicional', 'Prioridad en cola de impresión', 'Facturación mensual consolidada'],
    },
    Gold: {
      discount: '10% permanente en todas las órdenes',
      leadTime: 'Despacho express prioritario',
      perks: ['10% de ahorro directo', 'Ingeniero de aplicaciones asignado', 'Verificación CMM de 3 cotas críticas gratis'],
    },
    Partner: {
      discount: '15% permanente en volumen y series',
      leadTime: 'Reserva garantizada de capacidad de máquina',
      perks: ['15% descuento estructural', 'Condiciones de pago a 60 días (SEPA B2B)', 'Informes de metrología CMM completos', 'Stock de seguridad de materia prima'],
    },
  };

  const getStatusStepIndex = (status: ProductionOrder['status']) => {
    switch (status) {
      case 'CAD_VERIFIED': return 0;
      case 'SLICING_QUEUE': return 1;
      case 'PRINTING': return 2;
      case 'POST_PROCESSING': return 3;
      case 'QC_PASSED': return 4;
      case 'SHIPPED': return 5;
      default: return 0;
    }
  };

  const currentStepIdx = getStatusStepIndex(selectedOrderForTracking.status);

  const steps = [
    { label: 'CAD Verificado', desc: 'Malla apta e inspección DFAM' },
    { label: 'Cola Slicing', desc: 'Generación de trayectorias CNC / G-Code' },
    { label: 'Fabricación', desc: 'Impresión / Mecanizado en curso' },
    { label: 'Post-Procesado', desc: 'Curado, granallado o tratamiento térmico' },
    { label: 'Control Calidad', desc: 'Inspección CMM dimensional ISO 2768' },
    { label: 'Expedición', desc: 'Envío urgente con DHL Express' },
  ];

  const handleCopyTracking = (trackNum: string) => {
    navigator.clipboard.writeText(trackNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. B2B Account Overview & Loyalty Tier Card */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-neutral-100">{profile.companyName}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Nivel {profile.tier}
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-x-3">
              <span>CIF: <strong className="text-neutral-200 font-mono">{profile.vatId}</strong></span>
              <span>Contacto: <strong className="text-neutral-200">{profile.contactPerson}</strong></span>
              <span>Email: <strong className="text-neutral-200">{profile.email}</strong></span>
            </div>
          </div>

          {/* Quick Tier Simulator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Simular nivel:</span>
            {(['Standard', 'Silver', 'Gold', 'Partner'] as B2BTier[]).map((t) => (
              <button
                key={t}
                onClick={() => onUpgradeTierSim(t)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  profile.tier === t
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Benefits & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-400">Gasto Anual Acumulado:</div>
            <div className="text-xl font-bold font-mono text-neutral-100 mt-1 tabular-nums">
              {profile.totalSpent.toLocaleString()} €
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {profile.ordersCount} órdenes procesadas
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-400">Bonificación de Tarifa:</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {tierBenefits[profile.tier].discount}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Aplicada en tiempo real</div>
          </div>

          <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-400">Plazo & Capacidad:</div>
            <div className="text-sm font-semibold text-neutral-200 mt-1">
              {tierBenefits[profile.tier].leadTime}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Garantía de máquina reservada</div>
          </div>

          <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-400">Condición de Pago:</div>
            <div className="text-sm font-semibold text-neutral-200 mt-1">
              {profile.tier === 'Partner' ? 'SEPA B2B Factura a 60 días' : 'SEPA B2B Factura a 30 días'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> NDA Marco Activo
            </div>
          </div>
        </div>

        {/* Perks list */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-300">
          <span className="font-semibold text-neutral-400">Ventajas activas de cuenta:</span>
          {tierBenefits[profile.tier].perks.map((perk, i) => (
            <span key={i} className="flex items-center gap-1.5 text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              {perk}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Live Production Tracking Timeline */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Seguimiento de Producción en Vivo (Live MES Tracking)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Orden activa: <strong className="text-neutral-200 font-mono">{selectedOrderForTracking.id}</strong> —{' '}
              {selectedOrderForTracking.projectName} ({selectedOrderForTracking.quantity} uds en {selectedOrderForTracking.materialName})
            </p>
          </div>

          {selectedOrderForTracking.trackingNumber && (
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
              <Truck className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-mono text-neutral-200">{selectedOrderForTracking.trackingNumber}</span>
              <button
                onClick={() => handleCopyTracking(selectedOrderForTracking.trackingNumber!)}
                title="Copiar Tracking"
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copiedTracking && <span className="text-[10px] text-emerald-400">¡Copiado!</span>}
            </div>
          )}
        </div>

        {/* Timeline Steps */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                    : isCompleted
                    ? 'bg-neutral-950/60 border-emerald-500/40'
                    : 'bg-neutral-950/30 border-neutral-800/80 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] text-neutral-400">0{idx + 1}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                    ) : null}
                  </div>
                  <div className={`text-xs font-semibold ${isCurrent ? 'text-amber-300' : isCompleted ? 'text-emerald-300' : 'text-neutral-400'}`}>
                    {st.label}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 leading-snug">
                    {st.desc}
                  </div>
                </div>

                {isCurrent && (
                  <div className="mt-3 pt-2 border-t border-amber-500/20">
                    <div className="text-[10px] text-amber-400 font-mono font-medium">
                      Progreso: {selectedOrderForTracking.progressPercent}%
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Reorder History with 1-Click Action */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              Historial de Fabricación & Reordenación en 1-Clic
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Repita tiradas de fabricación con los parámetros de ingeniería validados previamente
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">{orders.length} órdenes registradas</span>
        </div>

        <div className="divide-y divide-neutral-800/80 mt-2">
          {orders.map((order) => {
            const isCurrentlyTracked = selectedOrderForTracking.id === order.id;

            return (
              <div
                key={order.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {order.geometrySnapshot ? (
                      <img src={order.geometrySnapshot} alt={order.projectName} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-100">{order.projectName}</span>
                      <span className="text-[11px] font-mono text-neutral-400">{order.id}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono uppercase">
                        {order.technology}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-x-4">
                      <span>Material: <strong className="text-neutral-200">{order.materialName}</strong></span>
                      <span>Cantidad: <strong className="text-neutral-200 font-mono">{order.quantity} uds</strong></span>
                      <span>Fecha: <strong className="text-neutral-300">{order.date}</strong></span>
                      <span>Total: <strong className="text-amber-400 font-mono font-semibold">{order.total.toFixed(2)} €</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => setSelectedOrderForTracking(order)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors whitespace-nowrap ${
                      isCurrentlyTracked
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold'
                        : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    Ver Tracking
                  </button>

                  <button
                    onClick={() => onReorder(order)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors whitespace-nowrap shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reordenar en 1-Clic
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
