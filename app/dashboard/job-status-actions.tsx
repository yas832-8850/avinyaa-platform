"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateJobStatus } from "./job-actions";

export default function JobStatusActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate(newStatus: "booked" | "in_progress" | "completed" | "cancelled") {
    setLoading(true);
    const result = await updateJobStatus(jobId, newStatus);
    setLoading(false);

    if (result?.error) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  if (status === "completed" || status === "cancelled") {
    return null; // no further actions once finished or cancelled
  }

  return (
    <div className="flex gap-2">
      {status === "booked" && (
        <button
          onClick={() => handleUpdate("in_progress")}
          disabled={loading}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Start
        </button>
      )}
      {status === "in_progress" && (
        <button
          onClick={() => handleUpdate("completed")}
          disabled={loading}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Complete
        </button>
      )}
      <button
        onClick={() => handleUpdate("cancelled")}
        disabled={loading}
        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}