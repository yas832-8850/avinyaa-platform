"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function formatJobNumber(prefix: string | null, number: number, padding: number): string {
  const numberStr = padding > 0 ? String(number).padStart(padding, "0") : String(number);
  return prefix ? `${prefix}${numberStr}` : numberStr;
}

// Atomically claims the next job number for an org and returns it formatted.
// Checks the released-numbers pool first (reuse), only advances the sequence if empty.
async function getNextJobNumber(orgId: string): Promise<{ jobNumber?: string; jobNumberValue?: number; error?: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("job_number_sequences")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!existing) {
    const { error: createError } = await supabase
      .from("job_number_sequences")
      .insert({ org_id: orgId, next_number: 1, padding: 0 });

    if (createError) {
      return { error: `Could not create job number sequence: ${createError.message}` };
    }
  }

  const { data, error } = await supabase.rpc("claim_next_job_number", {
    p_org_id: orgId,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Failed to claim job number." };
  }

  const { claimed_number, prefix, padding } = data[0];
  return {
    jobNumber: formatJobNumber(prefix, claimed_number, padding),
    jobNumberValue: claimed_number,
  };
}

export async function createJobMaster(
  orgId: string,
  client: string,
  projectName: string,
  accountManager: string,
  clientContact: string,
  jobDate: string,
  serverLink: string,
  customJobNumber?: string
) {
  const supabase = await createClient();

  let jobNumber: string;
  let jobNumberValue: number | null;

  if (customJobNumber && customJobNumber.trim() !== "") {
    const { data: clash } = await supabase
      .from("jobs_master")
      .select("id")
      .eq("org_id", orgId)
      .eq("job_number", customJobNumber.trim())
      .maybeSingle();

    if (clash) {
      return { error: `Job number "${customJobNumber}" is already in use.` };
    }

    jobNumber = customJobNumber.trim();
    const parsed = Number(jobNumber);
    jobNumberValue = Number.isInteger(parsed) ? parsed : null;
  } else {
    const result = await getNextJobNumber(orgId);
    if (result.error || !result.jobNumber || result.jobNumberValue === undefined) {
      return { error: result.error ?? "Could not generate job number." };
    }
    jobNumber = result.jobNumber;
    jobNumberValue = result.jobNumberValue;
  }

  const { data, error } = await supabase
    .from("jobs_master")
    .insert({
      org_id: orgId,
      job_number: jobNumber,
      job_number_value: jobNumberValue,
      client,
      project_name: projectName,
      account_manager: accountManager,
      client_contact: clientContact,
      job_date: jobDate || null,
      server_link: serverLink || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/job-master");
  return { success: true, job: data };
}

export async function getJobsMaster(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs_master")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load jobs master:", error.message);
    return [];
  }

  const jobs = data ?? [];
  if (jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const { data: nodeRows } = await supabase
    .from("job_nodes")
    .select("job_id")
    .in("job_id", jobIds);

  const jobsWithBoards = new Set((nodeRows ?? []).map((n) => n.job_id));

  return jobs.map((job) => ({
    ...job,
    has_board: jobsWithBoards.has(job.id),
  }));
}

export async function deleteJobMaster(jobId: string) {
  const supabase = await createClient();

  const { data: job, error: fetchError } = await supabase
    .from("jobs_master")
    .select("org_id, job_number_value")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return { error: fetchError?.message ?? "Job not found." };
  }

  const { error: deleteError } = await supabase
    .from("jobs_master")
    .delete()
    .eq("id", jobId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (job.job_number_value !== null) {
    await supabase.rpc("release_job_number", {
      p_org_id: job.org_id,
      p_number: job.job_number_value,
    });
  }

  revalidatePath("/dashboard/job-master");
  return { success: true };
}
export async function getJobNumberSequence(orgId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("job_number_sequences")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();

  return data;
}

export async function updateJobNumberSequence(
  orgId: string,
  prefix: string,
  nextNumber: number,
  padding: number
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("job_number_sequences")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("job_number_sequences")
      .update({ prefix: prefix || null, next_number: nextNumber, padding })
      .eq("org_id", orgId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("job_number_sequences")
      .insert({ org_id: orgId, prefix: prefix || null, next_number: nextNumber, padding });

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/job-master");
  return { success: true };
}
