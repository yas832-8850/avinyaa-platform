"use client";

import { useState } from "react";
import { createContact, type Contact } from "./contacts-actions";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

export type ContactFormData = {
  code: string;
  name: string;
  address: string;
  address_2: string;
  suburb: string;
  postcode: string;
  state: string;
  email: string;
  contact_name: string;
  phone: string;
  is_residential: boolean;
};

const emptyContact = (): ContactFormData => ({
  code: "",
  name: "",
  address: "",
  address_2: "",
  suburb: "",
  postcode: "",
  state: "",
  email: "",
  contact_name: "",
  phone: "",
  is_residential: false,
});

export default function ContactPicker({
  label,
  orgId,
  contacts,
  onChange,
}: {
  label: string;
  orgId: string;
  contacts: Contact[];
  onChange: (data: ContactFormData) => void;
}) {
  const [mode, setMode] = useState<"select" | "manual">(
    contacts.length === 0 ? "manual" : "select"
  );
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<ContactFormData>(emptyContact());
  const [saveNew, setSaveNew] = useState(true);
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof ContactFormData, value: string | boolean) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onChange(updated);
  }

  function handleSelectContact(id: string) {
    setSelectedId(id);
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    const data: ContactFormData = {
      code: contact.code ?? "",
      name: contact.name,
      address: contact.address,
      address_2: contact.address_2 ?? "",
      suburb: contact.suburb ?? "",
      postcode: contact.postcode ?? "",
      state: contact.state ?? "",
      email: contact.email ?? "",
      contact_name: contact.contact_name ?? "",
      phone: contact.phone ?? "",
      is_residential: contact.is_residential,
    };
    setForm(data);
    onChange(data);
  }

  function switchToManual() {
    setMode("manual");
    setSelectedId("");
    const fresh = emptyContact();
    setForm(fresh);
    onChange(fresh);
  }

  async function handleSaveContact() {
    if (!form.name || !form.address) return;
    setSaving(true);
    const result = await createContact(orgId, form);
    setSaving(false);
    if (result.success) {
      setMode("select");
      setSelectedId(result.contact.id);
    }
  }

  return (
    <div className="border border-[#2C313A] bg-[#1E2229] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#EDEEF0]">{label}</h3>
        {mode === "select" ? (
          <button type="button" onClick={switchToManual} className="text-sm text-[#4FA8D8] hover:underline">
            + New contact
          </button>
        ) : (
          contacts.length > 0 && (
            <button type="button" onClick={() => setMode("select")} className="text-sm text-[#4FA8D8] hover:underline">
              Choose saved contact
            </button>
          )
        )}
      </div>

      {mode === "select" && (
        <div className="mb-2">
          <Select value={selectedId} onChange={(e) => handleSelectContact(e.target.value)}>
            <option value="">Select contact...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} - ${c.name}` : c.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-2">
          <Input placeholder="Business / Contact name *" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          <Input placeholder="Address *" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
          <Input placeholder="Address 2" value={form.address_2} onChange={(e) => updateField("address_2", e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Suburb" value={form.suburb} onChange={(e) => updateField("suburb", e.target.value)} />
            <Input placeholder="Postcode" value={form.postcode} onChange={(e) => updateField("postcode", e.target.value)} />
            <Input placeholder="State" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Contact name" value={form.contact_name} onChange={(e) => updateField("contact_name", e.target.value)} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
          <Input placeholder="Email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />

          <label className="flex items-center gap-2 text-sm text-[#8B92A0]">
            <input type="checkbox" checked={form.is_residential} onChange={(e) => updateField("is_residential", e.target.checked)} />
            Residential address
          </label>

          {contacts.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-[#8B92A0]">
              <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
              Save this contact for next time
            </label>
          )}

          {saveNew && (
            <Button type="button" variant="secondary" onClick={handleSaveContact} disabled={saving || !form.name || !form.address}>
              {saving ? "Saving..." : "Save address"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
