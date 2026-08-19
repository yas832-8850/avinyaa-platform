"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/assignees");
  return { success: true, assignee: data };
}

export async function deleteAssignee(assigneeId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("assignees")
    .delete()
    .eq("id", assigneeId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/assignees");
  return { success: true };
}