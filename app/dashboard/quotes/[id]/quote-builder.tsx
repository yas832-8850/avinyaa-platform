"use client";

import { useState, useEffect } from "react";
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
} from "../actions";
import { calculateSellFromMargin, calculateLineTotal } from "../quote-margin";

type Quote = {
  id: string;
  quote_name: string;
  job_id: string | null;
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

function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  const target = e.target;
  setTimeout(() => target.select(), 0);
}

export default function QuoteBuilder({
  orgId,
  initialQuote,
  initialTiers,
  initialLines,
  initialFreight,
  jobOptions,
}: {
  orgId: string;
  initialQuote: Quote;
  initialTiers: Tier[];
  initialLines: Line[];
  initialFreight: Freight;
  jobOptions: JobOption[];
}) {
  const [quoteName, setQuoteName] = useState(initialQuote.quote_name);
  const [jobId, setJobId] = useState(initialQuote.job_id ?? "");
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [freightAmount, setFreightAmount] = useState(initialFreight?.amount ?? 0);
  const [freightNotes, setFreightNotes] = useState(initialFreight?.notes ?? "");
  const [nodeOptions, setNodeOptions] = useState<NodeOption[]>([]);
  const [savingName, setSavingName] = useState(false);

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
    await updateQuoteFreight(initialQuote.id, freightAmount, freightNotes);
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
  const grandTotal = linesSum + (freightAmount || 0);

  return (
    <div className="space-y-6">
      <div className="border rounded-md p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Name</label>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm font-medium"
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              onBlur={handleNameBlur}
            />
            {savingName && <span className="text-xs text-gray-400">Saving...</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Linked Project</label>
            <select
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={jobId}
              onChange={(e) => handleJobChange(e.target.value)}
            >
              <option value="">— None —</option>
              {jobOptions.map((j) => (
                <option key={j.id} value={j.id}>{j.job_number} — {j.project_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">Margin Tiers</h3>
        <div className="flex flex-wrap gap-2 items-center">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
              <span className="text-xs text-gray-500">Tier {tier.tier_number}</span>
              <input
                type="number"
                className="w-14 border rounded px-1 py-0.5 text-sm"
                value={tier.margin_percent}
                onFocus={selectAllOnFocus}
                onChange={(e) => handleTierChange(tier.id, parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-gray-500">%</span>
              <button
                onClick={() => handleDeleteTier(tier.id)}
                className="text-red-400 hover:text-red-600 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={handleAddTier}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add tier
          </button>
        </div>
      </div>

      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">Line Items</h3>
        <div className="space-y-4">
          {lines.length === 0 && (
            <p className="text-sm text-gray-500">No line items yet — add one below.</p>
          )}
          {lines.map((line, index) => {
            const sellPrice = getTierSellPrice(line.unit_cost, line.tier_used_id);
            const total = lineTotals[index];
            return (
              <div key={line.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <textarea
                    className="flex-1 border rounded px-2 py-1.5 text-sm resize-y min-h-[60px]"
                    placeholder="Description — type as much detail as you need"
                    value={line.description ?? ""}
                    onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, description: e.target.value } : l)))}
                    onBlur={(e) => handleUpdateLine(line.id, { description: e.target.value })}
                  />
                  <input
                    className="w-32 border rounded px-2 py-1.5 text-sm"
                    placeholder="Code"
                    value={line.code ?? ""}
                    onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, code: e.target.value } : l)))}
                    onBlur={(e) => handleUpdateLine(line.id, { code: e.target.value })}
                  />
                  <button
                    onClick={() => handleDeleteLine(line.id)}
                    className="text-red-500 hover:text-red-700 text-sm px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2 items-end text-xs">
                  <div>
                    <label className="block text-gray-500 mb-1">Unit Cost</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={line.unit_cost}
                      onFocus={selectAllOnFocus}
                      onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, unit_cost: parseFloat(e.target.value) || 0 } : l)))}
                      onBlur={(e) => handleUpdateLine(line.id, { unit_cost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Order Qty</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={line.order_qty}
                      onFocus={selectAllOnFocus}
                      onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, order_qty: parseFloat(e.target.value) || 0 } : l)))}
                      onBlur={(e) => handleUpdateLine(line.id, { order_qty: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-500 mb-1">Tier Used</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={line.tier_used_id ?? ""}
                      onChange={(e) => handleUpdateLine(line.id, { tier_used_id: e.target.value || null })}
                    >
                      <option value="">— Select tier —</option>
                      {tiers.map((t) => (
                        <option key={t.id} value={t.id}>Tier {t.tier_number} ({t.margin_percent}%)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Sell / Unit</label>
                    <div className="px-2 py-1 font-medium">
                      {sellPrice !== null ? `$${sellPrice.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Line Total</label>
                    <div className="px-2 py-1 font-medium">${total.toFixed(2)}</div>
                  </div>
                </div>

                {nodeOptions.length > 0 && (
                  <div className="text-xs">
                    <label className="block text-gray-500 mb-1">Linked Task</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={line.linked_node_id ?? ""}
                      onChange={(e) => handleUpdateLine(line.id, { linked_node_id: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {nodeOptions.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={handleAddLine}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          + Add row
        </button>
      </div>

      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">Freight (whole job)</h3>
        <p className="text-xs text-gray-500 mb-2">One freight line for the entire quote — not divided across line items.</p>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
            <input
              type="number"
              className="border rounded px-2 py-1.5 text-sm w-32"
              value={freightAmount}
              onFocus={selectAllOnFocus}
              onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
              onBlur={handleFreightBlur}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={freightNotes}
              onChange={(e) => setFreightNotes(e.target.value)}
              onBlur={handleFreightBlur}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-md p-4 bg-gray-50">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Line items total</span>
          <span>${linesSum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Freight</span>
          <span>${(freightAmount || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
          <span>Grand Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
