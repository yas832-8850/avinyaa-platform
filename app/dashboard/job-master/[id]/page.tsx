import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getJobNodes, getBoardStatuses, getAssignees } from "./actions";
import JobNodeTree from "./job-node-tree";

export default async function JobDetailPage({
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

  const { data: job } = await supabase
    .from("jobs_master")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const [nodes, statuses, assignees] = await Promise.all([
    getJobNodes(id),
    getBoardStatuses(profile.org_id),
    getAssignees(profile.org_id),
  ]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4">
        <a href="/dashboard/job-master" className="text-sm text-blue-600 hover:underline">← Back to Job Master List</a>
      </div>
      <h1 className="text-xl font-semibold">{job.job_number} — {job.project_name}</h1>
      <p className="text-sm text-gray-500 mb-6">{job.client}</p>

      <JobNodeTree
        jobId={id}
        orgId={profile.org_id}
        initialNodes={nodes}
        statuses={statuses}
        initialAssignees={assignees}
      />
    </div>
  );
}