"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCarrier(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const serviceType = formData.get("service_type") as string;

  if (!name || !serviceType) {
    return { error: "Name and service type are required" };
  }

  const { error } = await supabase.from("carriers").insert({
    name,
    service_type: serviceType,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/carriers");
  return { success: true };
}