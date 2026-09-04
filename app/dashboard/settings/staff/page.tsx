import { redirect } from "next/navigation";
import { getStaffForOrg } from "@/lib/staff";
import { getAuthContext } from "@/lib/auth";
import StaffManager from "./staff-manager";

export default async function StaffSettingsPage() {
  const { role } = await getAuthContext();

  const isMaster = role === "super_admin" || role === "client_admin" || role === "avinyaa_master";
  if (!isMaster) {
    redirect("/dashboard");
  }

  const result = await getStaffForOrg();
  if ("error" in result) {
    return (
      <div className="min-h-screen bg-[#15181D] p-6">
        <p className="text-sm text-[#E08080]">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-3xl">
        <div className="mb-4">
          <a href="/dashboard/settings" className="text-sm text-[#4FA8D8] hover:underline">← Back to Settings</a>
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Manage Staff</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-6">Create staff accounts and set what each person can access.</p>
        <StaffManager initialStaff={result.staff ?? []} />
      </div>
    </div>
  );
}
