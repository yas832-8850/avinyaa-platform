import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; carrier?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-gray-600">This page is only available to the master account.</p>
      </div>
    );
  }

  const { data: organisations } = await supabase.from("organisations").select("id, name").eq("type", "client").order("name");
  const { data: carriers } = await supabase.from("carriers").select("id, name").order("name");

  let query = supabase.from("jobs").select("*, organisations(name), carriers(name)").order("created_at", { ascending: false });

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

  return (
    <div className="mx-auto max-w-5xl p-8">
      <a href="/dashboard" className="text-sm text-gray-500 hover:underline">← Back to dashboard</a>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">All Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">
        {jobs?.length ?? 0} job{jobs?.length === 1 ? "" : "s"} · Total value: <span className="font-medium text-gray-900">${totalSellValue.toFixed(2)}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Client:</span>
        <a href={buildFilterUrl({ org: undefined })} className={`rounded px-2 py-1 ${!params.org ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"}`}>All</a>
        {organisations?.map((org) => (
          <a key={org.id} href={buildFilterUrl({ org: org.id })} className={`rounded px-2 py-1 ${params.org === org.id ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"}`}>{org.name}</a>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Carrier:</span>
        <a href={buildFilterUrl({ carrier: undefined })} className={`rounded px-2 py-1 ${!params.carrier ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"}`}>All</a>
        {carriers?.map((c) => (
          <a key={c.id} href={buildFilterUrl({ carrier: c.id })} className={`rounded px-2 py-1 ${params.carrier === c.id ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"}`}>{c.name}</a>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Status:</span>
        {statusOptions.map((s) => (
          <a key={s || "all"} href={buildFilterUrl({ status: s || undefined })} className={`rounded px-2 py-1 capitalize ${params.status === s || (!params.status && s === "") ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700"}`}>{s ? s.replace("_", " ") : "All"}</a>
        ))}
      </div>

      <div className="mt-6">
        {jobs && jobs.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Client</th>
                <th className="py-2">Carrier</th>
                <th className="py-2">Type</th>
                <th className="py-2">Status</th>
                <th className="py-2">Sell rate</th>
                <th className="py-2">Booked</th>
                <th className="py-2">Edit</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr key={job.id} className="border-b">
                  <td className="py-2">{job.organisations?.name ?? "—"}</td>
                  <td className="py-2">{job.carriers?.name ?? "—"}</td>
                  <td className="py-2 capitalize">{job.job_type}</td>
                  <td className="py-2 capitalize">{job.status.replace("_", " ")}</td>
                  <td className="py-2">${job.sell_rate}</td>
                  <td className="py-2 text-gray-500">{new Date(job.created_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    <a href={`/dashboard/jobs/${job.id}`} className="text-xs font-medium text-gray-500 hover:underline">Edit</a>
                    {job.status === "completed" && (
                      <a href={`/api/invoice/${job.id}`} target="_blank" className="ml-3 text-xs font-medium text-gray-500 hover:underline">Invoice</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No jobs match these filters.</p>
        )}
      </div>
    </div>
  );
}