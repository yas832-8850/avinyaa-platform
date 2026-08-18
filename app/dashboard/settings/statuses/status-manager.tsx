"use client";

import { useState } from "react";
import { createStatus, updateStatus, deleteStatus, swapStatusPositions } from "./actions";

type Status = {
  id: string;
  label: string;
  color: string;
  position: number;
};

const PRESET_COLORS = [
  "#9ca3af", "#3b82f6", "#ef4444", "#22c55e",
  "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4",
];

export default function StatusManager({
  orgId,
  initialStatuses,
}: {
  orgId: string;
  initialStatuses: Status[];
}) {
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function handleAdd() {
    if (!newLabel.trim()) return;
    const result = await createStatus(orgId, newLabel.trim(), newColor);
    if (result.success && result.status) {
      setStatuses((prev) => [...prev, result.status as Status]);
      setNewLabel("");
      setNewColor(PRESET_COLORS[0]);
    }
  }

  async function handleUpdateLabel(id: string) {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, label: editValue.trim() } : s)));
    await updateStatus(id, { label: editValue.trim() });
    setEditingId(null);
  }

  async function handleUpdateColor(id: string, color: string) {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
    await updateStatus(id, { color });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this status? Nodes using it will show no status.");
    if (!confirmed) return;
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    await deleteStatus(id);
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= statuses.length) return;

    const current = statuses[index];
    const target = statuses[targetIndex];

    const newStatuses = [...statuses];
    newStatuses[index] = { ...target, position: current.position };
    newStatuses[targetIndex] = { ...current, position: target.position };
    newStatuses.sort((a, b) => a.position - b.position);
    setStatuses(newStatuses);

    await swapStatusPositions(current.id, current.position, target.id, target.position);
  }
  
  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4 space-y-3">
        <h3 className="font-medium text-sm">Add new status</h3>
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 border rounded px-2 py-1.5 text-sm"
            placeholder="Status label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: newColor === c ? "#000" : "transparent" }}
              />
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="border rounded-md divide-y">
        {statuses.length === 0 && (
          <p className="p-4 text-sm text-gray-500 text-center">No statuses yet — add one above.</p>
        )}
        {statuses.map((status, index) => (
          <div key={status.id} className="flex items-center gap-3 p-3">
            <div className="flex flex-col">
              <button
                onClick={() => handleMove(index, "up")}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
              >
                ▲
              </button>
              <button
                onClick={() => handleMove(index, "down")}
                disabled={index === statuses.length - 1}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
              >
                ▼
              </button>
            </div>

            <div className="flex gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleUpdateColor(status.id, c)}
                  className="w-5 h-5 rounded-full border-2"
                  style={{ backgroundColor: c, borderColor: status.color === c ? "#000" : "transparent" }}
                />
              ))}
            </div>

            {editingId === status.id ? (
              <input
                autoFocus
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleUpdateLabel(status.id)}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              />
            ) : (
              <span
                onClick={() => { setEditingId(status.id); setEditValue(status.label); }}
                className="flex-1 text-sm px-2 py-1 rounded cursor-pointer hover:bg-gray-50"
                style={{ backgroundColor: `${status.color}22` }}
              >
                {status.label}
              </span>
            )}

            <button
              onClick={() => handleDelete(status.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}