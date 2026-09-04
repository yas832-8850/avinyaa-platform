"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#2C313A] bg-[#1E2229] p-4 space-y-3">
      <h3 className="text-sm font-medium text-[#EDEEF0]">Change Password</h3>

      <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

      {error && <p className="text-sm text-[#E08080]">{error}</p>}
      {success && <p className="text-sm text-[#5FB88A]">Password updated successfully.</p>}

      <Button type="submit" variant="primary" disabled={submitting || !newPassword || !confirmPassword}>
        {submitting ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}
