"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { createRolloutUpload } from "./actions";

type ParsedStop = {
  site_name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  notes?: string;
};

type Upload = {
  id: string;
  file_name: string | null;
  created_at: string;
};

function findColumn(headers: string[], candidates: string[]): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = lowerHeaders.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export default function RolloutUploadForm({
  orgId,
  userId,
  initialUploads,
}: {
  orgId: string;
  userId: string;
  initialUploads: Upload[];
}) {
  const [uploads, setUploads] = useState<Upload[]>(initialUploads);
  const [parsedStops, setParsedStops] = useState<ParsedStop[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError("");
    setParsedStops([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setParseError("File appears to be empty.");
          return;
        }

        const headers = Object.keys(rows[0]);
        const siteCol = findColumn(headers, ["site name", "site", "store name", "store"]);
        const addressCol = findColumn(headers, ["address"]);
        const suburbCol = findColumn(headers, ["suburb"]);
        const stateCol = findColumn(headers, ["state"]);
        const postcodeCol = findColumn(headers, ["postcode", "post code", "zip"]);
        const notesCol = findColumn(headers, ["notes", "instructions", "special instructions"]);

        const missing = [];
        if (!siteCol) missing.push("Site Name");
        if (!addressCol) missing.push("Address");
        if (!suburbCol) missing.push("Suburb");
        if (!stateCol) missing.push("State");
        if (!postcodeCol) missing.push("Postcode");

        if (missing.length > 0) {
          setParseError(`Missing required column(s): ${missing.join(", ")}. Found columns: ${headers.join(", ")}`);
          return;
        }

        const stops: ParsedStop[] = rows.map((row) => ({
          site_name: String(row[siteCol!] ?? "").trim(),
          address: String(row[addressCol!] ?? "").trim(),
          suburb: String(row[suburbCol!] ?? "").trim(),
          state: String(row[stateCol!] ?? "").trim().toUpperCase(),
          postcode: String(row[postcodeCol!] ?? "").trim(),
          notes: notesCol ? String(row[notesCol] ?? "").trim() : undefined,
        }));

        setParsedStops(stops);
      } catch (err) {
        setParseError("Could not parse this file. Make sure it's a valid CSV or Excel file.");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function handleConfirmUpload() {
    if (parsedStops.length === 0) return;
    setSaving(true);
    const result = await createRolloutUpload(orgId, userId, fileName, parsedStops);
    if (result.success) {
      setUploads((prev) => [
        { id: result.uploadId!, file_name: fileName, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setParsedStops([]);
      setFileName("");
    } else {
      setParseError(result.error || "Failed to save upload.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-2">Upload Rollout File</h3>
        <p className="text-xs text-gray-500 mb-3">
          CSV or Excel file with columns: Site Name, Address, Suburb, State, Postcode (Notes optional).
        </p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="text-sm"
        />

        {parseError && (
          <p className="text-sm text-red-600 mt-2">{parseError}</p>
        )}

        {parsedStops.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              Preview — {parsedStops.length} stop{parsedStops.length !== 1 ? "s" : ""} found
            </p>
            <div className="border rounded max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1">Site Name</th>
                    <th className="text-left px-2 py-1">Address</th>
                    <th className="text-left px-2 py-1">Suburb</th>
                    <th className="text-left px-2 py-1">State</th>
                    <th className="text-left px-2 py-1">Postcode</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStops.map((stop, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{stop.site_name}</td>
                      <td className="px-2 py-1">{stop.address}</td>
                      <td className="px-2 py-1">{stop.suburb}</td>
                      <td className="px-2 py-1">{stop.state}</td>
                      <td className="px-2 py-1">{stop.postcode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleConfirmUpload}
              disabled={saving}
              className="mt-3 text-sm border rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : `Confirm & Save ${parsedStops.length} Stops`}
            </button>
          </div>
        )}
      </div>

      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3">Past Uploads</h3>
        {uploads.length === 0 && (
          <p className="text-sm text-gray-500">No uploads yet.</p>
        )}
        <div className="space-y-1">
          {uploads.map((upload) => (
            
             <a key={upload.id}
              href={`/dashboard/rollout/${upload.id}`}
              className="block border rounded px-3 py-2 text-sm hover:bg-gray-50"
            >
              {upload.file_name || "Untitled upload"} — {new Date(upload.created_at).toLocaleDateString()}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}