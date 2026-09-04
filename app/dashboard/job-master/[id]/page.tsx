import { notFound } from "next/navigation";
import { getJobNodes, getBoardStatuses, getAssignees } from "./actions";
import { getMasterOrgId } from "../actions";
import JobNodeTree from "./job-node-tree";
import { getAuthContext } from "@/lib/auth";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, orgId: viewerOrgId, isSuperAdmin } = await getAuthContext();

  const { data: job } = await supabase
    .from("jobs_master")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  // Access rule, mirrors the Job Master list page (6as): a client can only
  // open a board for a job that's actually theirs. Staff can open any board
  // EXCEPT one a client created privately for themselves — that stays
  // invisible to staff, same privacy rule as the list.
  if (!isSuperAdmin && job.client_org_id !== viewerOrgId) {
    notFound();
  }
  if (isSuperAdmin && job.created_by_client) {
    notFound();
  }

  const masterOrgId = await getMasterOrgId();
  if (!masterOrgId) notFound();

  const [nodes, statuses, assignees] = await Promise.all([
    getJobNodes(id),
    getBoardStatuses(masterOrgId),
    getAssignees(masterOrgId),
  ]);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-6xl">
        <div className="mb-4">
          <a href="/dashboard/job-master" className="text-sm text-[#4FA8D8] hover:underline">← Back to Job Master List</a>
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0]">{job.job_number} — {job.project_name}</h1>
        <p className="text-sm text-[#8B92A0] mb-6">{job.client}</p>

        <JobNodeTree
          jobId={id}
          orgId={masterOrgId}
          initialNodes={nodes}
          statuses={statuses}
          initialAssignees={assignees}
        />
      </div>
    </div>
  );
}
