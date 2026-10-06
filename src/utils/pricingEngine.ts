import { B2BTier, Material, PostProcessOption, PriceBreakdown, QuotationConfig } from '../types';

export function calculateQuotationPrice(
  volumeCm3: number,
  material: Material,
  config: QuotationConfig,
  postProcessList: PostProcessOption[],
  b2bTier: B2BTier = 'Standard',
  zHeightMm: number = 40.0
): PriceBreakdown {
  // 1. Effective volume considering infill
  // Fórmula: Volumen(cm³) * InfillRatio
  let effectiveVolumeCm3 = volumeCm3;
  if (config.technology === 'fdm') {
    const infillRatio = config.infillPercent / 100.0;
    effectiveVolumeCm3 = volumeCm3 * (0.35 + 0.65 * infillRatio);
  } else if (config.technology === 'sla') {
    const infillRatio = config.infillPercent / 100.0;
    effectiveVolumeCm3 = volumeCm3 * (0.50 + 0.50 * infillRatio);
  } else if (config.technology === 'sls') {
    effectiveVolumeCm3 = volumeCm3;
  } else {
    // CNC raw billet stock volume
    effectiveVolumeCm3 = volumeCm3 * 1.35;
  }

  // 2. Weight in grams: Volumen * Densidad
  const weightGrams = Math.max(1, Number((effectiveVolumeCm3 * material.density).toFixed(1)));

  // 3. Coste Material = Volumen * Densidad * (Infill% / 100) * PrecioGramo
  const rawMaterialCost = weightGrams * material.costPerGram;

  // 4. Machine time calculation:
  // Tiempo Est. (Horas) = (Volumen * FactorResolucion / VelocidadDepresion) + (Altura Z / Velocidad Capa)
  const speedRates: Record<string, number> = {
    fdm: 20.0,
    sla: 25.0,
    sls: 45.0,
    cnc: 35.0,
  };
  const baseSpeed = speedRates[config.technology] || 20.0;

  // Factor de resolución
  let resolutionFactor = 1.0;
  if (config.layerHeightMm <= 0.05) resolutionFactor = 2.0;
  else if (config.layerHeightMm <= 0.12) resolutionFactor = 1.4;
  else if (config.layerHeightMm >= 0.25) resolutionFactor = 0.8;

  // Velocidad de avance en eje Z (mm / hora)
  const zSpeeds: Record<string, number> = {
    fdm: 16.0,
    sla: 22.0,
    sls: 28.0,
    cnc: 45.0,
  };
  const layerZSpeed = zSpeeds[config.technology] || 18.0;

  const volumeTime = (effectiveVolumeCm3 * resolutionFactor) / baseSpeed;
  const zTime = zHeightMm / layerZSpeed;
  const rawHours = volumeTime + zTime;
  const estimatedHours = Math.max(0.4, Number(rawHours.toFixed(2)));
  const machineTimeCost = estimatedHours * material.machineHourlyRate;

  // 5. Fixed setup & prep costs
  const fixedSetupCosts: Record<string, number> = {
    fdm: 5.0,
    sla: 10.0,
    sls: 14.0,
    cnc: 35.0,
  };
  const setupFixedCost = fixedSetupCosts[config.technology] || 5.0;

  // 6. Post-processing cost
  let postProcessingCost = 0;
  for (const ppId of config.postProcessingIds) {
    const option = postProcessList.find((p) => p.id === ppId);
    if (option) {
      postProcessingCost += option.cost;
    }
  }

  // Base cost per single unit before quantity discounts:
  // Precio Base = Coste Material + (Tiempo Est. * Tasa Horaria) + Coste Fijo Preparación
  const rawUnitBase = rawMaterialCost + machineTimeCost + postProcessingCost + (setupFixedCost / Math.max(1, config.quantity));

  // 7. Quantity discount scale according to prompt:
  // 1 a 5 uds: 0%
  // 6 a 20 uds: 10%
  // 21 a 100 uds: 20%
  // > 100 uds: 30%
  let quantityDiscountPercent = 0;
  if (config.quantity > 100) {
    quantityDiscountPercent = 30;
  } else if (config.quantity >= 21) {
    quantityDiscountPercent = 20;
  } else if (config.quantity >= 6) {
    quantityDiscountPercent = 10;
  }

  // 8. B2B Tier discount
  const b2bDiscounts: Record<B2BTier, number> = {
    Standard: 0,
    Silver: 5,
    Gold: 12,
    Partner: 15,
  };
  const b2bDiscountPercent = b2bDiscounts[b2bTier] || 0;

  const totalDiscountFactor = (1 - quantityDiscountPercent / 100.0) * (1 - b2bDiscountPercent / 100.0);
  
  // Delivery speed multiplier
  const speedFactor = config.deliverySpeed === 'express' ? 1.25 : 1.0;

  const discountedUnitPrice = Number((rawUnitBase * totalDiscountFactor * speedFactor).toFixed(2));
  const subtotal = Number((discountedUnitPrice * config.quantity).toFixed(2));
  const taxVat = Number((subtotal * 0.21).toFixed(2)); // 21% IVA in Spain/EU
  const total = Number((subtotal + taxVat).toFixed(2));

  return {
    materialCost: Number(rawMaterialCost.toFixed(2)),
    machineTimeCost: Number(machineTimeCost.toFixed(2)),
    estimatedHours,
    weightGrams,
    postProcessingCost: Number(postProcessingCost.toFixed(2)),
    setupFixedCost,
    unitPrice: discountedUnitPrice,
    quantityDiscountPercent,
    b2bDiscountPercent,
    subtotal,
    taxVat,
    total,
  };
}
