"use client";

import { useState, useRef } from "react";
import { addCarrier } from "./actions";

export default function AddCarrierForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await addCarrier(formData);

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
          Carrier name
        </label>
        <input
          name="name"
          required
          placeholder="e.g. Toll"
          className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">
          Service type
        </label>
        <select
          name="service_type"
          required
          className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="freight">Freight</option>
          <option value="install">Install</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add carrier"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}