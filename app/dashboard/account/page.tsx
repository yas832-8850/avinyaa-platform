import { getAuthContext } from "@/lib/auth";
import ChangePasswordForm from "./change-password-form";

export default async function AccountPage() {
  const { user } = await getAuthContext();

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Account Settings</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-6 font-mono">{user!.email}</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
