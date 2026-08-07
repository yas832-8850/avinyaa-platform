import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditJobForm from "./edit-job-form";
import PodUpload from "./pod-upload";

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
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-gray-600">
          Editing jobs is only available to the master account.
        </p>
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
    <div className="mx-auto max-w-3xl p-8">
      <a href="/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </a>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">
        Edit Job — {job.job_type}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Booked {new Date(job.created_at).toLocaleDateString()} · Status:{" "}
        {job.status.replace("_", " ")}
      </p>

      <div className="mt-6">
        <EditJobForm job={job} />
      </div>

      <PodUpload jobId={id} existingPods={existingPods} />
    </div>
  );
}