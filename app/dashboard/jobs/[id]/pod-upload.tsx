"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadPod, deletePod } from "./actions";
import Button from "../../../components/ui/Button";

type PodFile = {
  name: string;
  url: string;
};

export default function PodUpload({
  jobId,
  existingPods,
}: {
  jobId: string;
  existingPods: PodFile[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await uploadPod(jobId, formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`Delete ${fileName}? This can't be undone.`)) return;

    setDeletingName(fileName);
    setError(null);

    const result = await deletePod(jobId, fileName);

    setDeletingName(null);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-6 border border-[#2C313A] bg-[#1E2229] p-6">
      <h2 className="text-sm font-medium text-[#EDEEF0]">Proof of Delivery</h2>

      {existingPods.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {existingPods.map((pod) => (
            <li key={pod.url} className="flex items-center gap-3">
              <a href={pod.url} target="_blank" className="text-sm text-[#4FA8D8] hover:underline">{pod.name}</a>
              <button
                type="button"
                onClick={() => handleDelete(pod.name)}
                disabled={deletingName === pod.name}
                className="text-xs font-medium text-[#E08080] hover:underline disabled:opacity-50"
              >
                {deletingName === pod.name ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#565C68]">No files uploaded yet.</p>
      )}

      <form ref={formRef} action={handleSubmit} className="mt-4 flex items-center gap-3">
        <input
          type="file"
          name="pod_file"
          accept="image/*,application/pdf"
          required
          className="text-sm text-[#8B92A0]"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-[#E08080]">{error}</p>}
    </div>
  );
}
