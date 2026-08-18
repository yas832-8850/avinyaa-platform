"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getJobNodes(jobId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_nodes")
    .select("*")
    .eq("job_id", jobId)
    .order("position");

  if (error) {
    console.error("Failed to load job nodes:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getBoardStatuses(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("board_statuses")
    .select("*")
    .eq("org_id", orgId)
    .order("position");

  if (error) {
    console.error("Failed to load statuses:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAssignees(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assignees")
    .select("*")
    .eq("org_id", orgId)
    .order("name");

  if (error) {
    console.error("Failed to load assignees:", error.message);
    return [];
  }

  return data ?? [];
}

export async function createAssignee(orgId: string, name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assignees")
    .insert({ org_id: orgId, name })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, assignee: data };
}

export async function createJobNode(
  jobId: string,
  parentId: string | null,
  name: string,
  position: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_nodes")
    .insert({
      job_id: jobId,
      parent_id: parentId,
      name,
      position,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/job-master/${jobId}`);
  return { success: true, node: data };
}

export async function updateJobNode(
  nodeId: string,
  jobId: string,
  updates: {
    name?: string;
    status_id?: string | null;
    assignee_id?: string | null;
    start_date?: string | null;
    due_date?: string | null;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_nodes")
    .update(updates)
    .eq("id", nodeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/job-master/${jobId}`);
  return { success: true };
}

export async function deleteJobNode(nodeId: string, jobId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_nodes")
    .delete()
    .eq("id", nodeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/job-master/${jobId}`);
  return { success: true };
}

export async function createEmptyBoard(jobId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_nodes")
    .insert({
      job_id: jobId,
      parent_id: null,
      name: "New item",
      position: 0,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/job-master");
  return { success: true };
}

export async function swapNodePositions(
  nodeIdA: string,
  positionA: number,
  nodeIdB: string,
  positionB: number
) {
  const supabase = await createClient();

  const { error: errorA } = await supabase
    .from("job_nodes")
    .update({ position: positionB })
    .eq("id", nodeIdA);

  const { error: errorB } = await supabase
    .from("job_nodes")
    .update({ position: positionA })
    .eq("id", nodeIdB);

  if (errorA || errorB) {
    return { error: errorA?.message ?? errorB?.message };
  }

  return { success: true };
}