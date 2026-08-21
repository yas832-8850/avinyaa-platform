"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ParsedStop = {
  site_name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  notes?: string;
};

export async function createRolloutUpload(
  orgId: string,
  userId: string,
  fileName: string,
  stops: ParsedStop[]
) {
  const supabase = await createClient();

  const { data: upload, error: uploadError } = await supabase
    .from("rollout_uploads")
    .insert({ org_id: orgId, file_name: fileName, uploaded_by: userId })
    .select()
    .single();

  if (uploadError || !upload) {
    console.error("Failed to create rollout upload:", uploadError?.message);
    return { success: false, error: uploadError?.message };
  }

  const rowsToInsert = stops.map((stop) => ({
    rollout_upload_id: upload.id,
    org_id: orgId,
    site_name: stop.site_name,
    address: stop.address,
    suburb: stop.suburb,
    state: stop.state,
    postcode: stop.postcode,
    notes: stop.notes || null,
  }));

  const { error: stopsError } = await supabase
    .from("rollout_stops")
    .insert(rowsToInsert);

  if (stopsError) {
    console.error("Failed to insert rollout stops:", stopsError.message);
    return { success: false, error: stopsError.message };
  }

  revalidatePath("/dashboard/rollout");
  return { success: true, uploadId: upload.id };
}

export async function getRolloutUploads(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rollout_uploads")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load rollout uploads:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getRolloutStops(uploadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rollout_stops")
    .select("*, installers(name)")
    .eq("rollout_upload_id", uploadId)
    .order("state", { ascending: true })
    .order("postcode", { ascending: true });

  if (error) {
    console.error("Failed to load rollout stops:", error.message);
    return [];
  }

  return data ?? [];
}

export async function assignInstaller(stopId: string, installerId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rollout_stops")
    .update({ installer_id: installerId })
    .eq("id", stopId);

  if (error) {
    console.error("Failed to assign installer:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/rollout");
  return { success: true };
}

export async function deleteRolloutUpload(uploadId: string) {
  const supabase = await createClient();

  const { error: stopsError } = await supabase
    .from("rollout_stops")
    .delete()
    .eq("rollout_upload_id", uploadId);

  if (stopsError) {
    console.error("Failed to delete rollout stops:", stopsError.message);
    return { success: false, error: stopsError.message };
  }

  const { error: uploadError } = await supabase
    .from("rollout_uploads")
    .delete()
    .eq("id", uploadId);

  if (uploadError) {
    console.error("Failed to delete rollout upload:", uploadError.message);
    return { success: false, error: uploadError.message };
  }

  revalidatePath("/dashboard/rollout");
  return { success: true };
}
export async function getInstallersForDropdown(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installers")
    .select("id, name, base_state")
    .eq("org_id", orgId)
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Failed to load installers:", error.message);
    return [];
  }

  return data ?? [];
}