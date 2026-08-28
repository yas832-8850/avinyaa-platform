import JobStatusActions from "./job-status-actions";
import SignOutButton from "./signout-button";
import Button from "../components/ui/Button";
import StatusChip from "../components/ui/StatusChip";
import { getAuthContext } from "@/lib/auth";

export default async function DashboardPage() {
  const { supabase, user, profile, orgId, isSuperAdmin } = await getAuthContext();

  let jobsQuery = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isSuperAdmin) {
    jobsQuery = jobsQuery.eq("org_id", orgId);
  }

  const { data: jobs } = await jobsQuery;

  const jobsWithPods = await Promise.all(
    (jobs ?? []).map(async (job) => {
      const { data: podFiles } = await supabase.storage.from("pods").list(job.id);
      const pods = await Promise.all(
        (podFiles ?? []).map(async (file) => {
          const { data } = await supabase.storage
            .from("pods")
            .createSignedUrl(`${job.id}/${file.name}`, 3600);
          return { name: file.name, url: data?.signedUrl ?? "" };
        })
      );
      return { ...job, pods };
    })
  );

  return (
    <div className="min-h-screen bg-[#15181D]">
      <div className="mx-auto max-w-4xl p-8">
        <div className="flex items-start justify-between border-b border-[#2C313A] pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#EDEEF0]">
              {profile?.organisations?.name ?? "Dashboard"}
            </h1>
            <p className="mt-1 font-mono text-sm text-[#8B92A0]">
              {user!.email} · {profile?.role}
            </p>
            <div className="mt-2">
              <SignOutButton />
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/dashboard/book"><Button variant="primary">Book a job</Button></a>
            {isSuperAdmin && (
              <>
                <a href="/dashboard/jobs"><Button variant="secondary">All jobs</Button></a>
                <a href="/dashboard/carriers"><Button variant="secondary">Manage carriers</Button></a>
                <a href="/dashboard/margin-rules"><Button variant="secondary">Margin rules</Button></a>
              </>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.15em] text-[#8B92A0]">
            {isSuperAdmin ? "Jobs" : "Your jobs"}
          </h2>
          {jobsWithPods && jobsWithPods.length > 0 ? (
            <div className="mt-4 border border-[#2C313A]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C313A] bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">{isSuperAdmin ? "Sell rate" : "Rate"}</th>
                    <th className="px-3 py-3">Booked</th>
                    <th className="px-3 py-3">Files</th>
                    {isSuperAdmin && <th className="px-3 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {jobsWithPods.map((job: any) => (
                    <tr key={job.id} className="border-b border-[#2C313A] text-[#EDEEF0] last:border-b-0">
                      <td className="px-3 py-3 capitalize">{job.job_type}</td>
                      <td className="px-3 py-3"><StatusChip status={job.status} /></td>
                      <td className="px-3 py-3 font-mono">${job.sell_rate}</td>
                      <td className="px-3 py-3 font-mono text-[#8B92A0]">{new Date(job.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        {job.pods.length > 0 ? (
                          job.pods.map((pod: any) => (
                            <a key={pod.url} href={pod.url} target="_blank" className="mr-2 text-xs text-[#4FA8D8] hover:underline">{pod.name}</a>
                          ))
                        ) : (
                          <span className="text-xs text-[#565C68]">—</span>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <JobStatusActions jobId={job.id} status={job.status} />
                            <a href={`/dashboard/jobs/${job.id}`} className="text-xs font-medium text-[#4FA8D8] hover:underline">Edit</a>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#8B92A0]">
              {isSuperAdmin
                ? "No jobs yet — this is expected on a fresh database."
                : "No jobs yet for your account."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
