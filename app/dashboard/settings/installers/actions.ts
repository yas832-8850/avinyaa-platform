"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getInstallers(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installers")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load installers:", error.message);
    return [];
  }

  return data ?? [];
}

export async function createInstaller(
  orgId: string,
  name: string,
  phone: string,
  baseState: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installers")
    .insert({ org_id: orgId, name, phone: phone || null, base_state: baseState })
    .select()
    .single();

  if (error) {
    console.error("Failed to create installer:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings/installers");
  return { success: true, installer: data };
}

export async function updateInstaller(
  installerId: string,
  updates: { name?: string; phone?: string | null; base_state?: string; active?: boolean }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("installers")
    .update(updates)
    .eq("id", installerId);

  if (error) {
    console.error("Failed to update installer:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings/installers");
  return { success: true };
}

export async function deleteInstaller(installerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("installers")
    .delete()
    .eq("id", installerId);

  if (error) {
    console.error("Failed to delete installer:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings/installers");
  return { success: true };
}