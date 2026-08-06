import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddCarrierForm from "./add-carrier-form";

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
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-gray-600">
          Carrier management is only available to the master account.
        </p>
      </div>
    );
  }

  const { data: carriers } = await supabase
    .from("carriers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <a href="/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </a>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">Carriers</h1>
      <p className="mt-1 text-sm text-gray-500">
        Transport carriers and install partners you work with.
      </p>

      <div className="mt-6">
        <AddCarrierForm />
      </div>

      <div className="mt-8">
        {carriers && carriers.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Name</th>
                <th className="py-2">Service type</th>
                <th className="py-2">Status</th>
                <th className="py-2">Added</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((carrier) => (
                <tr key={carrier.id} className="border-b">
                  <td className="py-2 font-medium">{carrier.name}</td>
                  <td className="py-2 capitalize">{carrier.service_type}</td>
                  <td className="py-2 capitalize">{carrier.status}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(carrier.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500">
            No carriers yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}