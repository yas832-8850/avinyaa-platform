"use client";

import { useState } from "react";
import { createStatus, updateStatus, deleteStatus, swapStatusPositions } from "./actions";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

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
  const [pickingColorFor, setPickingColorFor] = useState<string | null>(null);
  const [pendingColor, setPendingColor] = useState<string>("");

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

  function openColorPicker(status: Status) {
    setPickingColorFor(status.id);
    setPendingColor(status.color);
  }

  async function confirmColor(id: string) {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, color: pendingColor } : s)));
    await updateStatus(id, { color: pendingColor });
    setPickingColorFor(null);
  }

  function cancelColorPicker() {
    setPickingColorFor(null);
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
      <div className="border border-[#2C313A] bg-[#1E2229] p-4 space-y-3">
        <h3 className="text-sm font-medium text-[#EDEEF0]">Add new status</h3>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Input placeholder="Status label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
          </div>
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: newColor === c ? "#EDEEF0" : "transparent" }}
              />
            ))}
          </div>
          <Button onClick={handleAdd} variant="primary">Add</Button>
        </div>
      </div>

      <div className="border border-[#2C313A] divide-y divide-[#2C313A]">
        {statuses.length === 0 && (
          <p className="p-4 text-sm text-[#8B92A0] text-center">No statuses yet — add one above.</p>
        )}
        {statuses.map((status, index) => (
          <div key={status.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <button
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                  className="text-[#8B92A0] hover:text-[#EDEEF0] disabled:opacity-30 text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMove(index, "down")}
                  disabled={index === statuses.length - 1}
                  className="text-[#8B92A0] hover:text-[#EDEEF0] disabled:opacity-30 text-xs leading-none"
                >
                  ▼
                </button>
              </div>

              <button
                onClick={() => openColorPicker(status)}
                className="w-5 h-5 rounded-full border border-[#2C313A] flex-shrink-0"
                style={{ backgroundColor: status.color }}
                title="Change color"
              />

              {editingId === status.id ? (
                <div className="flex-1">
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleUpdateLabel(status.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                  />
                </div>
              ) : (
                <span
                  onClick={() => { setEditingId(status.id); setEditValue(status.label); }}
                  className="flex-1 text-sm px-2 py-1 border cursor-pointer hover:bg-[#15181D]"
                  style={{ borderColor: status.color, color: status.color }}
                >
                  {status.label}
                </span>
              )}

              <button onClick={() => handleDelete(status.id)} className="text-[#E08080] hover:text-[#f0a0a0] text-sm">
                ✕
              </button>
            </div>

            {pickingColorFor === status.id && (
              <div className="flex items-center gap-2 mt-2 ml-8 p-2 bg-[#15181D] border border-[#2C313A]">
                <div className="flex gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPendingColor(c)}
                      className="w-6 h-6 rounded-full border-2"
                      style={{ backgroundColor: c, borderColor: pendingColor === c ? "#EDEEF0" : "transparent" }}
                    />
                  ))}
                </div>
                <Button onClick={() => confirmColor(status.id)} variant="primary" className="text-xs px-2 py-1">
                  Save
                </Button>
                <button onClick={cancelColorPicker} className="text-xs text-[#8B92A0] hover:underline">
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
