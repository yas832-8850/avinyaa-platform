import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getRolloutStops } from "../actions";
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

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-4">
        <a href="/dashboard/rollout" className="text-sm text-blue-600 hover:underline">← Back to Rollout Planning</a>
      </div>
      <RolloutDetailView uploadId={id} initialStops={stops as any} />
    </div>
  );
}