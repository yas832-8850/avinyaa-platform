"use server"; // Runs on the SERVER only

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMarginRule(formData: FormData) {
  const supabase = await createClient();

  const orgId = formData.get("org_id") as string;
  const carrierId = formData.get("carrier_id") as string; // may be "" for default
  const marginPercent = formData.get("margin_percent") as string;

  if (!orgId || !marginPercent) {
    return { error: "Client and margin percent are required" };
  }

  const marginValue = Number(marginPercent);
  if (isNaN(marginValue) || marginValue < 0) {
    return { error: "Margin percent must be a positive number" };
  }

  const { error } = await supabase.from("margin_rules").insert({
    org_id: orgId,
    carrier_id: carrierId === "" ? null : carrierId,
    margin_percent: marginValue,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/margin-rules");
  return { success: true };
}