"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJobMaster, getClientOrgs } from "./actions";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

type ClientOrg = {
  id: string;
  name: string;
};

export default function NewJobMasterForm({
  orgId,
  isSuperAdmin,
  viewerOrgId,
}: {
  orgId: string;
  isSuperAdmin: boolean;
  viewerOrgId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientOrgs, setClientOrgs] = useState<ClientOrg[]>([]);
  const [clientOrgId, setClientOrgId] = useState(isSuperAdmin ? "" : viewerOrgId);
  const [projectName, setProjectName] = useState("");
  const [accountManager, setAccountManager] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [serverLink, setServerLink] = useState("");
  const [customJobNumber, setCustomJobNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && isSuperAdmin) {
      getClientOrgs().then(setClientOrgs);
    }
  }, [open, isSuperAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clientOrgId || !projectName) {
      setError("Client and project name are required.");
      return;
    }

    let clientName = "";
    if (isSuperAdmin) {
      const selectedClient = clientOrgs.find((c) => c.id === clientOrgId);
      clientName = selectedClient ? selectedClient.name : "";
    }

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

    if (isSuperAdmin) setClientOrgId("");
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
    return <Button variant="primary" onClick={() => setOpen(true)}>+ New Job</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#2C313A] bg-[#1E2229] p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {isSuperAdmin && (
          <Select label="Client *" value={clientOrgId} onChange={(e) => setClientOrgId(e.target.value)}>
            <option value="">— Select client —</option>
            {clientOrgs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        )}
        <Input label="Project name *" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <Input label="Account manager" value={accountManager} onChange={(e) => setAccountManager(e.target.value)} />
        <Input label="Client contact" value={clientContact} onChange={(e) => setClientContact(e.target.value)} />
        <Input label="Date" type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} />
        <Input label="Server link (URL)" value={serverLink} onChange={(e) => setServerLink(e.target.value)} />
        {isSuperAdmin && (
          <div className="col-span-2">
            <Input label="Custom job number (optional — leave blank to auto-generate)" value={customJobNumber} onChange={(e) => setCustomJobNumber(e.target.value)} />
          </div>
        )}
      </div>

      {error && (
        <div className="border border-[#3A2222] bg-[#221818] text-[#E08080] px-3 py-2 text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Creating..." : "Create Job"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
