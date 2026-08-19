"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrganisation(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    console.error("Failed to load organisation:", error.message);
    return null;
  }

  return data;
}

export async function uploadLogo(orgId: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("logo") as File;
  if (!file || file.size === 0) {
    return { error: "No file selected." };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `${orgId}/logo.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from("org-logos")
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("organisations")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", orgId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard/settings/organisation");
  return { success: true, logoUrl: urlData.publicUrl };
}