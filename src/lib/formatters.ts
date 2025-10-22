/**
 * Format Chilean Peso (CLP) with proper locale formatting
 */
export const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format score (0-100) with color coding
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

/**
 * Get score category label
 */
export const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  return 'Mejorable';
};

/**
 * Format weight in grams or kilograms
 */
export const formatWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  return `${grams.toFixed(0)} g`;
};

/**
 * Format carbon footprint
 */
export const formatCarbon = (gco2e?: number): string => {
  if (!gco2e) return 'N/D';
  if (gco2e >= 1000) {
    return `${(gco2e / 1000).toFixed(2)} kg CO₂e`;
  }
  return `${gco2e.toFixed(0)} g CO₂e`;
};
