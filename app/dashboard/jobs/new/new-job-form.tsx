"use client";

import { useState, useRef, useMemo } from "react";
import { createJob } from "./actions";
import { resolveMarginRule, calculateSellRate, calculateCostRate, calculateChargeableWeight, type MarginRule, type RateCard } from "@/lib/margin";

type Organisation = {
  id: string;
  name: string;
};

type Carrier = {
  id: string;
  name: string;
  cubic_factor: number;
};

export default function NewJobForm({
  organisations,
  carriers,
  zones,
  rateCards,
  rules,
}: {
  organisations: Organisation[];
  carriers: Carrier[];
  zones: string[];
  rateCards: RateCard[];
  rules: MarginRule[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [orgId, setOrgId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [zone, setZone] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const preview = useMemo(() => {
    if (!orgId || !carrierId || !zone || !lengthCm || !widthCm || !heightCm || !weightKg) return null;

    const l = Number(lengthCm);
    const w = Number(widthCm);
    const h = Number(heightCm);
    const weight = Number(weightKg);
    if ([l, w, h, weight].some((n) => isNaN(n) || n <= 0)) return null;

    const carrier = carriers.find((c) => c.id === carrierId);
    if (!carrier) return null;

    const chargeableWeight = calculateChargeableWeight(l, w, h, weight, carrier.cubic_factor);

    const costRate = calculateCostRate(rateCards, carrierId, zone, chargeableWeight);
    if (costRate === null) return { noRateCard: true as const };

    const rule = resolveMarginRule(rules, orgId, carrierId);
    if (!rule) return { noRateCard: false as const, noRule: true as const };

    const sellRate = calculateSellRate(costRate, rule.margin_percent);
    return { noRateCard: false as const, noRule: false as const, sellRate, chargeableWeight, marginPercent: rule.margin_percent };
  }, [orgId, carrierId, zone, lengthCm, widthCm, heightCm, weightKg, rateCards, rules, carriers]);

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
    setZone("");
    setLengthCm("");
    setWidthCm("");
    setHeightCm("");
    setWeightKg("");
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4 rounded-lg border bg-gray-50 p-6">
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Client</label>
          <select name="org_id" required value={orgId} onChange={(e) => setOrgId(e.target.value)} className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">Select client...</option>
            {organisations.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Carrier</label>
          <select name="carrier_id" required value={carrierId} onChange={(e) => setCarrierId(e.target.value)} className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">Select carrier...</option>
            {carriers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Zone</label>
          <select name="zone" required value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">Select zone...</option>
            {zones.map((z) => (<option key={z} value={z}>{z}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Job type</label>
          <select name="job_type" required className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value="freight">Freight</option>
            <option value="install">Install</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Package type</label>
          <select name="package_category" required className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value="Documents">Documents</option>
            <option value="Package/Pallet">Package/Pallet</option>
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-700">Dimensions & weight</p>
        <div className="mt-1 flex flex-wrap gap-3">
          <input name="length_cm" type="number" step="0.1" min="0.1" required value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} placeholder="Length (cm)" className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          <input name="width_cm" type="number" step="0.1" min="0.1" required value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="Width (cm)" className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          <input name="height_cm" type="number" step="0.1" min="0.1" required value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Height (cm)" className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          <input name="weight_kg" type="number" step="0.1" min="0.1" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Weight (kg)" className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Notes (optional)</label>
        <textarea name="notes" rows={2} placeholder="Any extra details about this job..." className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
      </div>

      <div className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-sm">
        {!preview && (<p className="text-gray-400">Fill in client, carrier, zone, dimensions and weight to see the calculated sell rate.</p>)}
        {preview?.noRateCard && (<p className="text-amber-600">No rate card found for this carrier/zone combination.</p>)}
        {preview && !preview.noRateCard && preview.noRule && (<p className="text-amber-600">No margin rule found for this client/carrier combination — add one on the Margin Rules page first.</p>)}
        {preview && !preview.noRateCard && !preview.noRule && (
          <p className="text-gray-700">
            Chargeable weight: <span className="font-medium">{preview.chargeableWeight.toFixed(1)}kg</span>
            {" · "}
            Margin: <span className="font-medium">{preview.marginPercent}%</span>
            {" · "}
            Sell rate: <span className="font-semibold text-gray-900">${preview.sellRate.toFixed(2)}</span>
          </p>
        )}
      </div>

      <div>
        <button type="submit" disabled={loading || !preview || preview.noRateCard || preview.noRule} className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create job"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
    </form>
  );
}