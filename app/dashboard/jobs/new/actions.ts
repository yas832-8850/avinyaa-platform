"use server"; // Runs on the SERVER only — this is the official calculation, never trust the browser's math

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveMarginRule, calculateSellRate, type MarginRule } from "@/lib/margin";

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const orgId = formData.get("org_id") as string;
  const carrierId = formData.get("carrier_id") as string;
  const jobType = formData.get("job_type") as string;
  const costRateRaw = formData.get("cost_rate") as string;
  const notes = formData.get("notes") as string;

  if (!orgId || !carrierId || !jobType || !costRateRaw) {
    return { error: "Client, carrier, job type, and cost rate are all required" };
  }

  const costRate = Number(costRateRaw);
  if (isNaN(costRate) || costRate < 0) {
    return { error: "Cost rate must be a positive number" };
  }

  // Fetch all margin rules for this org so we can resolve the right one server-side
  const { data: rules, error: rulesError } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  if (rulesError) {
    return { error: rulesError.message };
  }

  const rule = resolveMarginRule((rules ?? []) as MarginRule[], orgId, carrierId);

  if (!rule) {
    return {
      error:
        "No margin rule is configured for this client. Add one on the Margin Rules page first.",
    };
  }

  const sellRate = calculateSellRate(costRate, rule.margin_percent);

  const { error } = await supabase.from("jobs").insert({
    org_id: orgId,
    carrier_id: carrierId,
    job_type: jobType,
    status: "booked",
    cost_rate: costRate,
    margin_percent: rule.margin_percent,
    sell_rate: sellRate,
    notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs/new");
  return { success: true, sellRate };
}