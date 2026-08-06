"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUSES = ["booked", "in_progress", "completed", "cancelled"] as const;
type JobStatus = (typeof ALLOWED_STATUSES)[number];

export async function updateJobStatus(jobId: string, newStatus: JobStatus) {
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return { error: "Invalid status" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ status: newStatus })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}