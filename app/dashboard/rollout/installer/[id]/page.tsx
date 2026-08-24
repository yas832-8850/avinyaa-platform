import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getStopsForInstaller, getInstallerById } from "../../actions";

export default async function InstallerRunSheetPage({
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

  const installer = await getInstallerById(id);
  if (!installer) notFound();

  const stops = await getStopsForInstaller(id);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-4">
        <a href="/dashboard/settings/installers" className="text-sm text-blue-600 hover:underline">← Back to Installers</a>
      </div>
      <h1 className="text-lg font-semibold mb-1">Run Sheet — {installer.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{installer.base_state} · {stops.length} stop{stops.length !== 1 ? "s" : ""} assigned</p>

      {stops.length === 0 && (
        <p className="text-sm text-gray-500">No stops assigned to this installer yet.</p>
      )}

      {stops.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Site Name</th>
                <th className="text-left px-3 py-2">Address</th>
                <th className="text-left px-3 py-2">Suburb</th>
                <th className="text-left px-3 py-2">State</th>
                <th className="text-left px-3 py-2">Postcode</th>
                <th className="text-left px-3 py-2">Notes</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop: any, index: number) => (
                <tr key={stop.id} className="border-t">
                  <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                  <td className="px-3 py-2">{stop.site_name}</td>
                  <td className="px-3 py-2">{stop.address}</td>
                  <td className="px-3 py-2">{stop.suburb}</td>
                  <td className="px-3 py-2">{stop.state}</td>
                  <td className="px-3 py-2">{stop.postcode}</td>
                  <td className="px-3 py-2 text-gray-500">{stop.notes || "—"}</td>
                  <td className="px-3 py-2">{stop.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}