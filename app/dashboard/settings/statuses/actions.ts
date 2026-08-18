"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStatuses(orgId: string) {
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

export async function createStatus(orgId: string, label: string, color: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("board_statuses")
    .select("position")
    .eq("org_id", orgId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { data, error } = await supabase
    .from("board_statuses")
    .insert({ org_id: orgId, label, color, position: nextPosition })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/statuses");
  return { success: true, status: data };
}

export async function updateStatus(
  statusId: string,
  updates: { label?: string; color?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("board_statuses")
    .update(updates)
    .eq("id", statusId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/statuses");
  return { success: true };
}

export async function deleteStatus(statusId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("board_statuses")
    .delete()
    .eq("id", statusId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/statuses");
  return { success: true };
}

export async function swapStatusPositions(
  statusIdA: string,
  positionA: number,
  statusIdB: string,
  positionB: number
) {
  const supabase = await createClient();

  const { error: errorA } = await supabase
    .from("board_statuses")
    .update({ position: positionB })
    .eq("id", statusIdA);

  const { error: errorB } = await supabase
    .from("board_statuses")
    .update({ position: positionA })
    .eq("id", statusIdB);

  if (errorA || errorB) {
    return { error: errorA?.message ?? errorB?.message };
  }

  revalidatePath("/dashboard/settings/statuses");
  return { success: true };
}