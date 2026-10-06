import { jsPDF } from 'jspdf';
import { Material, ModelGeometry, PriceBreakdown, QuotationConfig } from '../types';

export interface PDFQuoteParams {
  quoteId: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  projectName: string;
  geometry: ModelGeometry;
  material: Material;
  config: QuotationConfig;
  pricing: PriceBreakdown;
  screenshotDataUrl?: string;
}

export function generateFormalQuotePDF(params: PDFQuoteParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Bar (Industrial Charcoal)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PROYECT3D', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('INGENIERÍA & FABRICACIÓN ADITIVA AVANZADA | ISO 9001:2015', margin, 21);

  // Quote Reference in Top Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text(params.quoteId, pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - margin, 21, { align: 'right' });

  // Two columns: Company & Client info
  let currentY = 36;

  // Proyect3d Info (Left)
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EMISOR:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text('Proyect3d Additive Technologies S.L.', margin, currentY + 4);
  doc.text('CIF: B-88997766 · Parque Tecnológico Leganés, Madrid', margin, currentY + 8);
  doc.text('Contacto: ingenieria@proyect3d.com · +34 910 234 567', margin, currentY + 12);

  // Client Info (Right)
  const rightColX = 115;
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATARIO:', rightColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(params.clientCompany || 'Cliente / Empresa', rightColX, currentY + 4);
  doc.text(`A la atención de: ${params.clientName}`, rightColX, currentY + 8);
  doc.text(`Email: ${params.clientEmail}`, rightColX, currentY + 12);

  currentY += 20;

  // Project Title Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PROYECTO: ${params.projectName.toUpperCase()} (${params.geometry.fileName})`, margin + 3, currentY + 6.5);

  currentY += 15;

  // Geometry & 3D Snapshot Section
  const boxHeight = 58;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'D');

  // Embed 3D Screenshot if present
  if (params.screenshotDataUrl) {
    try {
      doc.addImage(params.screenshotDataUrl, 'PNG', margin + 3, currentY + 3, 52, 52);
    } catch (e) {
      console.warn('Failed to embed screenshot in PDF', e);
    }
  }

  // Specifications beside screenshot
  const specX = margin + 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ESPECIFICACIONES TÉCNICAS Y GEOMÉTRICAS', specX, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const unit = params.geometry.unit;
  doc.text(`• Dimensiones (Bounding Box): ${params.geometry.boundingBox.x} × ${params.geometry.boundingBox.y} × ${params.geometry.boundingBox.z} ${unit}`, specX, currentY + 13);
  doc.text(`• Volumen Real: ${params.geometry.volumeCm3} cm³  |  Superficie: ${params.geometry.surfaceAreaCm2} cm²`, specX, currentY + 18);
  doc.text(`• Peso Estimado de Pieza: ${params.pricing.weightGrams} g`, specX, currentY + 23);
  doc.text(`• Tecnología: ${params.material.technology.toUpperCase()}  |  Material: ${params.material.name}`, specX, currentY + 28);
  doc.text(`• Densidad de Relleno (Infill): ${params.config.infillPercent}%  |  Resolución de Capa: ${params.config.layerHeightMm} mm`, specX, currentY + 33);
  doc.text(`• Color / Acabado: ${params.config.color}`, specX, currentY + 38);
  doc.text(`• Estado de Malla: ${params.geometry.isManifold ? 'Malla 100% Estanca (Watertight Manifold)' : 'Corregida por Algoritmo DFAM'}`, specX, currentY + 43);
  doc.text(`• Tolerancia Dimensional: ${params.material.technology === 'cnc' ? '±0.02 mm (ISO 2768-f)' : '±0.20 mm (ISO 2768-m)'}`, specX, currentY + 48);

  currentY += boxHeight + 8;

  // Itemized Pricing Table
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONCEPTO DE FABRICACIÓN', margin + 3, currentY + 4.8);
  doc.text('CANTIDAD', margin + 95, currentY + 4.8);
  doc.text('PRECIO UD.', margin + 125, currentY + 4.8);
  doc.text('SUBTOTAL', pageWidth - margin - 3, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Row 1: Manufacturing
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fabricación ${params.material.technology.toUpperCase()} en ${params.material.name} (${params.geometry.fileName})`, margin + 3, currentY + 5.5);
  doc.text(`${params.config.quantity} uds`, margin + 95, currentY + 5.5);
  doc.text(`${params.pricing.unitPrice.toFixed(2)} €`, margin + 125, currentY + 5.5);
  doc.text(`${params.pricing.subtotal.toFixed(2)} €`, pageWidth - margin - 3, currentY + 5.5, { align: 'right' });

  currentY += 9;

  // Row 2: Setup & QA
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.text('Preparación de máquina, calibración de trayectoria y control dimensional CMM', margin + 3, currentY + 5);
  doc.text('1 lote', margin + 95, currentY + 5);
  doc.text('Incluido', margin + 125, currentY + 5);
  doc.text('0.00 €', pageWidth - margin - 3, currentY + 5, { align: 'right' });

  currentY += 8;

  // Row 3: Discounts (if any)
  if (params.pricing.quantityDiscountPercent > 0 || params.pricing.b2bDiscountPercent > 0) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    const discountText = [
      params.pricing.quantityDiscountPercent > 0 ? `Descuento por volumen (${params.pricing.quantityDiscountPercent}%)` : '',
      params.pricing.b2bDiscountPercent > 0 ? `Tarifa fidelidad B2B (${params.pricing.b2bDiscountPercent}%)` : '',
    ].filter(Boolean).join(' + ');

    doc.setTextColor(22, 101, 52); // green-800
    doc.text(discountText, margin + 3, currentY + 5);
    doc.text('Aplicado', margin + 95, currentY + 5);
    doc.text('En precio ud.', margin + 125, currentY + 5);
    doc.text('Bonificado', pageWidth - margin - 3, currentY + 5, { align: 'right' });
    currentY += 8;
  }

  // Totals Box
  currentY += 4;
  const totalsX = 120;
  const totalsWidth = pageWidth - margin - totalsX;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(totalsX, currentY, pageWidth - margin, currentY);
  currentY += 5;

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Base Imponible:', totalsX, currentY);
  doc.text(`${params.pricing.subtotal.toFixed(2)} €`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 5;
  doc.text('IVA (21%):', totalsX, currentY);
  doc.text(`${params.pricing.taxVat.toFixed(2)} €`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 6;
  doc.setFillColor(248, 250, 252);
  doc.rect(totalsX - 2, currentY - 4, totalsWidth + 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL PRESUPUESTO:', totalsX, currentY + 1.5);
  doc.text(`${params.pricing.total.toFixed(2)} €`, pageWidth - margin, currentY + 1.5, { align: 'right' });

  // Legal & NDA Terms
  currentY = 245;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 34, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CONDICIONES DE CONTRATACIÓN Y ACUERDO DE CONFIDENCIALIDAD (NDA)', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    '1. Validez de la oferta: 30 días naturales desde la fecha de emisión. Precios sujetos a verificación definitiva del archivo CAD.',
    margin + 3,
    currentY + 10
  );
  doc.text(
    '2. Propiedad Intelectual: Proyect3d garantiza confidencialidad absoluta bajo la Directiva UE 2016/943. Los ficheros 3D suministrados',
    margin + 3,
    currentY + 14
  );
  doc.text(
    '   pertenecen exclusivamente al cliente y serán custodiados en servidores cifrados en la Unión Europea.',
    margin + 3,
    currentY + 17
  );
  doc.text(
    '3. Condiciones de Pago: Pago en línea con tarjeta / transferencia SEPA para nuevos clientes. Facturación a 30 días para cuentas B2B.',
    margin + 3,
    currentY + 21
  );
  doc.text(
    `4. Plazo Estimado de Entrega: ${params.config.deliverySpeed === 'express' ? 'Servicio Express 24-48 horas' : 'Estándar 3-5 días hábiles'}. Envío certificado con número de tracking.`,
    margin + 3,
    currentY + 25
  );
  doc.text(
    '5. Garantía de Calidad: Re-fabricación o rectificación gratuita en caso de desviación superior a las tolerancias ISO 2768 estipuladas.',
    margin + 3,
    currentY + 29
  );

  // Footer bar
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento formal generado automáticamente por el Motor de Cotización Proyect3d v4.2', margin, pageHeight - 6);
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

  return doc;
}
