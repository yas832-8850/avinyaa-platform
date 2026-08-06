"use client";

import { useState, useRef } from "react";
import { addMarginRule } from "./actions";

type Organisation = {
  id: string;
  name: string;
};

type Carrier = {
  id: string;
  name: string;
};

export default function AddMarginRuleForm({
  organisations,
  carriers,
}: {
  organisations: Organisation[];
  carriers: Carrier[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await addMarginRule(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Client
        </label>
        <select
          name="org_id"
          required
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
          className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Default (all carriers)</option>
          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">
          Margin %
        </label>
        <input
          name="margin_percent"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="e.g. 25"
          className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add rule"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}