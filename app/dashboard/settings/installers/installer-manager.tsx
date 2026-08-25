"use client";

import { useState } from "react";
import { createInstaller, updateInstaller, deleteInstaller } from "./actions";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

type Installer = {
  id: string;
  name: string;
  phone: string | null;
  base_state: string;
  active: boolean;
};

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export default function InstallerManager({
  orgId,
  initialInstallers,
}: {
  orgId: string;
  initialInstallers: Installer[];
}) {
  const [installers, setInstallers] = useState<Installer[]>(initialInstallers);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newState, setNewState] = useState("NSW");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    const result = await createInstaller(orgId, newName.trim(), newPhone.trim(), newState);
    if (result.success && result.installer) {
      setInstallers((prev) => [result.installer as Installer, ...prev]);
      setNewName("");
      setNewPhone("");
      setNewState("NSW");
    }
    setSaving(false);
  }

  async function handleToggleActive(installerId: string, active: boolean) {
    setInstallers((prev) => prev.map((i) => (i.id === installerId ? { ...i, active } : i)));
    await updateInstaller(installerId, { active });
  }

  async function handleDelete(installerId: string) {
    const confirmed = window.confirm("Delete this installer? This can't be undone.");
    if (!confirmed) return;
    setInstallers((prev) => prev.filter((i) => i.id !== installerId));
    await deleteInstaller(installerId);
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#2C313A] bg-[#1E2229] p-4">
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">Add Installer</h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input label="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <Select label="Base State" value={newState} onChange={(e) => setNewState(e.target.value)}>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Button variant="primary" onClick={handleAdd} disabled={saving || !newName.trim()}>
            {saving ? "Adding..." : "+ Add"}
          </Button>
        </div>
      </div>

      <div className="border border-[#2C313A] bg-[#1E2229] p-4">
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">All Installers</h3>
        {installers.length === 0 && (
          <p className="text-sm text-[#8B92A0]">No installers yet — add one above.</p>
        )}
        <div className="space-y-2">
          {installers.map((installer) => (
            <div key={installer.id} className="flex items-center justify-between border border-[#2C313A] px-3 py-2">
              <div>
                <span className="text-sm font-medium text-[#EDEEF0]">{installer.name}</span>
                <span className="text-xs text-[#8B92A0] ml-2 font-mono">{installer.base_state}</span>
                {installer.phone && <span className="text-xs text-[#8B92A0] ml-2 font-mono">{installer.phone}</span>}
                <a href={`/dashboard/rollout/installer/${installer.id}`} className="text-xs text-[#4FA8D8] hover:underline ml-2">View Run Sheet</a>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-[#8B92A0]">
                  <input type="checkbox" checked={installer.active} onChange={(e) => handleToggleActive(installer.id, e.target.checked)} />
                  Active
                </label>
                <button onClick={() => handleDelete(installer.id)} className="text-xs text-[#E08080] hover:text-[#f0a0a0]">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
