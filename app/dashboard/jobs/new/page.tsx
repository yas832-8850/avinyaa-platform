import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewJobForm from "./new-job-form";

export default async function NewJobPage() {
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
            Creating jobs is only available to the master account.
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
    .select("id, name, cubic_factor")
    .order("name");

  const { data: rateCards } = await supabase
    .from("carrier_rate_cards")
    .select("carrier_id, zone, rate_basis, rate_value");

  const { data: rules } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  const zones = Array.from(
    new Set((rateCards ?? []).map((rc) => rc.zone).filter(Boolean))
  ) as string[];

  return (
    <div className="min-h-screen bg-[#15181D] p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-sm text-[#4FA8D8] hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-semibold tracking-wide text-[#EDEEF0]">New Job</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mt-2 mb-2" />
        <p className="text-sm text-[#8B92A0]">
          Book a job for a client. The sell rate is calculated automatically
          from dimensions, weight, and the client&apos;s margin rule.
        </p>

        <div className="mt-6">
          <NewJobForm
            organisations={organisations ?? []}
            carriers={(carriers ?? []) as any}
            zones={zones}
            rateCards={(rateCards ?? []) as any}
            rules={(rules ?? []) as any}
          />
        </div>
      </div>
    </div>
  );
}
