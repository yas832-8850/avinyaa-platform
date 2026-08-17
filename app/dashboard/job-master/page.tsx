import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getJobsMaster } from "./actions";
import NewJobMasterForm from "./new-job-master-form";

export default async function JobMasterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const jobs = await getJobsMaster(profile.org_id);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-semibold mb-4">Job Master List</h1>

      <NewJobMasterForm orgId={profile.org_id} />

      <div className="mt-6 border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Job #</th>
              <th className="p-2">Client</th>
              <th className="p-2">Project Name</th>
              <th className="p-2">Account Manager</th>
              <th className="p-2">Client Contact</th>
              <th className="p-2">Date</th>
              <th className="p-2">Server Link</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No jobs yet — create your first one above.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="border-t">
                <td className="p-2 font-medium">{job.job_number}</td>
                <td className="p-2">{job.client}</td>
                <td className="p-2">{job.project_name}</td>
                <td className="p-2">{job.account_manager}</td>
                <td className="p-2">{job.client_contact}</td>
                <td className="p-2">{job.job_date ?? "—"}</td>
                <td className="p-2">
                  {job.server_link ? (
                    
                     <a href={job.server_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}