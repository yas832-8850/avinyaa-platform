"use client";

import { useState, useEffect } from "react";
import { getJobNumberSequence, updateJobNumberSequence } from "./actions";

export default function SequenceSettings({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [nextNumber, setNextNumber] = useState(1);
  const [padding, setPadding] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getJobNumberSequence(orgId).then((seq) => {
      if (seq) {
        setPrefix(seq.prefix ?? "");
        setNextNumber(seq.next_number ?? 1);
        setPadding(seq.padding ?? 0);
      }
      setLoading(false);
    });
  }, [open, orgId]);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    const result = await updateJobNumberSequence(orgId, prefix, nextNumber, padding);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSaved(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Numbering settings
      </button>
    );
  }return (
    <div className="border rounded-md p-4 bg-gray-50 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Job Numbering Settings</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:underline"
        >
          Close
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Prefix (optional)</label>
              <input
                className="w-full border rounded px-2 py-1.5"
                placeholder="e.g. SAPP-"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Next number</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1.5"
                value={nextNumber}
                onChange={(e) => setNextNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Padding (0 = none)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1.5"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Preview: {prefix}{padding > 0 ? String(nextNumber).padStart(padding, "0") : nextNumber}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
              Saved.
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </>
      )}
    </div>
  );
}