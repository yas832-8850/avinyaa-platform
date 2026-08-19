"use client";

import { useState } from "react";
import { uploadLogo } from "./actions";

export default function LogoUploadForm({
  orgId,
  currentLogoUrl,
}: {
  orgId: string;
  currentLogoUrl: string | null;
}) {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("logo", selectedFile);

    const result = await uploadLogo(orgId, formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.logoUrl) {
      setLogoUrl(result.logoUrl);
      setSelectedFile(null);
    }
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      {logoUrl && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Current logo:</p>
          <img src={logoUrl} alt="Organisation logo" className="max-h-24 border rounded p-2" />
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Upload new logo (PNG or JPG)</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Logo"}
      </button>
    </div>
  );
}