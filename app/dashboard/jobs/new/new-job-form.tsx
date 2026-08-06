"use client";

import { useState, useRef, useMemo } from "react";
import { createJob } from "./actions";
import { resolveMarginRule, calculateSellRate, type MarginRule } from "@/lib/margin";

type Organisation = {
  id: string;
  name: string;
};

type Carrier = {
  id: string;
  name: string;
};

export default function NewJobForm({
  organisations,
  carriers,
  rules,
}: {
  organisations: Organisation[];
  carriers: Carrier[];
  rules: MarginRule[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Live preview inputs — these mirror what's in the form fields
  const [orgId, setOrgId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [costRate, setCostRate] = useState("");

  // Recalculate the preview any time the relevant fields change.
  // This is ONLY a preview for the user — the server recalculates
  // the real value independently in actions.ts.
  const preview = useMemo(() => {
    if (!orgId || !carrierId || !costRate) return null;

    const cost = Number(costRate);
    if (isNaN(cost) || cost < 0) return null;

    const rule = resolveMarginRule(rules, orgId, carrierId);
    if (!rule) return { noRule: true as const };

    const sellRate = calculateSellRate(cost, rule.margin_percent);
    return { noRule: false as const, sellRate, marginPercent: rule.margin_percent };
  }, [orgId, carrierId, costRate, rules]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await createJob(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccessMsg(`Job created — sell rate: $${result?.sellRate}`);
    formRef.current?.reset();
    setOrgId("");
    setCarrierId("");
    setCostRate("");
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-gray-50 p-6"
    >
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Client
          </label>
          <select
            name="org_id"
            required
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select client...</option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Carrier
          </label>
          <select
            name="carrier_id"
            required
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select carrier...</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Job type
          </label>
          <select
            name="job_type"
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
            value={costRate}
            onChange={(e) => setCostRate(e.target.value)}
            placeholder="e.g. 250"
            className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Any extra details about this job..."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {/* Live preview */}
      <div className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-sm">
        {!preview && (
          <p className="text-gray-400">
            Fill in client, carrier, and cost rate to see the calculated sell
            rate.
          </p>
        )}
        {preview?.noRule && (
          <p className="text-amber-600">
            No margin rule found for this client/carrier combination — add
            one on the Margin Rules page first.
          </p>
        )}
        {preview && !preview.noRule && (
          <p className="text-gray-700">
            Margin: <span className="font-medium">{preview.marginPercent}%</span>
            {" · "}
            Sell rate:{" "}
            <span className="font-semibold text-gray-900">
              ${preview.sellRate.toFixed(2)}
            </span>
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create job"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
    </form>
  );
}