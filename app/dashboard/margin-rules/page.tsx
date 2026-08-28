import AddMarginRuleForm from "./add-margin-rule-form";
import { getAuthContext } from "@/lib/auth";

export default async function MarginRulesPage() {
  const { supabase, isSuperAdmin } = await getAuthContext();

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#15181D] p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[#8B92A0]">
            Margin rules are only available to the master account.
          </p>
        </div>
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
    <div className="min-h-screen bg-[#15181D] p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-sm text-[#4FA8D8] hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-semibold tracking-wide text-[#EDEEF0]">
          Margin Rules
        </h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mt-2 mb-2" />
        <p className="text-sm text-[#8B92A0]">
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
            <div className="border border-[#2C313A]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C313A] bg-[#1E2229] text-left text-[10px] uppercase tracking-[0.1em] text-[#8B92A0]">
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Carrier</th>
                    <th className="px-3 py-3">Margin %</th>
                    <th className="px-3 py-3">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-[#2C313A] text-[#EDEEF0] last:border-b-0">
                      <td className="px-3 py-3 font-medium">
                        {rule.organisations?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {rule.carriers?.name ?? (
                          <span className="text-[#565C68]">Default (all)</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-[#F0A83A]">{rule.margin_percent}%</td>
                      <td className="px-3 py-3 font-mono text-[#8B92A0]">
                        {new Date(rule.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#8B92A0]">
              No margin rules yet — add your first one above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
