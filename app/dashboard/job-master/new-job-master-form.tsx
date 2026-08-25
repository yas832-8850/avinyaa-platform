"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJobMaster, getClientOrgs } from "./actions";

type ClientOrg = {
  id: string;
  name: string;
};

export default function NewJobMasterForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientOrgs, setClientOrgs] = useState<ClientOrg[]>([]);
  const [clientOrgId, setClientOrgId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [accountManager, setAccountManager] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [serverLink, setServerLink] = useState("");
  const [customJobNumber, setCustomJobNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      getClientOrgs().then(setClientOrgs);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clientOrgId || !projectName) {
      setError("Client and project name are required.");
      return;
    }

    const selectedClient = clientOrgs.find((c) => c.id === clientOrgId);
    const clientName = selectedClient ? selectedClient.name : "";

    setSubmitting(true);
    const result = await createJobMaster(
      orgId,
      clientName,
      clientOrgId,
      projectName,
      accountManager,
      clientContact,
      jobDate,
      serverLink,
      customJobNumber
    );
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setClientOrgId("");
    setProjectName("");
    setAccountManager("");
    setClientContact("");
    setJobDate("");
    setServerLink("");
    setCustomJobNumber("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        + New Job
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3 bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <select className="border rounded px-2 py-1.5" value={clientOrgId} onChange={(e) => setClientOrgId(e.target.value)}>
          <option value="">— Select client * —</option>
          {clientOrgs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input className="border rounded px-2 py-1.5" placeholder="Project name *" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <input className="border rounded px-2 py-1.5" placeholder="Account manager" value={accountManager} onChange={(e) => setAccountManager(e.target.value)} />
        <input className="border rounded px-2 py-1.5" placeholder="Client contact" value={clientContact} onChange={(e) => setClientContact(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1.5" value={jobDate} onChange={(e) => setJobDate(e.target.value)} />
        <input className="border rounded px-2 py-1.5" placeholder="Server link (URL)" value={serverLink} onChange={(e) => setServerLink(e.target.value)} />
        <input className="border rounded px-2 py-1.5 col-span-2" placeholder="Custom job number (optional — leave blank to auto-generate)" value={customJobNumber} onChange={(e) => setCustomJobNumber(e.target.value)} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {submitting ? "Creating..." : "Create Job"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded border hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </form>
  );
}