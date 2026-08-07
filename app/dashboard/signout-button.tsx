"use client";

import { signOut } from "./auth-actions";

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-gray-500 hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}