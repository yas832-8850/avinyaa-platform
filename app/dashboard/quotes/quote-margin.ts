export function calculateSellFromMargin(cost: number, marginPercent: number): number {
  if (marginPercent >= 100) return 0; // avoid division by zero / negative
  const sell = cost / (1 - marginPercent / 100);
  return Math.round(sell * 100) / 100;
}

export function calculateLineTotal(sellPricePerUnit: number, orderQty: number): number {
  return Math.round(sellPricePerUnit * orderQty * 100) / 100;
}

export function calculateMarginDollarPerUnit(cost: number, sellPrice: number): number {
  return Math.round((sellPrice - cost) * 100) / 100;
}