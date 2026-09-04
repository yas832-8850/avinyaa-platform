"use client";

import { useState } from "react";
import { createStaffAccount, setStaffPermission } from "@/lib/staff";
import { useRouter } from "next/navigation";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const MODULES: { key: string; label: string }[] = [
  { key: "freight", label: "Freight" },
  { key: "job_master", label: "Job Master" },
  { key: "quotes", label: "Quotes" },
  { key: "installers_rollout", label: "Installers/Rollout" },
  { key: "settings", label: "Settings" },
];

type Permission = {
  module: string;
  access_level: string;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  role: string;
  permissions: Permission[];
};

export default function StaffManager({ initialStaff }: { initialStaff: StaffMember[] }) {
  const router = useRouter();
    const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; tempPassword: string } | null>(null);

  async function handleCreate() {
    if (!email.trim() || !fullName.trim()) return;
    setError(null);
    setCreating(true);
    const result = await createStaffAccount(email.trim(), fullName.trim());
    setCreating(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCreatedCreds({ email: result.email!, tempPassword: result.tempPassword! });
    setEmail("");
    setFullName("");
    router.refresh();
  }

  async function handlePermissionChange(staffId: string, moduleKey: string, level: string) {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const otherPerms = s.permissions.filter((p) => p.module !== moduleKey);
        const newPerms = level === "none" ? otherPerms : [...otherPerms, { module: moduleKey, access_level: level }];
        return { ...s, permissions: newPerms };
      })
    );
    await setStaffPermission(staffId, moduleKey as any, level as any);
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#2C313A] bg-[#1E2229] p-4">
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">Add Staff Member</h3>
        <div className="grid grid-cols-2 gap-3 items-end">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={handleCreate} disabled={creating || !email.trim() || !fullName.trim()}>
            {creating ? "Creating..." : "Create Staff Account"}
          </Button>
        </div>

        {error && <p className="text-sm text-[#E08080] mt-2">{error}</p>}

        {createdCreds && (
          <div className="mt-3 border border-[#F0A83A] bg-[#221818] p-3">
            <p className="text-sm text-[#F0A83A] font-medium mb-1">Account created — share these details with them now, they won't be shown again:</p>
            <p className="text-sm text-[#EDEEF0] font-mono">Email: {createdCreds.email}</p>
            <p className="text-sm text-[#EDEEF0] font-mono">Temporary password: {createdCreds.tempPassword}</p>
          </div>
        )}
      </div>

      <div className="border border-[#2C313A]">
        <table className="w-full text-sm">
          <thead className="bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
            <tr>
              <th className="px-3 py-3">Name</th>
              {MODULES.map((m) => (
                <th key={m.key} className="px-3 py-3">{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && (
              <tr>
                <td colSpan={MODULES.length + 1} className="p-4 text-center text-[#8B92A0]">
                  No staff yet — add one above.
                </td>
              </tr>
            )}
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-[#2C313A] text-[#EDEEF0]">
                <td className="px-3 py-3">{s.full_name}</td>
                {MODULES.map((m) => {
                  const current = s.permissions.find((p) => p.module === m.key)?.access_level ?? "none";
                  return (
                    <td key={m.key} className="px-3 py-3">
                      <select
                        value={current}
                        onChange={(e) => handlePermissionChange(s.id, m.key, e.target.value)}
                        className="border border-[#2C313A] bg-[#15181D] text-[#EDEEF0] text-xs px-2 py-1"
                      >
                        <option value="none">None</option>
                        <option value="view">View</option>
                        <option value="full">Full</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
