"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadPod } from "./actions";

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

  return (
    <div className="mt-6 rounded-lg border bg-gray-50 p-6">
      <h2 className="text-sm font-medium text-gray-900">Proof of Delivery</h2>

      {existingPods.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {existingPods.map((pod) => (
            <li key={pod.url}>
              <a href={pod.url} target="_blank" className="text-sm text-blue-600 hover:underline">{pod.name}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-400">No files uploaded yet.</p>
      )}

      <form ref={formRef} action={handleSubmit} className="mt-4 flex items-center gap-3">
        <input
          type="file"
          name="pod_file"
          accept="image/*,application/pdf"
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}