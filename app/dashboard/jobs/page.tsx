import StatusChip from "../../components/ui/StatusChip";
import { getAuthContext } from "@/lib/auth";

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; carrier?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { supabase, orgId, isSuperAdmin } = await getAuthContext();

  const { data: organisations } = await supabase.from("organisations").select("id, name").eq("type", "client").order("name");
  const { data: carriers } = await supabase.from("carriers").select("id, name").order("name");

  let query = supabase.from("jobs").select("*, organisations(name), carriers(name)").order("created_at", { ascending: false });

  if (!isSuperAdmin) {
    query = query.eq("org_id", orgId);
  }

  if (params.org) query = query.eq("org_id", params.org);
  if (params.carrier) query = query.eq("carrier_id", params.carrier);
  if (params.status) query = query.eq("status", params.status);

  const { data: jobs } = await query;

  const totalSellValue = jobs?.reduce((sum, job) => sum + Number(job.sell_rate), 0) ?? 0;

  function buildFilterUrl(newParams: Record<string, string | undefined>) {
    const merged = { ...params, ...newParams };
    const search = new URLSearchParams();
    if (merged.org) search.set("org", merged.org);
    if (merged.carrier) search.set("carrier", merged.carrier);
    if (merged.status) search.set("status", merged.status);
    const qs = search.toString();
    return `/dashboard/jobs${qs ? `?${qs}` : ""}`;
  }

  const statusOptions = ["", "booked", "in_progress", "completed", "cancelled"];
  const activePill = "px-2 py-1 bg-[#F0A83A] text-[#15181D]";
  const inactivePill = "px-2 py-1 border border-[#2C313A] text-[#8B92A0] hover:border-[#F0A83A] hover:text-[#EDEEF0]";

  return (
    <div className="min-h-screen bg-[#15181D] p-8">
      <div className="mx-auto max-w-5xl">
        <a href="/dashboard" className="text-sm text-[#4FA8D8] hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-semibold tracking-wide text-[#EDEEF0]">{isSuperAdmin ? "All Jobs" : "Your Jobs"}</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mt-2 mb-2" />
        <p className="text-sm text-[#8B92A0]">
          {jobs?.length ?? 0} job{jobs?.length === 1 ? "" : "s"} · Total value: <span className="font-mono text-[#EDEEF0]">${totalSellValue.toFixed(2)}</span>
        </p>

        {isSuperAdmin && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#8B92A0]">Client:</span>
              <a href={buildFilterUrl({ org: undefined })} className={!params.org ? activePill : inactivePill}>All</a>
              {organisations?.map((org) => (
                <a key={org.id} href={buildFilterUrl({ org: org.id })} className={params.org === org.id ? activePill : inactivePill}>{org.name}</a>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#8B92A0]">Carrier:</span>
              <a href={buildFilterUrl({ carrier: undefined })} className={!params.carrier ? activePill : inactivePill}>All</a>
              {carriers?.map((c) => (
                <a key={c.id} href={buildFilterUrl({ carrier: c.id })} className={params.carrier === c.id ? activePill : inactivePill}>{c.name}</a>
              ))}
            </div>
          </>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[#8B92A0]">Status:</span>
          {statusOptions.map((s) => (
            <a key={s || "all"} href={buildFilterUrl({ status: s || undefined })} className={`capitalize ${params.status === s || (!params.status && s === "") ? activePill : inactivePill}`}>{s ? s.replace("_", " ") : "All"}</a>
          ))}
        </div>

        <div className="mt-6">
          {jobs && jobs.length > 0 ? (
            <div className="border border-[#2C313A]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C313A] bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
                    {isSuperAdmin && <th className="px-3 py-3">Client</th>}
                    <th className="px-3 py-3">Carrier</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">{isSuperAdmin ? "Sell rate" : "Rate"}</th>
                    <th className="px-3 py-3">Booked</th>
                    {isSuperAdmin && <th className="px-3 py-3">Edit</th>}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: any) => (
                    <tr key={job.id} className="border-b border-[#2C313A] text-[#EDEEF0] last:border-b-0">
                      {isSuperAdmin && <td className="px-3 py-3">{job.organisations?.name ?? "—"}</td>}
                      <td className="px-3 py-3">{job.carriers?.name ?? "—"}</td>
                      <td className="px-3 py-3 capitalize">{job.job_type}</td>
                      <td className="px-3 py-3"><StatusChip status={job.status} /></td>
                      <td className="px-3 py-3 font-mono">${job.sell_rate}</td>
                      <td className="px-3 py-3 font-mono text-[#8B92A0]">{new Date(job.created_at).toLocaleDateString()}</td>
                      {isSuperAdmin && (
                        <td className="px-3 py-3">
                          <a href={`/dashboard/jobs/${job.id}`} className="text-xs font-medium text-[#4FA8D8] hover:underline">Edit</a>
                          {job.status === "completed" && (
                            <a href={`/api/invoice/${job.id}`} target="_blank" className="ml-3 text-xs font-medium text-[#4FA8D8] hover:underline">Invoice</a>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#8B92A0]">No jobs match these filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
