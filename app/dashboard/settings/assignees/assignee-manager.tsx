"use client";

import { useState } from "react";
import { createAssignee, deleteAssignee } from "./actions";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

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
      <div className="border border-[#2C313A] bg-[#1E2229] p-4">
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">Add new person</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
          </div>
          <Button onClick={handleAdd} disabled={saving || !newName.trim()} variant="primary">
            {saving ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      <div className="border border-[#2C313A] divide-y divide-[#2C313A]">
        {assignees.length === 0 && (
          <p className="p-4 text-sm text-[#8B92A0] text-center">No people added yet.</p>
        )}
        {assignees.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3">
            <span className="text-sm text-[#EDEEF0]">{a.name}</span>
            <button onClick={() => handleDelete(a.id, a.name)} className="text-[#E08080] hover:text-[#f0a0a0] text-sm">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
