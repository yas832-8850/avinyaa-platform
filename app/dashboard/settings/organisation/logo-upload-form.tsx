"use client";

import { useState } from "react";
import { uploadLogo } from "./actions";
import Button from "../../../components/ui/Button";

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
    <div className="border border-[#2C313A] bg-[#1E2229] p-4 space-y-4">
      {logoUrl && (
        <div>
          <p className="text-xs text-[#8B92A0] mb-2">Current logo:</p>
          <img src={logoUrl} alt="Organisation logo" className="max-h-24 border border-[#2C313A] p-2" />
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">Upload new logo (PNG or JPG)</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="text-sm text-[#8B92A0]"
        />
      </div>

      {error && (
        <div className="border border-[#3A2222] bg-[#221818] text-[#E08080] px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <Button onClick={handleUpload} disabled={!selectedFile || uploading} variant="primary">
        {uploading ? "Uploading..." : "Upload Logo"}
      </Button>
    </div>
  );
}