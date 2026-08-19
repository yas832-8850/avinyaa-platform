"use client";

import { useState } from "react";
import { createAssignee, deleteAssignee } from "./actions";

type Assignee = {
  id: string;
  name: string;
};

export default function AssigneeManager({
  orgId,
  initialAssignees,
}: {
  orgId: string;
  initialAssignees: Assignee[];
}) {
  const [assignees, setAssignees] = useState<Assignee[]>(initialAssignees);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    const result = await createAssignee(orgId, newName.trim());
    setSaving(false);

    if (result.success && result.assignee) {
      setAssignees((prev) => [...prev, result.assignee as Assignee].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`Delete "${name}"? This won't remove them from tasks they're already assigned to.`);
    if (!confirmed) return;

    setAssignees((prev) => prev.filter((a) => a.id !== id));
    await deleteAssignee(id);
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">Add new person</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1.5 text-sm"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      <div className="border rounded-md divide-y">
        {assignees.length === 0 && (
          <p className="p-4 text-sm text-gray-500 text-center">No people added yet.</p>
        )}
        {assignees.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3">
            <span className="text-sm">{a.name}</span>
            <button
              onClick={() => handleDelete(a.id, a.name)}
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