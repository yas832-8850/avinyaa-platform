"use client";

import { useState, useRef, useMemo } from "react";
import { createJob } from "./actions";
import { resolveMarginRule, calculateSellRate, calculateCostRate, calculateChargeableWeight, type MarginRule, type RateCard } from "@/lib/margin";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

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
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4 border border-[#2C313A] bg-[#1E2229] p-6">
      <div className="flex flex-wrap gap-3">
        <Select name="org_id" required value={orgId} onChange={(e) => setOrgId(e.target.value)} label="Client">
          <option value="">Select client...</option>
          {organisations.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
        </Select>

        <Select name="carrier_id" required value={carrierId} onChange={(e) => setCarrierId(e.target.value)} label="Carrier">
          <option value="">Select carrier...</option>
          {carriers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </Select>

        <Select name="zone" required value={zone} onChange={(e) => setZone(e.target.value)} label="Zone">
          <option value="">Select zone...</option>
          {zones.map((z) => (<option key={z} value={z}>{z}</option>))}
        </Select>

        <Select name="job_type" required label="Job type">
          <option value="freight">Freight</option>
          <option value="install">Install</option>
        </Select>

        <Select name="package_category" required label="Package type">
          <option value="Documents">Documents</option>
          <option value="Package/Pallet">Package/Pallet</option>
        </Select>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Dimensions & weight</p>
        <div className="flex flex-wrap gap-3">
          <div className="w-32"><Input name="length_cm" type="number" step="0.1" min="0.1" required value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} placeholder="Length (cm)" /></div>
          <div className="w-32"><Input name="width_cm" type="number" step="0.1" min="0.1" required value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="Width (cm)" /></div>
          <div className="w-32"><Input name="height_cm" type="number" step="0.1" min="0.1" required value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Height (cm)" /></div>
          <div className="w-32"><Input name="weight_kg" type="number" step="0.1" min="0.1" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Weight (kg)" /></div>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Notes (optional)</label>
        <textarea name="notes" rows={2} placeholder="Any extra details about this job..." className="w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A] placeholder:text-[#565C68]" />
      </div>

      <div className="border border-dashed border-[#2C313A] bg-[#15181D] p-3 text-sm">
        {!preview && (<p className="text-[#565C68]">Fill in client, carrier, zone, dimensions and weight to see the calculated sell rate.</p>)}
        {preview?.noRateCard && (<p className="text-[#F0A83A]">No rate card found for this carrier/zone combination.</p>)}
        {preview && !preview.noRateCard && preview.noRule && (<p className="text-[#F0A83A]">No margin rule found for this client/carrier combination — add one on the Margin Rules page first.</p>)}
        {preview && !preview.noRateCard && !preview.noRule && (
          <p className="text-[#EDEEF0]">
            Chargeable weight: <span className="font-mono">{preview.chargeableWeight.toFixed(1)}kg</span>
            {" · "}
            Margin: <span className="font-mono text-[#F0A83A]">{preview.marginPercent}%</span>
            {" · "}
            Sell rate: <span className="font-mono font-semibold">${preview.sellRate.toFixed(2)}</span>
          </p>
        )}
      </div>

      <div>
        <Button type="submit" variant="primary" disabled={loading || !preview || preview.noRateCard || preview.noRule}>
          {loading ? "Creating..." : "Create job"}
        </Button>
      </div>

      {error && <p className="text-sm text-[#E08080]">{error}</p>}
      {successMsg && <p className="text-sm text-[#5FB88A]">{successMsg}</p>}
    </form>
  );
}
