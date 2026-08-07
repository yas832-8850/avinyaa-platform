import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobStatusActions from "./job-status-actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organisations(name, type)")
    .eq("id", user!.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {profile?.organisations?.name ?? "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as {user!.email} — role: {profile?.role}
          </p>
        </div>
        <div className="flex gap-2">
          
           <a href="/dashboard/book"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Book a job
          </a>
          {isSuperAdmin && (
            <>
              
               <a href="/dashboard/jobs"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                All jobs
              </a>
              
               <a href="/dashboard/carriers"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Manage carriers
              </a>
              
               <a href="/dashboard/margin-rules"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Margin rules
              </a>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">
          {isSuperAdmin ? "Jobs" : "Your jobs"}
        </h2>
        {jobs && jobs.length > 0 ? (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Type</th>
                <th className="py-2">Status</th>
                <th className="py-2">
                  {isSuperAdmin ? "Sell rate" : "Rate"}
                </th>
                <th className="py-2">Booked</th>
                {isSuperAdmin && <th className="py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="py-2 capitalize">{job.job_type}</td>
                  <td className="py-2 capitalize">
                    {job.status.replace("_", " ")}
                  </td>
                  <td className="py-2">${job.sell_rate}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  {isSuperAdmin && (
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <JobStatusActions jobId={job.id} status={job.status} />
                        
                         <a href={`/dashboard/jobs/${job.id}`}
                          className="text-xs font-medium text-gray-500 hover:underline"
                        >
                          Edit
                        </a>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            {isSuperAdmin
              ? "No jobs yet — this is expected on a fresh database."
              : "No jobs yet for your account."}
          </p>
        )}
      </div>
    </div>
  );
}