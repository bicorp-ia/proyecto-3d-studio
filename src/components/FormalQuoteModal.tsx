import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, FileText, Loader2, Mail, ShieldCheck, User, X } from 'lucide-react';
import { Material, ModelGeometry, PriceBreakdown, QuotationConfig } from '../types';
import { generateFormalQuotePDF } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { saveUserQuote } from '../firebase/dbService';

interface FormalQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  geometry: ModelGeometry;
  material: Material;
  config: QuotationConfig;
  pricing: PriceBreakdown;
  screenshotDataUrl?: string;
  defaultEmail?: string;
  defaultCompany?: string;
}

export const FormalQuoteModal: React.FC<FormalQuoteModalProps> = ({
  isOpen,
  onClose,
  geometry,
  material,
  config,
  pricing,
  screenshotDataUrl,
  defaultEmail = '',
  defaultCompany = '',
}) => {
  const [name, setName] = useState('Ing. Alejandro Morales');
  const [email, setEmail] = useState(defaultEmail || 'a.morales@aeroengineering.com');
  const [company, setCompany] = useState(defaultCompany || 'AeroDynamics & Tech S.L.');
  const [projectName, setProjectName] = useState(geometry.fileName.replace(/\.[^/.]+$/, ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQuoteId, setGeneratedQuoteId] = useState<string | null>(null);

  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleGenerateAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const quoteId = `PRY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Send to CRM backend
      await fetch('/api/quote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          clientName: name,
          clientEmail: email,
          clientCompany: company,
          projectName,
          technology: config.technology,
          material: material.name,
          quantity: config.quantity,
          pricing,
        }),
      });

      // 2. Persist to Firestore if user is authenticated
      if (currentUser) {
        await saveUserQuote(currentUser.uid, {
          quoteId,
          userId: currentUser.uid,
          clientName: name,
          clientEmail: email,
          clientCompany: company,
          projectName,
          technology: config.technology,
          materialId: material.id,
          materialName: material.name,
          quantity: config.quantity,
          unitPrice: pricing.unitPrice,
          subtotal: pricing.subtotal,
          taxVat: pricing.taxVat,
          total: pricing.total,
          volumeCm3: geometry.volumeCm3,
          weightGrams: pricing.weightGrams,
          createdAt: new Date().toISOString(),
        });
      }

      // 2. Generate and download PDF
      const pdf = generateFormalQuotePDF({
        quoteId,
        clientName: name,
        clientCompany: company,
        clientEmail: email,
        projectName,
        geometry,
        material,
        config,
        pricing,
        screenshotDataUrl,
      });

      pdf.save(`Cotizacion_Formal_${quoteId}_${geometry.fileName}.pdf`);
      setGeneratedQuoteId(quoteId);

      // 3. Confetti feedback
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Error generating quote PDF:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100">Solicitud de Cotización Formal</h3>
              <p className="text-xs text-neutral-400">Emisión de PDF oficial con validez jurídica de 30 días</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {generatedQuoteId ? (
          <div className="p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-neutral-100">Cotización Generada con Éxito</h4>
            <div className="text-sm font-mono text-amber-400 font-semibold mt-1">
              Referencia Oficial: {generatedQuoteId}
            </div>
            <p className="text-xs text-neutral-300 mt-3 max-w-sm leading-relaxed">
              El documento PDF certificado ha sido descargado en su dispositivo y remitido automáticamente al CRM
              industrial de Proyect3d.
            </p>

            <div className="mt-6 flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              >
                Volver al Cotizador
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateAndDownload} className="p-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Nombre del Proyecto / Pieza:</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Nombre del Solicitante:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Empresa / Razón Social:</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Particular o Empresa"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Correo Electrónico:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick Summary Pill */}
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Fabricación: {material.technology.toUpperCase()} en {material.name}</span>
                <span className="font-mono text-neutral-200">{config.quantity} uds</span>
              </div>
              <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-neutral-800">
                <span className="text-neutral-400 font-medium">Importe Total Estimado:</span>
                <span className="text-base font-bold font-mono text-amber-400">{pricing.total.toFixed(2)} €</span>
              </div>
            </div>

            {/* NDA notice */}
            <div className="flex items-start gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Protegido por el Acuerdo de Confidencialidad y Propiedad Intelectual de Proyect3d bajo directiva UE.
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Emitir y Descargar PDF
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
