import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getInstallers } from "./actions";
import InstallerManager from "./installer-manager";

export default async function InstallersSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const installers = await getInstallers(profile.org_id);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-3xl">
        <div className="mb-4">
          <a href="/dashboard/settings" className="text-sm text-[#4FA8D8] hover:underline">← Back to Settings</a>
        </div>
        <h1 className="text-lg font-semibold tracking-wide text-[#EDEEF0] mb-1">Installers</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-6" />
        <InstallerManager orgId={profile.org_id} initialInstallers={installers} />
      </div>
    </div>
  );
}
