"use client";

import { useState, useEffect } from "react";

export type FreightLine = {
  description: string;
  pack_type: string;
  length_m: number;
  width_m: number;
  height_m: number;
  weight_kg: number;
};

const emptyLine = (): FreightLine => ({
  description: "",
  pack_type: "",
  length_m: 0,
  width_m: 0,
  height_m: 0,
  weight_kg: 0,
});

export default function FreightLinesTable({
  onChange,
}: {
  onChange: (lines: FreightLine[]) => void;
}) {
  const [lines, setLines] = useState<FreightLine[]>([emptyLine()]);

  useEffect(() => {
    onChange(lines);
  }, [lines, onChange]);

  function updateLine(index: number, field: keyof FreightLine, value: string) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const isNumeric = field === "length_m" || field === "width_m" || field === "height_m" || field === "weight_kg";
        return {
          ...line,
          [field]: isNumeric ? parseFloat(value) || 0 : value,
        };
      })
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const totalVolume = lines.reduce((sum, l) => sum + l.length_m * l.width_m * l.height_m, 0);
  const totalWeight = lines.reduce((sum, l) => sum + l.weight_kg, 0);

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 w-10">Line</th>
            <th className="p-2">Description</th>
            <th className="p-2">Pack Type</th>
            <th className="p-2 w-20">L (m)</th>
            <th className="p-2 w-20">W (m)</th>
            <th className="p-2 w-20">H (m)</th>
            <th className="p-2 w-20">M³</th>
            <th className="p-2 w-20">KGS</th>
            <th className="p-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => {
            const lineVolume = line.length_m * line.width_m * line.height_m;
            return (
              <tr key={index} className="border-t">
                <td className="p-2">{index + 1}.</td>
                <td className="p-2">
                  <input
                    className="w-full border rounded px-1 py-0.5"
                    value={line.description}
                    onChange={(e) => updateLine(index, "description", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border rounded px-1 py-0.5"
                    value={line.pack_type}
                    onChange={(e) => updateLine(index, "pack_type", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-1 py-0.5"
                    value={line.length_m || ""}
                    onChange={(e) => updateLine(index, "length_m", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-1 py-0.5"
                    value={line.width_m || ""}
                    onChange={(e) => updateLine(index, "width_m", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-1 py-0.5"
                    value={line.height_m || ""}
                    onChange={(e) => updateLine(index, "height_m", e.target.value)}
                  />
                </td>
                <td className="p-2 text-gray-600">{lineVolume.toFixed(3)}</td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border rounded px-1 py-0.5"
                    value={line.weight_kg || ""}
                    onChange={(e) => updateLine(index, "weight_kg", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t font-medium">
          <tr>
            <td colSpan={6} className="p-2 text-right">Totals:</td>
            <td className="p-2">{totalVolume.toFixed(3)}</td>
            <td className="p-2">{totalWeight.toFixed(1)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div className="p-2 bg-gray-50">
        <button
          type="button"
          onClick={addLine}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          Add Line
        </button>
      </div>
    </div>
  );
}