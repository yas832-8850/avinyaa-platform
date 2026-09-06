"use client";

import { useState } from "react";
import { setShareWithAvinyaa } from "./actions";

export default function ShareWithAvinyaaToggle({
  orgId,
  initialValue,
}: {
  orgId: string;
  initialValue: boolean;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleToggle(checked: boolean) {
    setEnabled(checked);
    setSaving(true);
    await setShareWithAvinyaa(orgId, checked);
    setSaving(false);
  }

  return (
    <div className="border border-[#2C313A] bg-[#1E2229] p-4">
      <h3 className="text-sm font-medium text-[#EDEEF0] mb-2">Share With Avinyaa</h3>
      <label className="flex items-center gap-2 text-sm text-[#8B92A0]">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        Let Avinyaa staff see data your team creates (jobs, quotes)
      </label>
      <p className="text-xs text-[#565C68] mt-2">
        By default, content your own team creates is private to your organisation. Turn this on if you want Avinyaa to be able to help with or see it.
      </p>
    </div>
  );
}
