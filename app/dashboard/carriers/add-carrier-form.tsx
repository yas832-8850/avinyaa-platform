"use client";

import { useState, useRef } from "react";
import { addCarrier } from "./actions";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

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
      className="flex flex-wrap items-end gap-3 border border-[#2C313A] bg-[#1E2229] p-4"
    >
      <Input name="name" required label="Carrier name" placeholder="e.g. Toll" />

      <Select name="service_type" required label="Service type">
        <option value="freight">Freight</option>
        <option value="install">Install</option>
      </Select>

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Adding..." : "Add carrier"}
      </Button>

      {error && <p className="w-full text-sm text-[#E08080]">{error}</p>}
    </form>
  );
}
