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
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Organisation Settings</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-6">Upload your logo — it will appear on quote PDFs.</p>
        <LogoUploadForm orgId={profile.org_id} currentLogoUrl={org?.logo_url ?? null} />
      </div>
    </div>
  );
}