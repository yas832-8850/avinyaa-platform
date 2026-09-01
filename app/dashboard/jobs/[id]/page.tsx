import { notFound } from "next/navigation";
import EditJobForm from "./edit-job-form";
import PodUpload from "./pod-upload";
import StatusChip from "../../../components/ui/StatusChip";
import { getAuthContext } from "@/lib/auth";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, orgId, isSuperAdmin } = await getAuthContext();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) {
    notFound();
  }

  if (!isSuperAdmin && job.org_id !== orgId) {
    notFound();
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#15181D] p-8">
        <div className="mx-auto max-w-3xl">
          <a href="/dashboard/jobs" className="text-sm text-[#4FA8D8] hover:underline">
            ← Back to your jobs
          </a>
          <h1 className="mt-2 text-2xl font-semibold tracking-wide text-[#EDEEF0]">
            {job.job_type} job
          </h1>
          <div className="h-[2px] w-10 bg-[#F0A83A] mt-2 mb-2" />
          <p className="text-sm text-[#8B92A0] flex items-center gap-2">
            <span className="font-mono">Booked {new Date(job.created_at).toLocaleDateString()}</span>
            <StatusChip status={job.status} />
          </p>

          <div className="mt-6 border border-[#2C313A] bg-[#1E2229] p-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#8B92A0]">Rate</span>
              <span className="font-mono font-semibold text-[#EDEEF0]">${job.sell_rate}</span>
            </div>
            {job.notes && (
              <div className="mt-3 pt-3 border-t border-[#2C313A]">
                <span className="text-xs uppercase tracking-[0.1em] text-[#8B92A0]">Notes</span>
                <p className="text-sm text-[#EDEEF0] mt-1">{job.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { data: podFiles } = await supabase.storage.from("pods").list(id);

  const existingPods = await Promise.all(
    (podFiles ?? []).map(async (file) => {
      const { data } = await supabase.storage
        .from("pods")
        .createSignedUrl(`${id}/${file.name}`, 3600);
      return { name: file.name, url: data?.signedUrl ?? "" };
    })
  );

  return (
    <div className="min-h-screen bg-[#15181D] p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-sm text-[#4FA8D8] hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-semibold tracking-wide text-[#EDEEF0]">
          Edit Job — {job.job_type}
        </h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mt-2 mb-2" />
        <p className="text-sm text-[#8B92A0] flex items-center gap-2">
          <span className="font-mono">Booked {new Date(job.created_at).toLocaleDateString()}</span>
          <StatusChip status={job.status} />
        </p>

        <div className="mt-6">
          <EditJobForm job={job} />
        </div>

        <PodUpload jobId={id} existingPods={existingPods} />
      </div>
    </div>
  );
}
