import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getQuotes } from "./actions";
import QuotesListClient from "./quotes-list-client";

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const quotes = await getQuotes(profile.org_id);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold mb-1">Margin Calculator / Quotes</h1>
      <p className="text-sm text-gray-500 mb-6">Work out sell price and margin, optionally linked to a job.</p>
      <QuotesListClient orgId={profile.org_id} initialQuotes={quotes} />
    </div>
  );
}