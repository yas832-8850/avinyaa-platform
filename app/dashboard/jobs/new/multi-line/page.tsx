import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MultiLineJobForm from "../multi-line-form";
import { getContacts } from "../contacts-actions";

export default async function NewMultiLineJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: carriers } = await supabase
    .from("carriers")
    .select("id, name")
    .eq("status", "active");

  const contacts = await getContacts(profile.org_id);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">New Booking (Multi-Line)</h1>
      <MultiLineJobForm orgId={profile.org_id} carriers={carriers ?? []} contacts={contacts} />
    </div>
  );
}