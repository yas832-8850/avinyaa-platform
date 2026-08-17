"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  resolveMarginRule,
  calculateSellRate,
  calculateCostRate,
  calculateChargeableWeight,
  calculateLineTotals,
  calculateTotalChargeableWeight,
  type MarginRule,
  type RateCard,
  type JobLineInput,
} from "@/lib/margin";
import { type ContactFormData } from "./contact-picker";

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

export type JobLineFormInput = JobLineInput & {
  description?: string;
  pack_type?: string;
};

export async function createJobWithLines(
  orgId: string,
  carrierId: string,
  jobType: string,
  zone: string,
  lines: JobLineFormInput[],
  sender: ContactFormData,
  receiver: ContactFormData,
  notes?: string
) {
  const supabase = await createClient();

  if (!lines || lines.length === 0) {
    return { error: "At least one freight line is required." };
  }

  // Recalculate totals server-side — never trust client-submitted totals
  const { totalVolumeM3, totalWeightKg } = calculateLineTotals(lines);
  const chargeableWeightKg = calculateTotalChargeableWeight(totalWeightKg, totalVolumeM3);

  const { data: rateCards, error: rateCardsError } = await supabase
    .from("carrier_rate_cards")
    .select("*");

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
    return {
      error: "No rate card is set up for this carrier and zone. Contact Avinyaa to arrange pricing.",
    };
  }

  const { data: rules, error: rulesError } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  if (rulesError) {
    return { error: rulesError.message };
  }

  const rule = resolveMarginRule((rules ?? []) as MarginRule[], orgId, carrierId);

  if (!rule) {
    return {
      error: "No margin rule is configured for your account. Contact Avinyaa to set this up.",
    };
  }

  const sellRate = calculateSellRate(costRate, rule.margin_percent);

  // Insert the job first, with totals and sender/receiver already resolved
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      org_id: orgId,
      carrier_id: carrierId,
      job_type: jobType,
      status: "booked",
      cost_rate: costRate,
      margin_percent: rule.margin_percent,
      sell_rate: sellRate,
      total_volume_m3: totalVolumeM3,
      total_weight_kg: totalWeightKg,
      sender_name: sender.name,
      sender_address: sender.address,
      sender_suburb: sender.suburb || null,
      sender_postcode: sender.postcode || null,
      sender_state: sender.state || null,
      sender_contact_name: sender.contact_name || null,
      sender_phone: sender.phone || null,
      receiver_name: receiver.name,
      receiver_address: receiver.address,
      receiver_suburb: receiver.suburb || null,
      receiver_postcode: receiver.postcode || null,
      receiver_state: receiver.state || null,
      receiver_contact_name: receiver.contact_name || null,
      receiver_phone: receiver.phone || null,
      notes: notes ? `Zone: ${zone}. ${notes}` : `Zone: ${zone}.`,
    })
    .select()
    .single();

  if (jobError || !job) {
    return { error: jobError?.message ?? "Failed to create job." };
  }

  // Now bulk-insert the freight lines against that job
  const lineRows = lines.map((line, index) => ({
    job_id: job.id,
    line_num: index + 1,
    description: line.description ?? null,
    pack_type: line.pack_type ?? null,
    length_m: line.length_m,
    width_m: line.width_m,
    height_m: line.height_m,
    volume_m3: line.length_m * line.width_m * line.height_m,
    weight_kg: line.weight_kg,
  }));

  const { error: linesError } = await supabase.from("job_lines").insert(lineRows);

  if (linesError) {
    // Roll back the job if line insert fails, so we don't leave an orphaned job with no lines
    await supabase.from("jobs").delete().eq("id", job.id);
    return { error: linesError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: job.id, sellRate, chargeableWeightKg };
}