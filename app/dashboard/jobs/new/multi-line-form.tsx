"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FreightLinesTable, { type FreightLine } from "./freight-lines-table";
import { createJobWithLines } from "./actions";
import ContactPicker, { type ContactFormData } from "./contact-picker";
import { type Contact } from "./contacts-actions";

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
        <div>
          <label className="block text-sm font-medium mb-1">Carrier</label>
          <select
            className="w-full border rounded px-2 py-1.5"
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
          >
            <option value="">Select carrier...</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Zone</label>
          <input
            className="w-full border rounded px-2 py-1.5"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g. NSW Metro"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job Type</label>
          <select
            className="w-full border rounded px-2 py-1.5"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
            <option value="installation">Installation</option>
          </select>
        </div>
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
        <label className="block text-sm font-medium mb-2">Freight Details</label>
        <FreightLinesTable onChange={setLines} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          className="w-full border rounded px-2 py-1.5"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Booking..." : "Book Job"}
      </button>
    </form>
  );
}