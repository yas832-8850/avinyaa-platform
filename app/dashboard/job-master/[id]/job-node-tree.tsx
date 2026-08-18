"use client";

import { useState } from "react";
import {
  createJobNode,
  updateJobNode,
  deleteJobNode,
  createAssignee,
} from "./actions";

type JobNode = {
  id: string;
  job_id: string;
  parent_id: string | null;
  name: string;
  status_id: string | null;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  position: number;
};

type Status = {
  id: string;
  label: string;
  color: string;
};

type Assignee = {
  id: string;
  name: string;
};

export default function JobNodeTree({
  jobId,
  orgId,
  initialNodes,
  statuses,
  initialAssignees,
}: {
  jobId: string;
  orgId: string;
  initialNodes: JobNode[];
  statuses: Status[];
  initialAssignees: Assignee[];
}) {
  const [nodes, setNodes] = useState<JobNode[]>(initialNodes);
  const [assignees, setAssignees] = useState<Assignee[]>(initialAssignees);

  function getChildren(parentId: string | null): JobNode[] {
    return nodes
      .filter((n) => n.parent_id === parentId)
      .sort((a, b) => a.position - b.position);
  }

  async function handleAddNode(parentId: string | null) {
    const siblingCount = getChildren(parentId).length;
    const result = await createJobNode(jobId, parentId, "New item", siblingCount);
    if (result.success && result.node) {
      setNodes((prev) => [...prev, result.node as JobNode]);
    }
  }

  async function handleUpdateNode(nodeId: string, updates: Partial<JobNode>) {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
    );
    await updateJobNode(nodeId, jobId, updates);
  }

  async function handleDeleteNode(nodeId: string) {
    const toDelete = new Set<string>([nodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        if (n.parent_id && toDelete.has(n.parent_id) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          changed = true;
        }
      }
    }
    setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    await deleteJobNode(nodeId, jobId);
  }

  async function handleCreateAssignee(name: string): Promise<string | null> {
    const result = await createAssignee(orgId, name);
    if (result.success && result.assignee) {
      setAssignees((prev) => [...prev, result.assignee as Assignee]);
      return result.assignee.id;
    }
    return null;
  }

  return (
    <div>
      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-2 bg-gray-100 p-2 text-xs font-medium text-gray-600">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-1">Start</div>
          <div className="col-span-1">Due</div>
          <div className="col-span-2"></div>
        </div>
        {getChildren(null).map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            depth={0}
            getChildren={getChildren}
            statuses={statuses}
            assignees={assignees}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onCreateAssignee={handleCreateAssignee}
          />
        ))}
      </div>
      <button
        onClick={() => handleAddNode(null)}
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        + Add item
      </button>
    </div>
  );
}

function NodeRow({
  node,
  depth,
  getChildren,
  statuses,
  assignees,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onCreateAssignee,
}: {
  node: JobNode;
  depth: number;
  getChildren: (parentId: string | null) => JobNode[];
  statuses: Status[];
  assignees: Assignee[];
  onAddNode: (parentId: string | null) => void;
  onUpdateNode: (nodeId: string, updates: Partial<JobNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateAssignee: (name: string) => Promise<string | null>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(node.name);
  const [addingAssignee, setAddingAssignee] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState("");

  const children = getChildren(node.id);
  const currentStatus = statuses.find((s) => s.id === node.status_id);

  async function handleNewAssignee() {
    if (!newAssigneeName.trim()) return;
    const newId = await onCreateAssignee(newAssigneeName.trim());
    if (newId) {
      onUpdateNode(node.id, { assignee_id: newId });
    }
    setNewAssigneeName("");
    setAddingAssignee(false);
  }

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 items-center p-2 border-t text-sm">
        <div className="col-span-4 flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
          {children.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 w-4">
              {expanded ? "▾" : "▸"}
            </button>
          )}
          {children.length === 0 && <span className="w-4" />}
          {editingName ? (
            <input
              autoFocus
              className="border rounded px-1 py-0.5 w-full"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={() => {
                setEditingName(false);
                onUpdateNode(node.id, { name: nameValue });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
          ) : (
            <span onClick={() => setEditingName(true)} className="cursor-pointer hover:underline">
              {node.name}
            </span>
          )}
        </div>

        <div className="col-span-2">
          <select
            className="w-full text-xs border rounded px-1 py-1"
            value={node.status_id ?? ""}
            onChange={(e) => onUpdateNode(node.id, { status_id: e.target.value || null })}
            style={{ backgroundColor: currentStatus ? `${currentStatus.color}22` : undefined }}
          >
            <option value="">—</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          {addingAssignee ? (
            <input
              autoFocus
              className="w-full text-xs border rounded px-1 py-1"
              placeholder="Name, Enter to save"
              value={newAssigneeName}
              onChange={(e) => setNewAssigneeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNewAssignee();
                if (e.key === "Escape") setAddingAssignee(false);
              }}
              onBlur={() => setAddingAssignee(false)}
            />
          ) : (
            <select
              className="w-full text-xs border rounded px-1 py-1"
              value={node.assignee_id ?? ""}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingAssignee(true);
                } else {
                  onUpdateNode(node.id, { assignee_id: e.target.value || null });
                }
              }}
            >
              <option value="">—</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
              <option value="__new__">+ New person...</option>
            </select>
          )}
        </div>

        <div className="col-span-1">
          <input
            type="date"
            className="w-full text-xs border rounded px-1 py-1"
            value={node.start_date ?? ""}
            onChange={(e) => onUpdateNode(node.id, { start_date: e.target.value || null })}
          />
        </div>

        <div className="col-span-1">
          <input
            type="date"
            className="w-full text-xs border rounded px-1 py-1"
            value={node.due_date ?? ""}
            onChange={(e) => onUpdateNode(node.id, { due_date: e.target.value || null })}
          />
        </div>

        <div className="col-span-2 flex gap-2 justify-end text-xs">
          <button onClick={() => onAddNode(node.id)} className="text-blue-600 hover:underline">
            + Sub
          </button>
          <button onClick={() => onDeleteNode(node.id)} className="text-red-500 hover:underline">
            ✕
          </button>
        </div>
      </div>

      {expanded && children.map((child) => (
        <NodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          getChildren={getChildren}
          statuses={statuses}
          assignees={assignees}
          onAddNode={onAddNode}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          onCreateAssignee={onCreateAssignee}
        />
      ))}
    </div>
  );
}
