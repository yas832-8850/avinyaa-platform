"use client";

import { useState, useMemo } from "react";

type Node = {
  id: string;
  job_id: string;
  name: string;
  depth: number;
  job_number: string;
  project_name: string;
  status_id: string | null;
  status_label: string | null;
  status_color: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  start_date: string | null;
  due_date: string | null;
};

type Status = {
  id: string;
  label: string;
  color: string;
};

type Assignee = {
  id: string;
  name: string;
};

export default function NodesReportTable({
  nodes,
  statuses,
  assignees,
}: {
  nodes: Node[];
  statuses: Status[];
  assignees: Assignee[];
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");

  const jobOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const n of nodes) {
      if (!seen.has(n.job_id)) {
        seen.set(n.job_id, `${n.job_number} — ${n.project_name}`);
      }
    }
    return Array.from(seen.entries());
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (statusFilter && n.status_id !== statusFilter) return false;
      if (assigneeFilter && n.assignee_id !== assigneeFilter) return false;
      if (jobFilter && n.job_id !== jobFilter) return false;
      return true;
    });
  }, [nodes, statusFilter, assigneeFilter, jobFilter]);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select
          className="border rounded px-2 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1.5 text-sm"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All assignees</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1.5 text-sm"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
        >
          <option value="">All jobs</option>
          {jobOptions.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        {(statusFilter || assigneeFilter || jobFilter) && (
          <button
            onClick={() => { setStatusFilter(""); setAssigneeFilter(""); setJobFilter(""); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Job #</th>
              <th className="p-2">Item</th>
              <th className="p-2">Status</th>
              <th className="p-2">Assignee</th>
              <th className="p-2">Start</th>
              <th className="p-2">Due</th>
            </tr>
          </thead>
          <tbody>
            {filteredNodes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No items match the current filters.
                </td>
              </tr>
            )}
            {filteredNodes.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="p-2">
                  <a href={`/dashboard/job-master/${n.job_id}`} className="text-blue-600 hover:underline">
                    {n.job_number}
                  </a>
                </td>
                <td className="p-2">
                  <span style={{ paddingLeft: `${n.depth * 16}px` }}>{n.name}</span>
                </td>
                <td className="p-2">
                  {n.status_label ? (
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: `${n.status_color}22` }}
                    >
                      {n.status_label}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-2">{n.assignee_name ?? "—"}</td>
                <td className="p-2">{n.start_date ?? "—"}</td>
                <td className="p-2">{n.due_date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
