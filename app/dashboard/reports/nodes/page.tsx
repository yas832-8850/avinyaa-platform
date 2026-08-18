import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllNodesReport } from "./actions";
import NodesReportTable from "./nodes-report-table";

export default async function NodesReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { nodes, statuses, assignees } = await getAllNodesReport(profile.org_id);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4">
        <a href="/dashboard/job-master" className="text-sm text-blue-600 hover:underline">← Back to Job Master List</a>
      </div>
      <h1 className="text-xl font-semibold mb-1">All Tasks Report</h1>
      <p className="text-sm text-gray-500 mb-6">Flat view of every item across all job trees.</p>
      <NodesReportTable nodes={nodes} statuses={statuses} assignees={assignees} />
    </div>
  );
}