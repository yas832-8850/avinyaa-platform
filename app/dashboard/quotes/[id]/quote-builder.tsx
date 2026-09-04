"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateQuote,
  createQuoteLine,
  updateQuoteLine,
  deleteQuoteLine,
  updateQuoteTier,
  addQuoteTier,
  deleteQuoteTier,
  updateQuoteFreight,
  getNodesForJob,
  deleteQuote,
} from "../actions";
import { calculateSellFromMargin, calculateLineTotal } from "../quote-margin";

type Quote = {
  id: string;
  quote_name: string;
  job_id: string | null;
  pricing_mode: string | null;
  rounding: string | null;
  bill_to_name: string | null;
  bill_to_address: string | null;
  client_org_id: string | null;
  created_by_client: boolean;
  shared_with_staff: boolean;
};

type Tier = {
  id: string;
  tier_number: number;
  margin_percent: number;
};

type Line = {
  id: string;
  description: string | null;
  code: string | null;
  unit_cost: number;
  order_qty: number;
  tier_used_id: string | null;
  linked_node_id: string | null;
};

type Freight = {
  amount: number;
  notes: string | null;
  included: boolean | null;
  margin_percent: number | null;
} | null;

type JobOption = {
  id: string;
  job_number: string;
  project_name: string | null;
};

type NodeOption = {
  id: string;
  name: string;
};

const GST_RATE = 0.10;

function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  const target = e.target;
  setTimeout(() => target.select(), 0);
}

function applyRounding(amount: number, rounding: string): number {
  if (rounding === "nearest_dollar") return Math.round(amount);
  if (rounding === "nearest_10") return Math.round(amount / 10) * 10;
  return Math.round(amount * 100) / 100;
}

const inputCls = "w-full border border-[#2C313A] bg-[#15181D] px-2 py-1.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]";
const labelCls = "block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-1";
const cardCls = "border border-[#2C313A] bg-[#1E2229] p-4";

export default function QuoteBuilder({
  orgId,
  initialQuote,
  initialTiers,
  initialLines,
  initialFreight,
  jobOptions,
  isOwner,
}: {
  orgId: string;
  initialQuote: Quote;
  initialTiers: Tier[];
  initialLines: Line[];
  initialFreight: Freight;
  jobOptions: JobOption[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [quoteName, setQuoteName] = useState(initialQuote.quote_name);
  const [jobId, setJobId] = useState(initialQuote.job_id ?? "");
  const [pricingMode, setPricingMode] = useState(initialQuote.pricing_mode ?? "ex_gst");
  const [rounding, setRounding] = useState(initialQuote.rounding ?? "none");
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [billToName, setBillToName] = useState(initialQuote.bill_to_name ?? "");
  const [billToAddress, setBillToAddress] = useState(initialQuote.bill_to_address ?? "");
  const [sharedWithStaff, setSharedWithStaff] = useState(initialQuote.shared_with_staff);

  const [freightCostInput, setFreightCostInput] = useState(String(initialFreight?.amount ?? 0));
  const [freightMarginInput, setFreightMarginInput] = useState(String(initialFreight?.margin_percent ?? 0));
  const [freightNotes, setFreightNotes] = useState(initialFreight?.notes ?? "");
  const [freightIncluded, setFreightIncluded] = useState(initialFreight?.included ?? true);
  const [nodeOptions, setNodeOptions] = useState<NodeOption[]>([]);
  const [savingName, setSavingName] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const freightCost = parseFloat(freightCostInput) || 0;
  const freightMargin = parseFloat(freightMarginInput) || 0;

  useEffect(() => {
    if (jobId) {
      getNodesForJob(jobId).then(setNodeOptions);
    } else {
      setNodeOptions([]);
    }
  }, [jobId]);

  async function handleNameBlur() {
    if (quoteName.trim() === initialQuote.quote_name) return;
    setSavingName(true);
    await updateQuote(initialQuote.id, { quote_name: quoteName.trim() });
    setSavingName(false);
  }

  async function handleJobChange(newJobId: string) {
    setJobId(newJobId);
    await updateQuote(initialQuote.id, { job_id: newJobId || null });
  }

  async function handlePricingModeChange(mode: string) {
    setPricingMode(mode);
    await updateQuote(initialQuote.id, { pricing_mode: mode });
  }

  async function handleRoundingChange(newRounding: string) {
    setRounding(newRounding);
    await updateQuote(initialQuote.id, { rounding: newRounding });
  }

  async function handleBillToBlur() {
    await updateQuote(initialQuote.id, {
      bill_to_name: billToName.trim() || null,
      bill_to_address: billToAddress.trim() || null,
    });
  }

  async function handleToggleShared(checked: boolean) {
    setSharedWithStaff(checked);
    await updateQuote(initialQuote.id, { shared_with_staff: checked });
  }

  async function handleTierChange(tierId: string, newMargin: number) {
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, margin_percent: newMargin } : t)));
    await updateQuoteTier(tierId, newMargin);
  }

  async function handleAddTier() {
    const nextNumber = tiers.length > 0 ? Math.max(...tiers.map((t) => t.tier_number)) + 1 : 1;
    const result = await addQuoteTier(initialQuote.id, nextNumber, 20);
    if (result.success && result.tier) {
      setTiers((prev) => [...prev, result.tier as Tier]);
    }
  }

  async function handleDeleteTier(tierId: string) {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
    await deleteQuoteTier(tierId);
  }

  async function handleAddLine() {
    const result = await createQuoteLine(initialQuote.id, lines.length);
    if (result.success && result.line) {
      setLines((prev) => [...prev, result.line as Line]);
    }
  }

  async function handleUpdateLine(lineId: string, updates: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...updates } : l)));
    await updateQuoteLine(lineId, updates);
  }

  async function handleDeleteLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    await deleteQuoteLine(lineId);
  }

  async function handleFreightBlur() {
    await updateQuoteFreight(initialQuote.id, freightCost, freightNotes, freightIncluded, freightMargin);
  }

  async function handleFreightIncludedChange(checked: boolean) {
    setFreightIncluded(checked);
    await updateQuoteFreight(initialQuote.id, freightCost, freightNotes, checked, freightMargin);
  }

  async function handleDeleteQuote() {
    const confirmed = window.confirm(`Delete quote "${quoteName}"? This can't be undone.`);
    if (!confirmed) return;
    await deleteQuote(initialQuote.id);
    router.push("/dashboard/quotes");
  }

  function getTierSellPrice(unitCost: number, tierId: string | null): number | null {
    if (!tierId) return null;
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return null;
    return calculateSellFromMargin(unitCost, tier.margin_percent);
  }

  const lineTotals = lines.map((line) => {
    const sellPrice = getTierSellPrice(line.unit_cost, line.tier_used_id);
    return sellPrice !== null ? calculateLineTotal(sellPrice, line.order_qty) : 0;
  });

  const linesSum = lineTotals.reduce((sum, t) => sum + t, 0);
  const freightSellPrice = calculateSellFromMargin(freightCost, freightMargin);
  const effectiveFreight = freightIncluded ? freightSellPrice : 0;
  const subtotal = linesSum + effectiveFreight;
  const gstAmount = pricingMode === "inc_gst" ? subtotal - subtotal / (1 + GST_RATE) : subtotal * GST_RATE;
  const grandTotalExGst = pricingMode === "inc_gst" ? subtotal - gstAmount : subtotal;
  const grandTotalIncGst = pricingMode === "inc_gst" ? subtotal : subtotal + gstAmount;
  const displayTotal = applyRounding(pricingMode === "inc_gst" ? grandTotalIncGst : grandTotalExGst, rounding);

  function buildSummaryText(): string {
    const lines_text = lines.map((line) => {
      const sellPrice = getTierSellPrice(line.unit_cost, line.tier_used_id);
      const total = sellPrice !== null ? calculateLineTotal(sellPrice, line.order_qty) : 0;
      return `${line.description || "(no description)"} — Qty ${line.order_qty} @ $${sellPrice?.toFixed(2) ?? "—"} = $${total.toFixed(2)}`;
    }).join("\n");

    const freightLine = freightIncluded
      ? `Freight: $${freightSellPrice.toFixed(2)} (cost $${freightCost.toFixed(2)}, ${freightMargin}% margin)`
      : "Freight: not included";

    return [
      `Quote: ${quoteName}`,
      "",
      lines_text || "(no line items)",
      "",
      freightLine,
      `Subtotal (Ex GST): $${grandTotalExGst.toFixed(2)}`,
      `GST: $${gstAmount.toFixed(2)}`,
      `Total (Inc GST): $${grandTotalIncGst.toFixed(2)}`,
    ].join("\n");
  }

  async function handleCopySummary() {
    const text = buildSummaryText();
    await navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#15181D] p-6 space-y-6">
      <div className="flex justify-end gap-2">
        <button onClick={handleCopySummary} className="text-sm border border-[#2C313A] text-[#EDEEF0] px-3 py-1.5 hover:bg-[#1E2229]">{copyFeedback ? "Copied!" : "Copy summary"}</button>
        <a href={`/api/quote-pdf/${initialQuote.id}`} target="_blank" rel="noopener noreferrer" className="text-sm border border-[#2C313A] text-[#EDEEF0] px-3 py-1.5 hover:bg-[#1E2229]">Download Internal PDF</a>
        <a href={`/api/quote-pdf-client/${initialQuote.id}`} target="_blank" rel="noopener noreferrer" className="text-sm border border-[#2C313A] text-[#EDEEF0] px-3 py-1.5 hover:bg-[#1E2229]">Download Client-Safe PDF</a>
      </div>

      <div className={cardCls}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Quote Name</label>
            <input className={`${inputCls} font-medium`} value={quoteName} onChange={(e) => setQuoteName(e.target.value)} onBlur={handleNameBlur} />
            {savingName && <span className="text-xs text-[#8B92A0]">Saving...</span>}
          </div>
          <div>
            <label className={labelCls}>Linked Project</label>
            <select className={inputCls} value={jobId} onChange={(e) => handleJobChange(e.target.value)}>
              <option value="">— None —</option>
              {jobOptions.map((j) => (<option key={j.id} value={j.id}>{j.job_number} — {j.project_name}</option>))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Pricing</label>
            <select className={inputCls} value={pricingMode} onChange={(e) => handlePricingModeChange(e.target.value)}>
              <option value="ex_gst">Ex. GST</option>
              <option value="inc_gst">Inc. GST</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Rounding</label>
            <select className={inputCls} value={rounding} onChange={(e) => handleRoundingChange(e.target.value)}>
              <option value="none">No rounding</option>
              <option value="nearest_dollar">Nearest dollar</option>
              <option value="nearest_10">Nearest $10</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#2C313A] grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Bill To (Name)</label>
            <input className={inputCls} placeholder="Client / company name" value={billToName} onChange={(e) => setBillToName(e.target.value)} onBlur={handleBillToBlur} />
          </div>
          <div>
            <label className={labelCls}>Bill To (Address)</label>
            <textarea className={`${inputCls} resize-y min-h-[38px]`} placeholder="Street, suburb, state, postcode" value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} onBlur={handleBillToBlur} />
          </div>
        </div>

        {isOwner && (
          <div className="mt-3 pt-3 border-t border-[#2C313A]">
            <label className="flex items-center gap-2 text-sm text-[#8B92A0]">
              <input type="checkbox" checked={sharedWithStaff} onChange={(e) => handleToggleShared(e.target.checked)} />
              Share this quote with Avinyaa staff
            </label>
            <p className="text-xs text-[#565C68] mt-1">By default your quotes are private. Turn this on if you want Avinyaa to be able to see this quote.</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#2C313A] flex justify-end">
          <button onClick={handleDeleteQuote} className="text-sm text-[#E08080] hover:text-[#f0a0a0]">Delete Quote</button>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">Margin Tiers</h3>
        <div className="flex flex-wrap gap-2 items-center">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center gap-1 border border-[#2C313A] bg-[#15181D] px-2 py-1">
              <span className="text-xs text-[#8B92A0]">Tier {tier.tier_number}</span>
              <input type="number" className="w-14 border border-[#2C313A] bg-[#1E2229] px-1 py-0.5 text-sm text-[#EDEEF0]" value={tier.margin_percent} onFocus={selectAllOnFocus} onChange={(e) => handleTierChange(tier.id, parseFloat(e.target.value) || 0)} />
              <span className="text-xs text-[#8B92A0]">%</span>
              <button onClick={() => handleDeleteTier(tier.id)} className="text-[#E08080] hover:text-[#f0a0a0] text-xs ml-1">✕</button>
            </div>
          ))}
          <button onClick={handleAddTier} className="text-sm text-[#4FA8D8] hover:underline">+ Add tier</button>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">Line Items</h3>
        <div className="space-y-4">
          {lines.length === 0 && (<p className="text-sm text-[#8B92A0]">No line items yet — add one below.</p>)}
          {lines.map((line, index) => {
            const sellPrice = getTierSellPrice(line.unit_cost, line.tier_used_id);
            const total = lineTotals[index];
            return (
              <div key={line.id} className="border border-[#2C313A] p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <textarea className={`${inputCls} flex-1 resize-y min-h-[60px]`} placeholder="Description — type as much detail as you need" value={line.description ?? ""} onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, description: e.target.value } : l)))} onBlur={(e) => handleUpdateLine(line.id, { description: e.target.value })} />
                  <input className={`${inputCls} w-32`} placeholder="Code" value={line.code ?? ""} onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, code: e.target.value } : l)))} onBlur={(e) => handleUpdateLine(line.id, { code: e.target.value })} />
                  <button onClick={() => handleDeleteLine(line.id)} className="text-[#E08080] hover:text-[#f0a0a0] text-sm px-1">✕</button>
                </div>

                <div className="grid grid-cols-6 gap-2 items-end text-xs">
                  <div>
                    <label className="block text-[#8B92A0] mb-1">Unit Cost</label>
                    <input type="number" className="w-full border border-[#2C313A] bg-[#15181D] px-2 py-1 text-[#EDEEF0]" value={line.unit_cost} onFocus={selectAllOnFocus} onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, unit_cost: parseFloat(e.target.value) || 0 } : l)))} onBlur={(e) => handleUpdateLine(line.id, { unit_cost: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-[#8B92A0] mb-1">Order Qty</label>
                    <input type="number" className="w-full border border-[#2C313A] bg-[#15181D] px-2 py-1 text-[#EDEEF0]" value={line.order_qty} onFocus={selectAllOnFocus} onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, order_qty: parseFloat(e.target.value) || 0 } : l)))} onBlur={(e) => handleUpdateLine(line.id, { order_qty: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[#8B92A0] mb-1">Tier Used</label>
                    <select className="w-full border border-[#2C313A] bg-[#15181D] px-2 py-1 text-[#EDEEF0]" value={line.tier_used_id ?? ""} onChange={(e) => handleUpdateLine(line.id, { tier_used_id: e.target.value || null })}>
                      <option value="">— Select tier —</option>
                      {tiers.map((t) => (<option key={t.id} value={t.id}>Tier {t.tier_number} ({t.margin_percent}%)</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8B92A0] mb-1">Sell / Unit</label>
                    <div className="px-2 py-1 font-mono text-[#EDEEF0]">{sellPrice !== null ? `$${sellPrice.toFixed(2)}` : "—"}</div>
                  </div>
                  <div>
                    <label className="block text-[#8B92A0] mb-1">Line Total</label>
                    <div className="px-2 py-1 font-mono text-[#EDEEF0]">${total.toFixed(2)}</div>
                  </div>
                </div>

                {nodeOptions.length > 0 && (
                  <div className="text-xs">
                    <label className="block text-[#8B92A0] mb-1">Linked Task</label>
                    <select className="w-full border border-[#2C313A] bg-[#15181D] px-2 py-1 text-[#EDEEF0]" value={line.linked_node_id ?? ""} onChange={(e) => handleUpdateLine(line.id, { linked_node_id: e.target.value || null })}>
                      <option value="">—</option>
                      {nodeOptions.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={handleAddLine} className="mt-3 text-sm text-[#4FA8D8] hover:underline">+ Add row</button>
      </div>

      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#EDEEF0]">Freight (whole job)</h3>
          <label className="flex items-center gap-2 text-sm text-[#8B92A0]">
            <input type="checkbox" checked={freightIncluded} onChange={(e) => handleFreightIncludedChange(e.target.checked)} />
            Include freight in this quote
          </label>
        </div>
        {freightIncluded ? (
          <>
            <p className="text-xs text-[#8B92A0] mb-2">One freight line for the entire quote — not divided across line items.</p>
            <div className="grid grid-cols-4 gap-3 items-end">
              <div>
                <label className={labelCls}>Freight Cost ($)</label>
                <input type="text" inputMode="decimal" className={inputCls} value={freightCostInput} onFocus={(e) => setTimeout(() => e.target.select(), 0)} onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) setFreightCostInput(v); }} onBlur={() => { if (freightCostInput === "") setFreightCostInput("0"); handleFreightBlur(); }} />
              </div>
              <div>
                <label className={labelCls}>Margin (%)</label>
                <input type="text" inputMode="decimal" className={inputCls} value={freightMarginInput} onFocus={(e) => setTimeout(() => e.target.select(), 0)} onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) setFreightMarginInput(v); }} onBlur={() => { if (freightMarginInput === "") setFreightMarginInput("0"); handleFreightBlur(); }} />
              </div>
              <div>
                <label className={labelCls}>Freight Sell</label>
                <div className="px-2 py-1.5 text-sm font-mono text-[#F0A83A] border border-[#2C313A] bg-[#15181D]">${freightSellPrice.toFixed(2)}</div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <input className={inputCls} value={freightNotes} onChange={(e) => setFreightNotes(e.target.value)} onBlur={handleFreightBlur} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#565C68]">Freight not included in this quote.</p>
        )}
      </div>

      <div className={`${cardCls} bg-[#1E2229]`}>
        <div className="flex justify-between text-sm mb-1"><span className="text-[#8B92A0]">Line items total</span><span className="font-mono text-[#EDEEF0]">${linesSum.toFixed(2)}</span></div>
        {freightIncluded && (<div className="flex justify-between text-sm mb-1"><span className="text-[#8B92A0]">Freight (sell)</span><span className="font-mono text-[#EDEEF0]">${effectiveFreight.toFixed(2)}</span></div>)}
        <div className="flex justify-between text-sm mb-1"><span className="text-[#8B92A0]">Subtotal (Ex GST)</span><span className="font-mono text-[#EDEEF0]">${grandTotalExGst.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-[#8B92A0]">GST (10%)</span><span className="font-mono text-[#EDEEF0]">${gstAmount.toFixed(2)}</span></div>
        <div className="flex justify-between text-base font-semibold border-t border-[#2C313A] pt-2 mt-2 text-[#EDEEF0]">
          <span>Grand Total ({pricingMode === "inc_gst" ? "Inc GST" : "Ex GST"}, {rounding === "none" ? "unrounded" : "rounded"})</span>
          <span className="font-mono text-[#F0A83A]">${displayTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
