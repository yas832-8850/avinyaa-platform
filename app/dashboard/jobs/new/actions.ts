"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  resolveMarginRule,
  calculateSellRate,
  calculateCostRate,
  calculateChargeableWeight,
  type MarginRule,
  type RateCard,
} from "@/lib/margin";

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const orgId = formData.get("org_id") as string;
  const carrierId = formData.get("carrier_id") as string;
  const zone = formData.get("zone") as string;
  const jobType = formData.get("job_type") as string;
  const packageCategory = formData.get("package_category") as string;
  const lengthRaw = formData.get("length_cm") as string;
  const widthRaw = formData.get("width_cm") as string;
  const heightRaw = formData.get("height_cm") as string;
  const weightRaw = formData.get("weight_kg") as string;
  const notes = formData.get("notes") as string;

  if (!orgId || !carrierId || !zone || !jobType || !lengthRaw || !widthRaw || !heightRaw || !weightRaw) {
    return { error: "Client, carrier, zone, dimensions, and weight are all required" };
  }

  const lengthCm = Number(lengthRaw);
  const widthCm = Number(widthRaw);
  const heightCm = Number(heightRaw);
  const actualWeightKg = Number(weightRaw);

  if ([lengthCm, widthCm, heightCm, actualWeightKg].some((n) => isNaN(n) || n <= 0)) {
    return { error: "Dimensions and weight must be positive numbers" };
  }

  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .select("cubic_factor")
    .eq("id", carrierId)
    .single();

  if (carrierError || !carrier) {
    return { error: "Could not find this carrier" };
  }

  const chargeableWeightKg = calculateChargeableWeight(
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    carrier.cubic_factor
  );

  const { data: rateCards, error: rateCardsError } = await supabase
    .from("carrier_rate_cards")
    .select("carrier_id, zone, rate_basis, rate_value");

  if (rateCardsError) {
    return { error: rateCardsError.message };
  }

  const costRate = calculateCostRate(
    (rateCards ?? []) as RateCard[],
    carrierId,
    zone,
    chargeableWeightKg
  );

  if (costRate === null) {
    return { error: "No rate card is set up for this carrier and zone." };
  }

  const { data: rules, error: rulesError } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  if (rulesError) {
    return { error: rulesError.message };
  }

  const rule = resolveMarginRule((rules ?? []) as MarginRule[], orgId, carrierId);

  if (!rule) {
    return { error: "No margin rule is configured for this client." };
  }

  const sellRate = calculateSellRate(costRate, rule.margin_percent);

  const dimsNote = `${packageCategory}, ${lengthCm}x${widthCm}x${heightCm}cm, ${actualWeightKg}kg actual (${chargeableWeightKg.toFixed(1)}kg chargeable), Zone: ${zone}.`;

  const { error } = await supabase.from("jobs").insert({
    org_id: orgId,
    carrier_id: carrierId,
    job_type: jobType,
    status: "booked",
    cost_rate: costRate,
    margin_percent: rule.margin_percent,
    sell_rate: sellRate,
    notes: notes ? `${dimsNote} ${notes}` : dimsNote,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs/new");
  return { success: true, sellRate };
}