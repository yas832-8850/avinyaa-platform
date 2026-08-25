import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getRolloutUploads } from "./actions";
import RolloutUploadForm from "./rollout-upload-form";

export default async function RolloutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const uploads = await getRolloutUploads(profile.org_id);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-4xl">
        <h1 className="text-lg font-semibold tracking-wide text-[#EDEEF0] mb-1">Rollout Planning</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-6" />
        <RolloutUploadForm orgId={profile.org_id} userId={user.id} initialUploads={uploads} />
      </div>
    </div>
  );
}
