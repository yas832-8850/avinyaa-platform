"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateJob } from "./actions";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

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
      className="flex flex-col gap-4 border border-[#2C313A] bg-[#1E2229] p-6"
    >
      <div className="flex flex-wrap gap-3">
        <Select name="job_type" defaultValue={job.job_type} required label="Job type">
          <option value="freight">Freight</option>
          <option value="install">Install</option>
        </Select>

        <div className="w-28">
          <Input name="cost_rate" type="number" step="0.01" min="0" required defaultValue={job.cost_rate} label="Cost rate ($)" />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={job.notes ?? ""}
          className="w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]"
        />
      </div>

      <div className="border border-dashed border-[#2C313A] bg-[#15181D] p-3 text-sm text-[#EDEEF0]">
        Current margin: <span className="font-mono text-[#F0A83A]">{job.margin_percent}%</span>
        {" · "}
        Current sell rate: <span className="font-mono font-semibold">${job.sell_rate}</span>
        <p className="mt-1 text-xs text-[#8B92A0]">
          Saving will recalculate the sell rate using the current margin rule
          for this client/carrier.
        </p>
      </div>

      <div>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </div>

      {error && <p className="text-sm text-[#E08080]">{error}</p>}
      {successMsg && <p className="text-sm text-[#5FB88A]">{successMsg}</p>}
    </form>
  );
}
