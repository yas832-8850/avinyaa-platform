import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getAuthContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organisations(name, type)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const role = profile.role as string;

  return {
    supabase,
    user,
    profile,
    orgId: profile.org_id as string,
    role,
    isSuperAdmin: role === "super_admin",
    isClientAdmin: role === "client_admin",
  };
}