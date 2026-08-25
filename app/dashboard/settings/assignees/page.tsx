import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAssignees } from "./actions";
import AssigneeManager from "./assignee-manager";

export default async function AssigneesSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const assignees = await getAssignees(profile.org_id);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-2xl">
        <div className="mb-4">
          <a href="/dashboard/job-master" className="text-sm text-[#4FA8D8] hover:underline">← Back to Job Master List</a>
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Assignee Settings</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-6">Manage the people who can be assigned to tasks.</p>
        <AssigneeManager orgId={profile.org_id} initialAssignees={assignees} />
      </div>
    </div>
  );
}
