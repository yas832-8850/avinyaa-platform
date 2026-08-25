import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddCarrierForm from "./add-carrier-form";
import StatusChip from "../../components/ui/StatusChip";

export default async function CarriersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#15181D] p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[#8B92A0]">
            Carrier management is only available to the master account.
          </p>
        </div>
      </div>
    );
  }

  const { data: carriers } = await supabase
    .from("carriers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#15181D] p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-sm text-[#4FA8D8] hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-semibold tracking-wide text-[#EDEEF0]">Carriers</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mt-2 mb-2" />
        <p className="text-sm text-[#8B92A0]">
          Transport carriers and install partners you work with.
        </p>

        <div className="mt-6">
          <AddCarrierForm />
        </div>

        <div className="mt-8">
          {carriers && carriers.length > 0 ? (
            <div className="border border-[#2C313A]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C313A] bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Service type</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.map((carrier) => (
                    <tr key={carrier.id} className="border-b border-[#2C313A] text-[#EDEEF0] last:border-b-0">
                      <td className="px-3 py-3 font-medium">{carrier.name}</td>
                      <td className="px-3 py-3 capitalize">{carrier.service_type}</td>
                      <td className="px-3 py-3"><StatusChip status={carrier.status} /></td>
                      <td className="px-3 py-3 font-mono text-[#8B92A0]">
                        {new Date(carrier.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#8B92A0]">
              No carriers yet — add your first one above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
