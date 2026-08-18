"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAllNodesReport(orgId: string) {
  const supabase = await createClient();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs_master")
    .select("id, job_number, project_name")
    .eq("org_id", orgId);

  if (jobsError || !jobs || jobs.length === 0) {
    return { nodes: [], statuses: [], assignees: [] };
  }

  const jobIds = jobs.map((j) => j.id);

  const { data: nodes } = await supabase
    .from("job_nodes")
    .select("*")
    .in("job_id", jobIds);

  const { data: statuses } = await supabase
    .from("board_statuses")
    .select("*")
    .eq("org_id", orgId);

  const { data: assignees } = await supabase
    .from("assignees")
    .select("*")
    .eq("org_id", orgId);

  // Compute depth for each node by walking up parent_id chains
  const nodeMap = new Map((nodes ?? []).map((n) => [n.id, n]));
  function getDepth(node: any): number {
    let depth = 0;
    let current = node;
    while (current.parent_id) {
      const parent = nodeMap.get(current.parent_id);
      if (!parent) break;
      depth++;
      current = parent;
    }
    return depth;
  }

  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const statusMap = new Map((statuses ?? []).map((s) => [s.id, s]));
  const assigneeMap = new Map((assignees ?? []).map((a) => [a.id, a]));

  const enrichedNodes = (nodes ?? []).map((n) => ({
    ...n,
    depth: getDepth(n),
    job_number: jobMap.get(n.job_id)?.job_number ?? "",
    project_name: jobMap.get(n.job_id)?.project_name ?? "",
    status_label: n.status_id ? statusMap.get(n.status_id)?.label ?? null : null,
    status_color: n.status_id ? statusMap.get(n.status_id)?.color ?? null : null,
    assignee_name: n.assignee_id ? assigneeMap.get(n.assignee_id)?.name ?? null : null,
  }));

  return {
    nodes: enrichedNodes,
    statuses: statuses ?? [],
    assignees: assignees ?? [],
  };
}