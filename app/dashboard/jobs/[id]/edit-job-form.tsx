"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateJob } from "./actions";

type Job = {
  id: string;
  job_type: string;
  cost_rate: number;
  margin_percent: number;
  sell_rate: number;
  notes: string | null;
};

export default function EditJobForm({ job }: { job: Job }) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await updateJob(job.id, formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccessMsg(`Saved — new sell rate: $${result?.sellRate}`);
    router.refresh();
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-gray-50 p-6"
    >
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Job type
          </label>
          <select
            name="job_type"
            defaultValue={job.job_type}
            required
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="freight">Freight</option>
            <option value="install">Install</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Cost rate ($)
          </label>
          <input
            name="cost_rate"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={job.cost_rate}
            className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">
          Notes
        </label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={job.notes ?? ""}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-700">
        Current margin: <span className="font-medium">{job.margin_percent}%</span>
        {" · "}
        Current sell rate:{" "}
        <span className="font-semibold text-gray-900">${job.sell_rate}</span>
        <p className="mt-1 text-xs text-gray-400">
          Saving will recalculate the sell rate using the current margin rule
          for this client/carrier.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
    </form>
  );
}