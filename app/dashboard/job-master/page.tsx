import { getJobsMaster, getMasterOrgId } from "./actions";
import NewJobMasterForm from "./new-job-master-form";
import JobsMasterTable from "./jobs-master-table";
import SequenceSettings from "./sequence-settings";
import { getAuthContext } from "@/lib/auth";

export default async function JobMasterPage() {
  const { orgId: viewerOrgId, isSuperAdmin } = await getAuthContext();

  const masterOrgId = await getMasterOrgId();
  const jobs = await getJobsMaster(isSuperAdmin, viewerOrgId);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-6xl">
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Job Master List</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-6" />
        {masterOrgId && (
          <NewJobMasterForm orgId={masterOrgId} isSuperAdmin={isSuperAdmin} viewerOrgId={viewerOrgId} />
        )}
        {isSuperAdmin && masterOrgId && (
          <div className="my-4">
            <SequenceSettings orgId={masterOrgId} />
          </div>
        )}
        <JobsMasterTable jobs={jobs} />
      </div>
    </div>
  );
}
