"use client";

import { useState } from "react";
import SequenceSettings from "./sequence-settings";
import Select from "../../components/ui/Select";

type ClientOrg = {
  id: string;
  name: string;
};

export default function StaffNumberingPicker({ clientOrgs }: { clientOrgs: ClientOrg[] }) {
  const [selectedClientId, setSelectedClientId] = useState("");

  return (
    <div className="my-4 border border-[#2C313A] bg-[#1E2229] p-4">
      <p className="text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Manage Client Job Numbering</p>
      <Select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
        <option value="">— Select a client —</option>
        {clientOrgs.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>

      {selectedClientId && (
        <div className="mt-3">
          <SequenceSettings orgId={selectedClientId} />
        </div>
      )}
    </div>
  );
}
