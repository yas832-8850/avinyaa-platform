"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createQuote, getJobsForDropdown } from "./actions";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

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
        <div className="mb-6">
          <Button variant="primary" onClick={() => setCreating(true)}>+ New Quote</Button>
        </div>
      ) : (
        <div className="border border-[#2C313A] bg-[#1E2229] p-4 mb-6 space-y-3">
          <Input autoFocus placeholder="Quote name" value={newQuoteName} onChange={(e) => setNewQuoteName(e.target.value)} />
          <Select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
            <option value="">— No linked project —</option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>{j.job_number} — {j.project_name}</option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleCreate} disabled={submitting || !newQuoteName.trim()}>
              {submitting ? "Creating..." : "Create Quote"}
            </Button>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="border border-[#2C313A] divide-y divide-[#2C313A]">
        {initialQuotes.length === 0 && (
          <p className="p-4 text-sm text-[#8B92A0] text-center">No quotes yet — create your first one above.</p>
        )}
        {initialQuotes.map((q) => (
          <a key={q.id} href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between p-3 hover:bg-[#1E2229]">
            <div>
              <div className="text-sm font-medium text-[#EDEEF0]">{q.quote_name}</div>
              {q.jobs_master && (
                <div className="text-xs text-[#8B92A0] font-mono">{q.jobs_master.job_number} — {q.jobs_master.project_name}</div>
              )}
            </div>
            <div className="text-xs text-[#565C68] font-mono">{new Date(q.created_at).toLocaleDateString()}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
