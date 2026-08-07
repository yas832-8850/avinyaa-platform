"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveMarginRule, calculateSellRate, type MarginRule } from "@/lib/margin";

export async function updateJob(jobId: string, formData: FormData) {
  const supabase = await createClient();

  const jobType = formData.get("job_type") as string;
  const costRateRaw = formData.get("cost_rate") as string;
  const notes = formData.get("notes") as string;

  if (!jobType || !costRateRaw) {
    return { error: "Job type and cost rate are required" };
  }

  const costRate = Number(costRateRaw);
  if (isNaN(costRate) || costRate < 0) {
    return { error: "Cost rate must be a positive number" };
  }

  // Fetch the existing job to get its org_id and carrier_id (these don't change on edit)
  const { data: existingJob, error: fetchError } = await supabase
    .from("jobs")
    .select("org_id, carrier_id")
    .eq("id", jobId)
    .single();

  if (fetchError || !existingJob) {
    return { error: "Could not find this job" };
  }

  // Re-resolve the margin rule (in case rules changed since the job was booked)
  const { data: rules, error: rulesError } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  if (rulesError) {
    return { error: rulesError.message };
  }

  const rule = resolveMarginRule(
    (rules ?? []) as MarginRule[],
    existingJob.org_id,
    existingJob.carrier_id
  );

  if (!rule) {
    return {
      error: "No margin rule is configured for this client/carrier combination.",
    };
  }

  const sellRate = calculateSellRate(costRate, rule.margin_percent);

  const { error } = await supabase
    .from("jobs")
    .update({
      job_type: jobType,
      cost_rate: costRate,
      margin_percent: rule.margin_percent,
      sell_rate: sellRate,
      notes: notes || null,
    })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  return { success: true, sellRate };
}