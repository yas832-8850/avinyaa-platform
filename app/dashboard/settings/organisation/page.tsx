import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOrganisation } from "./actions";
import LogoUploadForm from "./logo-upload-form";

export default async function OrganisationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const org = await getOrganisation(profile.org_id);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Organisation Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Upload your logo — it will appear on quote PDFs.</p>
      <LogoUploadForm orgId={profile.org_id} currentLogoUrl={org?.logo_url ?? null} />
    </div>
  );
}