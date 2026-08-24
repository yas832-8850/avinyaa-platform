import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getRolloutStops } from "../actions";

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
      <h1 className="text-lg font-semibold mb-4">Rollout Stops — {stops.length} total</h1>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Site Name</th>
              <th className="text-left px-3 py-2">Address</th>
              <th className="text-left px-3 py-2">Suburb</th>
              <th className="text-left px-3 py-2">State</th>
              <th className="text-left px-3 py-2">Postcode</th>
              <th className="text-left px-3 py-2">Installer</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop: any) => (
              <tr key={stop.id} className="border-t">
                <td className="px-3 py-2">{stop.site_name}</td>
                <td className="px-3 py-2">{stop.address}</td>
                <td className="px-3 py-2">{stop.suburb}</td>
                <td className="px-3 py-2">{stop.state}</td>
                <td className="px-3 py-2">{stop.postcode}</td>
                <td className="px-3 py-2">{stop.installers?.name ?? "— unassigned —"}</td>
                <td className="px-3 py-2">{stop.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}