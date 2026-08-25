"use client";

import { useState, useRef } from "react";
import { addMarginRule } from "./actions";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

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
      className="flex flex-wrap items-end gap-3 border border-[#2C313A] bg-[#1E2229] p-4"
    >
      <Select name="org_id" required label="Client">
        <option value="">Select client...</option>
        {organisations.map((org) => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </Select>

      <Select name="carrier_id" label="Carrier">
        <option value="">Default (all carriers)</option>
        {carriers.map((carrier) => (
          <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
        ))}
      </Select>

      <div className="w-24">
        <Input name="margin_percent" type="number" step="0.01" min="0" required label="Margin %" placeholder="e.g. 25" />
      </div>

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Adding..." : "Add rule"}
      </Button>

      {error && <p className="w-full text-sm text-[#E08080]">{error}</p>}
    </form>
  );
}
