"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/auth";

const MODULES = ["freight", "job_master", "quotes", "installers_rollout", "settings"] as const;

export async function getStaffForOrg() {
  const { supabase, orgId, role } = await getAuthContext();

  if (role !== "super_admin" && role !== "client_admin" && role !== "avinyaa_master") {
    return { error: "Only a master account can view staff." };
  }

  const { data: staff, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("org_id", orgId)
    .in("role", ["client_user", "dispatcher"]);

  if (error) {
    console.error("Failed to load staff:", error.message);
    return { error: error.message };
  }

  const staffIds = (staff ?? []).map((s) => s.id);
  let permissions: any[] = [];

  if (staffIds.length > 0) {
    const { data: permsData } = await supabase
      .from("staff_permissions")
      .select("*")
      .in("user_id", staffIds);
    permissions = permsData ?? [];
  }

  return {
    staff: (staff ?? []).map((s) => ({
      ...s,
      permissions: permissions.filter((p) => p.user_id === s.id),
    })),
  };
}

export async function createStaffAccount(email: string, fullName: string) {
  const { orgId, role } = await getAuthContext();

  if (role !== "super_admin" && role !== "client_admin" && role !== "avinyaa_master") {
    return { error: "Only a master account can create staff." };
  }

  // client_admin creates 'client_user' staff; avinyaa_master (or super_admin
  // acting as one) creates 'dispatcher' staff — the two org-type staff roles.
  const staffRole = role === "client_admin" ? "client_user" : "dispatcher";

  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";

  const adminClient = createAdminClient();

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !newUser.user) {
    return { error: createError?.message ?? "Failed to create account." };
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: newUser.user.id,
    org_id: orgId,
    role: staffRole,
    full_name: fullName,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { success: true, email, tempPassword };
}

export async function setStaffPermission(
  staffUserId: string,
  module: (typeof MODULES)[number],
  accessLevel: "view" | "full" | "none"
) {
  const { orgId, role } = await getAuthContext();

  if (role !== "super_admin" && role !== "client_admin" && role !== "avinyaa_master") {
    return { error: "Only a master account can set permissions." };
  }

  const adminClient = createAdminClient();

  if (accessLevel === "none") {
    const { error } = await adminClient
      .from("staff_permissions")
      .delete()
      .eq("user_id", staffUserId)
      .eq("module", module);
    if (error) return { error: error.message };
    return { success: true };
  }

  const { error } = await adminClient
    .from("staff_permissions")
    .upsert(
      { user_id: staffUserId, org_id: orgId, module, access_level: accessLevel },
      { onConflict: "user_id,module" }
    );

  if (error) return { error: error.message };
  return { success: true };
}