import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getRolloutStops, getInstallersForDropdown } from "../actions";
import RolloutDetailView from "./rollout-detail-view";

export default async function RolloutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const stops = await getRolloutStops(id);
  if (!stops) notFound();

  const installers = await getInstallersForDropdown(profile.org_id);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-5xl">
        <div className="mb-4">
          <a href="/dashboard/rollout" className="text-sm text-[#4FA8D8] hover:underline">← Back to Rollout Planning</a>
        </div>
        <RolloutDetailView uploadId={id} initialStops={stops as any} installers={installers} />
      </div>
    </div>
  );
}
