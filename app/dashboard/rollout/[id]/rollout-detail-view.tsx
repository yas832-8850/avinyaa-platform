"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sortRolloutStops } from "../actions";

type Stop = {
  id: string;
  site_name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  status: string;
  installers: { name: string } | null;
};

export default function RolloutDetailView({
  uploadId,
  initialStops,
}: {
  uploadId: string;
  initialStops: Stop[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState(false);

  async function handleSort() {
    setSorting(true);
    await sortRolloutStops(uploadId);
    setSorting(false);
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
                <td className="px-3 py-2">{stop.installers?.name ?? "— unassigned —"}</td>
                <td className="px-3 py-2">{stop.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}