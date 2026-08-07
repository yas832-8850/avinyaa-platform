"use server"; // Runs on the SERVER — this is the only place cost is calculated, never trust the browser

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  resolveMarginRule,
  calculateSellRate,
  calculateCostRate,
  type MarginRule,
  type RateCard,
} from "@/lib/margin";

export async function bookJob(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to book a job" };
  }

  // Find the logged-in user's own org — clients can only ever book for themselves
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return { error: "Could not determine your organisation" };
  }

  const carrierId = formData.get("carrier_id") as string;
  const zone = formData.get("zone") as string;
  const jobType = formData.get("job_type") as string;
  const weightRaw = formData.get("weight_kg") as string;
  const notes = formData.get("notes") as string;

  if (!carrierId || !zone || !jobType || !weightRaw) {
    return { error: "Carrier, zone, job type, and weight are all required" };
  }

  const weightKg = Number(weightRaw);
  if (isNaN(weightKg) || weightKg <= 0) {
    return { error: "Weight must be a positive number" };
  }

  // Fetch rate cards and margin rules fresh — always server-side, always current
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
    weightKg
  );

  if (costRate === null) {
    return {
      error:
        "No rate card is set up for this carrier and zone. Contact Avinyaa to arrange pricing.",
    };
  }

  const { data: rules, error: rulesError } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  if (rulesError) {
    return { error: rulesError.message };
  }

  const rule = resolveMarginRule(
    (rules ?? []) as MarginRule[],
    profile.org_id,
    carrierId
  );

  if (!rule) {
    return {
      error:
        "No margin rule is configured for your account. Contact Avinyaa to set this up.",
    };
  }

  const sellRate = calculateSellRate(costRate, rule.margin_percent);

  const { error } = await supabase.from("jobs").insert({
    org_id: profile.org_id,
    carrier_id: carrierId,
    job_type: jobType,
    status: "booked",
    cost_rate: costRate,
    margin_percent: rule.margin_percent,
    sell_rate: sellRate,
    notes: notes ? `Zone: ${zone}, Weight: ${weightKg}kg. ${notes}` : `Zone: ${zone}, Weight: ${weightKg}kg.`,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/book");
  return { success: true, sellRate };
}