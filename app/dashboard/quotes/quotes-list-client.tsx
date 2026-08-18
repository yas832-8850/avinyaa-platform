"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createQuote, getJobsForDropdown } from "./actions";

type Quote = {
  id: string;
  quote_name: string;
  created_at: string;
  jobs_master: { job_number: string; project_name: string } | null;
};

type JobOption = {
  id: string;
  job_number: string;
  project_name: string | null;
};

export default function QuotesListClient({
  orgId,
  initialQuotes,
}: {
  orgId: string;
  initialQuotes: Quote[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newQuoteName, setNewQuoteName] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (creating && jobOptions.length === 0) {
      getJobsForDropdown(orgId).then(setJobOptions);
    }
  }, [creating, orgId, jobOptions.length]);

  async function handleCreate() {
    if (!newQuoteName.trim()) return;
    setSubmitting(true);
    const result = await createQuote(orgId, newQuoteName.trim(), selectedJobId || null);
    setSubmitting(false);

    if (result.success && result.quote) {
      router.push(`/dashboard/quotes/${result.quote.id}`);
    }
  }

  return (
    <div>
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
        >
          + New Quote
        </button>
      ) : (
        <div className="border rounded-md p-4 mb-6 bg-gray-50 space-y-3">
          <input
            autoFocus
            className="w-full border rounded px-2 py-1.5 text-sm"
            placeholder="Quote name"
            value={newQuoteName}
            onChange={(e) => setNewQuoteName(e.target.value)}
          />
          <select
            className="w-full border rounded px-2 py-1.5 text-sm"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="">— No linked project —</option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>{j.job_number} — {j.project_name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={submitting || !newQuoteName.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Quote"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-1.5 rounded text-sm border hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border rounded-md divide-y">
        {initialQuotes.length === 0 && (
          <p className="p-4 text-sm text-gray-500 text-center">No quotes yet — create your first one above.</p>
        )}
        {initialQuotes.map((q) => (
          
          <a  key={q.id}
            href={`/dashboard/quotes/${q.id}`}
            className="flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div>
              <div className="text-sm font-medium">{q.quote_name}</div>
              {q.jobs_master && (
                <div className="text-xs text-gray-500">{q.jobs_master.job_number} — {q.jobs_master.project_name}</div>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(q.created_at).toLocaleDateString()}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}