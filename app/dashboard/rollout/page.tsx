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
    <div className="p-6 max-w-4xl">
      <h1 className="text-lg font-semibold mb-4">Rollout Planning</h1>
      <RolloutUploadForm orgId={profile.org_id} userId={user.id} initialUploads={uploads} />
    </div>
  );
}