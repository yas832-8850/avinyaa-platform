// The margin engine, Phase 0/1 version.
// Matches "Margin Rules — two levels only" from the project plan:
//   1. A carrier-specific rule for this client, if one exists
//   2. Otherwise, the client's default rule (carrier_id = null)
//
// This mirrors the priority-resolution logic from the full spec,
// just with two priority levels instead of four.

export type MarginRule = {
  org_id: string;
  carrier_id: string | null; // null = default rule for this client
  margin_percent: number;
};

export function resolveMarginRule(
  rules: MarginRule[],
  orgId: string,
  carrierId: string
): MarginRule | null {
  // Priority 1: a rule specific to this client AND this carrier
  const specific = rules.find(
    (r) => r.org_id === orgId && r.carrier_id === carrierId
  );
  if (specific) return specific;

  // Priority 2: this client's default rule (no carrier specified)
  const clientDefault = rules.find(
    (r) => r.org_id === orgId && r.carrier_id === null
  );
  if (clientDefault) return clientDefault;

  // No rule found — the caller should decide what to do
  // (e.g. block the booking, or fall back to a platform-wide default)
  return null;
}

export function calculateSellRate(costRate: number, marginPercent: number): number {
  const sellRate = costRate * (1 + marginPercent / 100);
  // Round to 2 decimal places - we're dealing with money
  return Math.round(sellRate * 100) / 100;
}

// Example of how these two functions are used together when a
// booking is created (see app/dashboard/new-job/page.tsx):
//
//   const rule = resolveMarginRule(rules, clientOrgId, carrierId);
//   if (!rule) { /* handle: no margin configured for this client/carrier */ }
//   const sellRate = calculateSellRate(costRate, rule.margin_percent);
//   // sellRate + rule.margin_percent + costRate all get SAVED on the job row
//   // (the "snapshot" — see schema.sql comments on the jobs table)
// Calculates the cost rate a carrier charges, based on their rate card
// for a given zone and shipment weight.
export type RateCard = {
  carrier_id: string;
  zone: string;
  rate_basis: "flat" | "per_kg" | "per_job";
  rate_value: number;
};

export function calculateCostRate(
  rateCards: RateCard[],
  carrierId: string,
  zone: string,
  weightKg: number
): number | null {
  const applicable = rateCards.filter(
    (rc) => rc.carrier_id === carrierId && rc.zone === zone
  );

  if (applicable.length === 0) return null; // no rate card set up for this combo

  let total = 0;
  for (const rc of applicable) {
    if (rc.rate_basis === "flat" || rc.rate_basis === "per_job") {
      total += rc.rate_value;
    } else if (rc.rate_basis === "per_kg") {
      total += rc.rate_value * weightKg;
    }
  }

  return Math.round(total * 100) / 100;
}
// Calculates the "chargeable weight" for a shipment — the greater of
// actual weight and dimensional (cubic) weight, which is how Australian
// freight carriers determine billing weight for oversized-but-light items.
export function calculateChargeableWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  actualWeightKg: number,
  cubicFactor: number
): number {
  const volumeM3 = (lengthCm / 100) * (widthCm / 100) * (heightCm / 100);
  const dimensionalWeightKg = volumeM3 * cubicFactor;
  return Math.max(actualWeightKg, dimensionalWeightKg);
}
export const CUBIC_FACTOR = 250; // AU standard, kg per m³

export interface JobLineInput {
  length_m: number;
  width_m: number;
  height_m: number;
  weight_kg: number;
}

export function calculateLineVolume(length_m: number, width_m: number, height_m: number): number {
  return length_m * width_m * height_m;
}

export function calculateLineTotals(lines: JobLineInput[]) {
  let totalVolumeM3 = 0;
  let totalWeightKg = 0;

  for (const line of lines) {
    totalVolumeM3 += calculateLineVolume(line.length_m, line.width_m, line.height_m);
    totalWeightKg += line.weight_kg;
  }

  return { totalVolumeM3, totalWeightKg };
}

export function calculateTotalChargeableWeight(totalWeightKg: number, totalVolumeM3: number): number {
  return Math.max(totalWeightKg, totalVolumeM3 * CUBIC_FACTOR);
}