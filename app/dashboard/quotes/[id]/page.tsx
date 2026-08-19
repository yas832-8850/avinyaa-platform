import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getQuote, getJobsForDropdown } from "../actions";
import QuoteBuilder from "./quote-builder";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const result = await getQuote(id);
  if (!result) notFound();

  const jobOptions = await getJobsForDropdown(profile.org_id);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4">
        <a href="/dashboard/quotes" className="text-sm text-blue-600 hover:underline">← Back to Quotes</a>
      </div>
      <QuoteBuilder
        orgId={profile.org_id}
        initialQuote={result.quote}
        initialTiers={result.tiers}
        initialLines={result.lines}
        initialFreight={result.freight}
        jobOptions={jobOptions}
      />
    </div>
  );
}