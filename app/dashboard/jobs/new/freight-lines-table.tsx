"use client";

import { useState, useEffect } from "react";
import Button from "../../../components/ui/Button";

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

  const cellInput = "w-full border border-[#2C313A] bg-[#15181D] px-1.5 py-1 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]";

  return (
    <div className="border border-[#2C313A]">
      <table className="w-full text-sm">
        <thead className="bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
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
              <tr key={index} className="border-t border-[#2C313A] text-[#EDEEF0]">
                <td className="p-2 font-mono text-[#8B92A0]">{index + 1}.</td>
                <td className="p-2">
                  <input className={cellInput} value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
                </td>
                <td className="p-2">
                  <input className={cellInput} value={line.pack_type} onChange={(e) => updateLine(index, "pack_type", e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" step="0.01" className={cellInput} value={line.length_m || ""} onChange={(e) => updateLine(index, "length_m", e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" step="0.01" className={cellInput} value={line.width_m || ""} onChange={(e) => updateLine(index, "width_m", e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" step="0.01" className={cellInput} value={line.height_m || ""} onChange={(e) => updateLine(index, "height_m", e.target.value)} />
                </td>
                <td className="p-2 font-mono text-[#8B92A0]">{lineVolume.toFixed(3)}</td>
                <td className="p-2">
                  <input type="number" step="0.1" className={cellInput} value={line.weight_kg || ""} onChange={(e) => updateLine(index, "weight_kg", e.target.value)} />
                </td>
                <td className="p-2">
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(index)} className="text-[#E08080] hover:text-[#f0a0a0]">✕</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-[#1E2229] border-t border-[#2C313A] font-medium text-[#EDEEF0]">
          <tr>
            <td colSpan={6} className="p-2 text-right text-[#8B92A0]">Totals:</td>
            <td className="p-2 font-mono">{totalVolume.toFixed(3)}</td>
            <td className="p-2 font-mono">{totalWeight.toFixed(1)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div className="p-2 bg-[#1E2229]">
        <Button type="button" variant="primary" onClick={addLine}>Add Line</Button>
      </div>
    </div>
  );
}
