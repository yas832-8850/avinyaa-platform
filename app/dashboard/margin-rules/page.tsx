import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddMarginRuleForm from "./add-margin-rule-form";

export default async function MarginRulesPage() {
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
          Margin rules are only available to the master account.
        </p>
      </div>
    );
  }

  const { data: organisations } = await supabase
    .from("organisations")
    .select("id, name")
    .eq("type", "client")
    .order("name");

  const { data: carriers } = await supabase
    .from("carriers")
    .select("id, name")
    .order("name");

  const { data: rules } = await supabase
    .from("margin_rules")
    .select("*, organisations(name), carriers(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <a href="/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </a>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">
        Margin Rules
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Set the margin percentage applied per client, optionally per carrier.
      </p>

      <div className="mt-6">
        <AddMarginRuleForm
          organisations={organisations ?? []}
          carriers={carriers ?? []}
        />
      </div>

      <div className="mt-8">
        {rules && rules.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Client</th>
                <th className="py-2">Carrier</th>
                <th className="py-2">Margin %</th>
                <th className="py-2">Added</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b">
                  <td className="py-2 font-medium">
                    {rule.organisations?.name ?? "—"}
                  </td>
                  <td className="py-2">
                    {rule.carriers?.name ?? (
                      <span className="text-gray-400">Default (all)</span>
                    )}
                  </td>
                  <td className="py-2">{rule.margin_percent}%</td>
                  <td className="py-2 text-gray-500">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500">
            No margin rules yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}