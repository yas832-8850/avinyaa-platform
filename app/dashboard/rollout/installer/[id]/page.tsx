import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getStopsForInstaller, getInstallerById } from "../../actions";
import StatusChip from "../../../../components/ui/StatusChip";

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
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-4xl">
        <div className="mb-4">
          <a href="/dashboard/settings/installers" className="text-sm text-[#4FA8D8] hover:underline">← Back to Installers</a>
        </div>
        <h1 className="text-lg font-semibold tracking-wide text-[#EDEEF0] mb-1">Run Sheet — {installer.name}</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-4 font-mono">{installer.base_state} · {stops.length} stop{stops.length !== 1 ? "s" : ""} assigned</p>

        {stops.length === 0 && (
          <p className="text-sm text-[#8B92A0]">No stops assigned to this installer yet.</p>
        )}

        {stops.length > 0 && (
          <div className="border border-[#2C313A]">
            <table className="w-full text-sm">
              <thead className="bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Site Name</th>
                  <th className="px-3 py-3">Address</th>
                  <th className="px-3 py-3">Suburb</th>
                  <th className="px-3 py-3">State</th>
                  <th className="px-3 py-3">Postcode</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((stop: any, index: number) => (
                  <tr key={stop.id} className="border-t border-[#2C313A] text-[#EDEEF0]">
                    <td className="px-3 py-3 text-[#8B92A0] font-mono">{index + 1}</td>
                    <td className="px-3 py-3">{stop.site_name}</td>
                    <td className="px-3 py-3">{stop.address}</td>
                    <td className="px-3 py-3">{stop.suburb}</td>
                    <td className="px-3 py-3">{stop.state}</td>
                    <td className="px-3 py-3 font-mono">{stop.postcode}</td>
                    <td className="px-3 py-3 text-[#8B92A0]">{stop.notes || "—"}</td>
                    <td className="px-3 py-3"><StatusChip status={stop.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
