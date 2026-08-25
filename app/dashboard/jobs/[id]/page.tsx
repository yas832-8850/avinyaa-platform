import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditJobForm from "./edit-job-form";
import PodUpload from "./pod-upload";
import StatusChip from "../../../components/ui/StatusChip";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#15181D] p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[#8B92A0]">
            Editing jobs is only available to the master account.
          </p>
        </div>
      </div>
    );
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) {
    notFound();
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
