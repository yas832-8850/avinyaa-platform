"use client";

import { useState } from "react";
import { createInstaller, updateInstaller, deleteInstaller } from "./actions";

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
      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">Add Installer</h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Base State</label>
            <select
              className="w-full border rounded px-2 py-1.5 text-sm"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
            >
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Adding..." : "+ Add"}
          </button>
        </div>
      </div>

      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">All Installers</h3>
        {installers.length === 0 && (
          <p className="text-sm text-gray-500">No installers yet — add one above.</p>
        )}
        <div className="space-y-2">
          {installers.map((installer) => (
            <div key={installer.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div>
                <span className="text-sm font-medium">{installer.name}</span>
                <span className="text-xs text-gray-500 ml-2">{installer.base_state}</span>
                {installer.phone && <span className="text-xs text-gray-500 ml-2">{installer.phone}</span>}
                <a href={`/dashboard/rollout/installer/${installer.id}`} className="text-xs text-blue-600 hover:underline ml-2">View Run Sheet</a>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={installer.active}
                    onChange={(e) => handleToggleActive(installer.id, e.target.checked)}
                  />
                  Active
                </label>
                <button
                  onClick={() => handleDelete(installer.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
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