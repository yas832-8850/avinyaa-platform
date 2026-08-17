"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Contact = {
  id: string;
  org_id: string;
  code: string | null;
  name: string;
  address: string;
  address_2: string | null;
  suburb: string | null;
  postcode: string | null;
  state: string | null;
  email: string | null;
  contact_name: string | null;
  phone: string | null;
  is_residential: boolean;
};

export async function getContacts(orgId: string): Promise<Contact[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("org_id", orgId)
    .order("name");

  if (error) {
    console.error("Failed to load contacts:", error.message);
    return [];
  }

  return (data ?? []) as Contact[];
}

export async function createContact(
  orgId: string,
  contact: Omit<Contact, "id" | "org_id">
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      org_id: orgId,
      code: contact.code || null,
      name: contact.name,
      address: contact.address,
      address_2: contact.address_2 || null,
      suburb: contact.suburb || null,
      postcode: contact.postcode || null,
      state: contact.state || null,
      email: contact.email || null,
      contact_name: contact.contact_name || null,
      phone: contact.phone || null,
      is_residential: contact.is_residential || false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/jobs/new/multi-line");
  return { success: true, contact: data as Contact };
}