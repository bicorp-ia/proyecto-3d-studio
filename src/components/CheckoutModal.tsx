import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Building2, CheckCircle2, CreditCard, DollarSign, FileText, Loader2, Lock, ShieldCheck, X } from 'lucide-react';
import { Material, ModelGeometry, PriceBreakdown, ProductionOrder, QuotationConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveUserOrder } from '../firebase/dbService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  geometry: ModelGeometry;
  material: Material;
  config: QuotationConfig;
  pricing: PriceBreakdown;
  onOrderSuccess: (order: ProductionOrder) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  geometry,
  material,
  config,
  pricing,
  onOrderSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sepa' | 'po'>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [iban, setIban] = useState('ES91 2100 0418 4502 0005 1124');
  const [poNumber, setPoNumber] = useState('PO-2026-AERO-0941');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ProductionOrder | null>(null);

  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(async () => {
      const orderId = `PRY-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: ProductionOrder = {
        id: orderId,
        date: new Date().toLocaleDateString('es-ES'),
        projectName: geometry.fileName.replace(/\.[^/.]+$/, ''),
        technology: config.technology,
        materialName: material.name,
        quantity: config.quantity,
        status: 'CAD_VERIFIED',
        progressPercent: 20,
        total: pricing.total,
        estimatedDelivery: config.deliverySpeed === 'express' ? '24 - 48 horas' : '3 - 5 días hábiles',
        trackingNumber: `DHL-EXP-${Math.floor(10000000 + Math.random() * 90000000)}`,
        geometrySnapshot: geometry.screenshotUrl,
        config: { ...config },
      };

      if (currentUser) {
        try {
          await saveUserOrder(currentUser.uid, newOrder);
        } catch (err) {
          console.warn('Firestore order save error:', err);
        }
      }

      setCompletedOrder(newOrder);
      onOrderSuccess(newOrder);
      setIsProcessing(false);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100">Pasarela de Pago Industrial</h3>
              <p className="text-xs text-neutral-400">Transacción segura cifrada TLS 1.3 con garantía de fabricación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedOrder ? (
          <div className="p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-neutral-100">Orden de Fabricación Confirmada</h4>
            <div className="text-xs font-mono text-amber-400 font-semibold mt-1">
              Orden ID: {completedOrder.id}
            </div>
            <p className="text-xs text-neutral-300 mt-3 max-w-sm leading-relaxed">
              La orden ha ingresado a la cola de producción en nuestra planta de fabricación aditiva y CNC.
              Puedes seguir el progreso en vivo desde el Portal B2B.
            </p>

            <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-left w-full space-y-1">
              <div className="flex justify-between text-neutral-400">
                <span>Tracking asignado:</span>
                <span className="font-mono text-neutral-200">{completedOrder.trackingNumber}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Plazo comprometido:</span>
                <span className="text-amber-400">{completedOrder.estimatedDelivery}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors"
            >
              Ir a Seguimiento de Producción
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 flex flex-col gap-4">
            {/* Amount Summary */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400">Total a Pagar (IVA inc.):</span>
                <div className="text-lg font-bold font-mono text-neutral-100 tabular-nums">
                  {pricing.total.toFixed(2)} €
                </div>
              </div>
              <div className="text-right text-xs text-neutral-400">
                <span>{config.quantity} uds · {material.name}</span>
                <div className="text-[11px] text-emerald-400 font-mono">B2B Tarifa Activa</div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">Método de Pago:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-lg border text-center text-xs transition-colors ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('sepa')}
                  className={`p-2.5 rounded-lg border text-center text-xs transition-colors ${
                    paymentMethod === 'sepa'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1" />
                  SEPA B2B
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('po')}
                  className={`p-2.5 rounded-lg border text-center text-xs transition-colors ${
                    paymentMethod === 'po'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <FileText className="w-4 h-4 mx-auto mb-1" />
                  PO (Net 30)
                </button>
              </div>
            </div>

            {/* Method Input Details */}
            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Número de Tarjeta Corporativa:</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    defaultValue="12/28"
                    placeholder="MM/AA"
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-100 text-center"
                  />
                  <input
                    type="text"
                    defaultValue="•••"
                    placeholder="CVC"
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-100 text-center"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'sepa' && (
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">IBAN Cuenta Corriente Empresarial:</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">Mandato de domiciliación SEPA B2B con cargo automático</span>
              </div>
            )}

            {paymentMethod === 'po' && (
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Número de Orden de Compra (PO):</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">Facturación consolidada a 30 días para clientes verificados</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Transacción certificada con cifrado bancario de 256 bits</span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar y Fabricar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
