"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sortRolloutStops, assignInstaller } from "../actions";

type Stop = {
  id: string;
  site_name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  status: string;
  installer_id: string | null;
  installers: { name: string } | null;
};

type Installer = {
  id: string;
  name: string;
  base_state: string;
};

export default function RolloutDetailView({
  uploadId,
  initialStops,
  installers,
}: {
  uploadId: string;
  initialStops: Stop[];
  installers: Installer[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState(false);
  const [bulkInstaller, setBulkInstaller] = useState("");
  const [assigningRow, setAssigningRow] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  async function handleSort() {
    setSorting(true);
    await sortRolloutStops(uploadId);
    setSorting(false);
    router.refresh();
  }

  async function handleRowAssign(stopId: string, installerId: string) {
    setAssigningRow(stopId);
    await assignInstaller(stopId, installerId || null);
    setAssigningRow(null);
    router.refresh();
  }

  async function handleBulkAssign() {
    if (!bulkInstaller) return;
    setBulkAssigning(true);
    for (const stop of initialStops) {
      await assignInstaller(stop.id, bulkInstaller);
    }
    setBulkAssigning(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Rollout Stops — {initialStops.length} total</h1>
        <button onClick={handleSort} disabled={sorting} className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
          {sorting ? "Sorting..." : "Sort by State / Postcode"}
        </button>
      </div>

      <div className="border rounded-md p-3 mb-4 flex items-center gap-2 bg-gray-50">
        <span className="text-sm text-gray-600">Assign all stops to:</span>
        <select value={bulkInstaller} onChange={(e) => setBulkInstaller(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">— Select installer —</option>
          {installers.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name} ({inst.base_state})</option>
          ))}
        </select>
        <button onClick={handleBulkAssign} disabled={!bulkInstaller || bulkAssigning} className="text-sm border rounded px-3 py-1 hover:bg-white disabled:opacity-50">
          {bulkAssigning ? "Assigning..." : "Assign Whole Run"}
        </button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Site Name</th>
              <th className="text-left px-3 py-2">Address</th>
              <th className="text-left px-3 py-2">Suburb</th>
              <th className="text-left px-3 py-2">State</th>
              <th className="text-left px-3 py-2">Postcode</th>
              <th className="text-left px-3 py-2">Installer</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {initialStops.map((stop, index) => (
              <tr key={stop.id} className="border-t">
                <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                <td className="px-3 py-2">{stop.site_name}</td>
                <td className="px-3 py-2">{stop.address}</td>
                <td className="px-3 py-2">{stop.suburb}</td>
                <td className="px-3 py-2">{stop.state}</td>
                <td className="px-3 py-2">{stop.postcode}</td>
                <td className="px-3 py-2">
                  <select defaultValue={stop.installer_id ?? ""} onChange={(e) => handleRowAssign(stop.id, e.target.value)} disabled={assigningRow === stop.id} className="border rounded px-2 py-1 text-xs">
                    <option value="">— unassigned —</option>
                    {installers.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </td>
                                <td className="px-3 py-2">{stop.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}