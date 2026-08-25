"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FreightLinesTable, { type FreightLine } from "./freight-lines-table";
import { createJobWithLines } from "./actions";
import ContactPicker, { type ContactFormData } from "./contact-picker";
import { type Contact } from "./contacts-actions";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";

export default function MultiLineJobForm({
  orgId,
  carriers,
  contacts,
}: {
  orgId: string;
  carriers: { id: string; name: string }[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const [carrierId, setCarrierId] = useState("");
  const [zone, setZone] = useState("");
  const [sender, setSender] = useState<ContactFormData | null>(null);
  const [receiver, setReceiver] = useState<ContactFormData | null>(null);
  const [jobType, setJobType] = useState("delivery");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<FreightLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!carrierId) {
      setError("Select a carrier.");
      return;
    }
    if (!zone) {
      setError("Enter a zone.");
      return;
    }
    if (!sender || !sender.name || !sender.address) {
      setError("Sender name and address are required.");
      return;
    }
    if (!receiver || !receiver.name || !receiver.address) {
      setError("Receiver name and address are required.");
      return;
    }
    const validLines = lines.filter(
      (l) => l.length_m > 0 && l.width_m > 0 && l.height_m > 0 && l.weight_kg > 0
    );
    if (validLines.length === 0) {
      setError("At least one freight line needs L, W, H, and weight filled in.");
      return;
    }

    setSubmitting(true);
    const result = await createJobWithLines(
      orgId,
      carrierId,
      jobType,
      zone,
      validLines,
      sender,
      receiver,
      notes
    );
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard/jobs");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-3 gap-4">
        <Select label="Carrier" value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
          <option value="">Select carrier...</option>
          {carriers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <div>
          <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Zone</label>
          <input
            className="w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g. NSW Metro"
          />
        </div>
        <Select label="Job Type" value={jobType} onChange={(e) => setJobType(e.target.value)}>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
          <option value="installation">Installation</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ContactPicker
          label="Sender"
          orgId={orgId}
          contacts={contacts}
          onChange={setSender}
        />
        <ContactPicker
          label="Receiver"
          orgId={orgId}
          contacts={contacts}
          onChange={setReceiver}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Freight Details</label>
        <FreightLinesTable onChange={setLines} />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Notes</label>
        <textarea
          className="w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <div className="border border-[#3A2222] bg-[#221818] text-[#E08080] px-4 py-3">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? "Booking..." : "Book Job"}
      </Button>
    </form>
  );
}
