"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteJobMaster } from "./actions";
import { createEmptyBoard } from "./[id]/actions";

type JobMaster = {
  id: string;
  job_number: string;
  client: string | null;
  project_name: string | null;
  account_manager: string | null;
  client_contact: string | null;
  job_date: string | null;
  server_link: string | null;
  has_board?: boolean;
};

export default function JobsMasterTable({ jobs }: { jobs: JobMaster[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingBoardId, setCreatingBoardId] = useState<string | null>(null);

  async function handleDelete(id: string, jobNumber: string) {
    const confirmed = window.confirm(`Delete job ${jobNumber}? This can't be undone.`);
    if (!confirmed) return;
    setDeletingId(id);
    const result = await deleteJobMaster(id);
    setDeletingId(null);
    if (result.error) {
      alert(`Failed to delete: ${result.error}`);
      return;
    }
    router.refresh();
  }

  async function handleAddBoard(jobId: string) {
    setCreatingBoardId(jobId);
    const result = await createEmptyBoard(jobId);
    setCreatingBoardId(null);
    if (result.error) {
      alert(`Failed to create board: ${result.error}`);
      return;
    }
    router.push(`/dashboard/job-master/${jobId}`);
  }

  return (
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
            <th className="p-2">Board</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 && (
            <tr>
              <td colSpan={9} className="p-4 text-center text-gray-500">
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
                {job.server_link ? (<a href={job.server_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open</a>) : ("—")}
              </td>
              <td className="p-2">
                {job.has_board ? (
                  <a href={`/dashboard/job-master/${job.id}`} className="text-blue-600 hover:underline text-sm">
                    Open Board
                  </a>
                ) : (
                  <button
                    onClick={() => handleAddBoard(job.id)}
                    disabled={creatingBoardId === job.id}
                    className="text-blue-600 hover:underline text-sm disabled:opacity-50"
                  >
                    {creatingBoardId === job.id ? "Creating..." : "+ Add Board"}
                  </button>
                )}
              </td>
              <td className="p-2">
                <button
                  onClick={() => handleDelete(job.id, job.job_number)}
                  disabled={deletingId === job.id}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === job.id ? "..." : "✕"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
