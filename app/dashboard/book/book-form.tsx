"use client";

import { useState, useRef, useMemo } from "react";
import { bookJob } from "./actions";
import { resolveMarginRule, calculateSellRate, calculateCostRate, type MarginRule, type RateCard } from "@/lib/margin";

type Carrier = {
  id: string;
  name: string;
};

export default function BookForm({
  carriers,
  zones,
  rateCards,
  rules,
  orgId,
}: {
  carriers: Carrier[];
  zones: string[];
  rateCards: RateCard[];
  rules: MarginRule[];
  orgId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [carrierId, setCarrierId] = useState("");
  const [zone, setZone] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Live preview — mirrors the server calculation exactly, but this is
  // ONLY for display. The server always recalculates independently.
  const preview = useMemo(() => {
    if (!carrierId || !zone || !weightKg) return null;

    const weight = Number(weightKg);
    if (isNaN(weight) || weight <= 0) return null;

    const costRate = calculateCostRate(rateCards, carrierId, zone, weight);
    if (costRate === null) return { noRateCard: true as const };

    const rule = resolveMarginRule(rules, orgId, carrierId);
    if (!rule) return { noRateCard: false as const, noRule: true as const };

    const sellRate = calculateSellRate(costRate, rule.margin_percent);
    return { noRateCard: false as const, noRule: false as const, sellRate };
  }, [carrierId, zone, weightKg, rateCards, rules, orgId]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await bookJob(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccessMsg(`Job booked — total: $${result?.sellRate}`);
    formRef.current?.reset();
    setCarrierId("");
    setZone("");
    setWeightKg("");
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
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Zone
          </label>
          <select
            name="zone"
            required
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select zone...</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
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
            Weight (kg)
          </label>
          <input
            name="weight_kg"
            type="number"
            step="0.1"
            min="0.1"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 25"
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
          placeholder="Any extra details..."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-sm">
        {!preview && (
          <p className="text-gray-400">
            Select carrier, zone, and weight to see your quote.
          </p>
        )}
        {preview?.noRateCard && (
          <p className="text-amber-600">
            No pricing is set up for this carrier/zone yet. Contact Avinyaa.
          </p>
        )}
        {preview && !preview.noRateCard && preview.noRule && (
          <p className="text-amber-600">
            Your account isn&apos;t set up for pricing yet. Contact Avinyaa.
          </p>
        )}
        {preview && !preview.noRateCard && !preview.noRule && (
          <p className="text-gray-700">
            Your quote:{" "}
            <span className="text-lg font-semibold text-gray-900">
              ${preview.sellRate.toFixed(2)}
            </span>
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || !preview || preview.noRateCard || preview.noRule}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Booking..." : "Book job"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
    </form>
  );
}