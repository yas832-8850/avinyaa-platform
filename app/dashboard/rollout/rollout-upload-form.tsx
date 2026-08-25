"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { createRolloutUpload, deleteRolloutUpload, getClientOrgs } from "./actions";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";

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

type ClientOrg = {
  id: string;
  name: string;
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
  const [clientOrgs, setClientOrgs] = useState<ClientOrg[]>([]);
  const [clientOrgId, setClientOrgId] = useState("");

  useEffect(() => {
    getClientOrgs().then(setClientOrgs);
  }, []);

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
    if (!clientOrgId) {
      setParseError("Please select a client before confirming the upload.");
      return;
    }
    setSaving(true);
    const result = await createRolloutUpload(orgId, userId, fileName, parsedStops, clientOrgId);
    if (result.success) {
      setUploads((prev) => [
        { id: result.uploadId!, file_name: fileName, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setParsedStops([]);
      setFileName("");
      setClientOrgId("");
    } else {
      setParseError(result.error || "Failed to save upload.");
    }
    setSaving(false);
  }

  async function handleDeleteUpload(uploadId: string) {
    const confirmed = window.confirm("Delete this rollout upload and all its stops? This can't be undone.");
    if (!confirmed) return;
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
    await deleteRolloutUpload(uploadId);
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#2C313A] bg-[#1E2229] p-4">
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-2">Upload Rollout File</h3>
        <p className="text-xs text-[#8B92A0] mb-3">
          CSV or Excel file with columns: Site Name, Address, Suburb, State, Postcode (Notes optional).
        </p>
       <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="text-sm text-[#8B92A0] file:mr-3 file:px-4 file:py-2 file:border-0 file:bg-[#F0A83A] file:text-[#15181D] file:text-sm file:font-medium file:cursor-pointer hover:file:opacity-90" /> 

        {parseError && (
          <p className="text-sm text-[#E08080] mt-2">{parseError}</p>
        )}

        {parsedStops.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-[#EDEEF0] mb-2">
              Preview — {parsedStops.length} stop{parsedStops.length !== 1 ? "s" : ""} found
            </p>

            <div className="max-w-xs mb-3">
              <Select label="Client" value={clientOrgId} onChange={(e) => setClientOrgId(e.target.value)}>
                <option value="">— Select client —</option>
                {clientOrgs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div className="border border-[#2C313A] max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#15181D] sticky top-0 text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
                  <tr>
                    <th className="text-left px-2 py-2">Site Name</th>
                    <th className="text-left px-2 py-2">Address</th>
                    <th className="text-left px-2 py-2">Suburb</th>
                    <th className="text-left px-2 py-2">State</th>
                    <th className="text-left px-2 py-2">Postcode</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStops.map((stop, i) => (
                    <tr key={i} className="border-t border-[#2C313A] text-[#EDEEF0]">
                      <td className="px-2 py-1.5">{stop.site_name}</td>
                      <td className="px-2 py-1.5">{stop.address}</td>
                      <td className="px-2 py-1.5">{stop.suburb}</td>
                      <td className="px-2 py-1.5">{stop.state}</td>
                      <td className="px-2 py-1.5 font-mono">{stop.postcode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Button onClick={handleConfirmUpload} disabled={saving} variant="primary">
                {saving ? "Saving..." : `Confirm & Save ${parsedStops.length} Stops`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-[#2C313A] bg-[#1E2229] p-4">
        <h3 className="text-sm font-medium text-[#EDEEF0] mb-3">Past Uploads</h3>
        {uploads.length === 0 && (
          <p className="text-sm text-[#8B92A0]">No uploads yet.</p>
        )}
        <div className="space-y-1">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center justify-between border border-[#2C313A] px-3 py-2 text-sm hover:bg-[#15181D]">
              <a href={`/dashboard/rollout/${upload.id}`} className="flex-1 text-[#EDEEF0]">{upload.file_name || "Untitled upload"} — <span className="font-mono text-[#8B92A0]">{new Date(upload.created_at).toLocaleDateString()}</span></a>
              <button onClick={() => handleDeleteUpload(upload.id)} className="text-[#E08080] hover:text-[#f0a0a0] text-xs ml-3">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
