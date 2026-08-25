import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getJobsMaster } from "./actions";
import NewJobMasterForm from "./new-job-master-form";
import JobsMasterTable from "./jobs-master-table";
import SequenceSettings from "./sequence-settings";

export default async function JobMasterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const jobs = await getJobsMaster(profile.org_id);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-6xl">
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Job Master List</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-6" />
        <NewJobMasterForm orgId={profile.org_id} />
        <div className="my-4">
          <SequenceSettings orgId={profile.org_id} />
        </div>
        <JobsMasterTable jobs={jobs} />
      </div>
    </div>
  );
}
