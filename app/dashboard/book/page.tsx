import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookForm from "./book-form";

export default async function BookPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-gray-600">
          Your account isn&apos;t linked to an organisation yet.
        </p>
      </div>
    );
  }

  const { data: carriers } = await supabase
    .from("carriers")
    .select("id, name, cubic_factor")
    .eq("status", "active")
    .order("name");

  const { data: rateCards } = await supabase
    .from("carrier_rate_cards")
    .select("carrier_id, zone, rate_basis, rate_value");

  const { data: rules } = await supabase
    .from("margin_rules")
    .select("org_id, carrier_id, margin_percent");

  // Zones are derived from whatever rate cards exist, so the dropdown
  // only ever shows zones that actually have pricing set up
  const zones = Array.from(
    new Set((rateCards ?? []).map((rc) => rc.zone).filter(Boolean))
  ) as string[];

  return (
    <div className="mx-auto max-w-3xl p-8">
      <a href="/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </a>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">
        Book a Job
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Get an instant quote and book your shipment.
      </p>

      <div className="mt-6">
        <BookForm
          carriers={carriers ?? []}
          zones={zones}
          rateCards={(rateCards ?? []) as any}
          rules={(rules ?? []) as any}
          orgId={profile.org_id}
        />
      </div>
    </div>
  );
}