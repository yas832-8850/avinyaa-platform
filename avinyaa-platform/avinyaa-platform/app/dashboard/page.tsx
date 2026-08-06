// This is a SERVER component (no "use client") - it runs before the
// page ever reaches the browser, and talks to Supabase using the
// logged-in user's session (via cookies, set up in lib/supabase/server.ts)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get this user's profile (which org they belong to, their role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organisations(name, type)")
    .eq("id", user!.id)
    .single();

  // Get jobs - Row Level Security automatically limits this to
  // the user's own org (or ALL orgs if they're a super_admin).
  // No manual "where org_id = ..." needed here - the database enforces it.
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {profile?.organisations?.name ?? "Dashboard"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Signed in as {user!.email} — role: {profile?.role}
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Jobs</h2>
        {jobs && jobs.length > 0 ? (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Type</th>
                <th className="py-2">Status</th>
                <th className="py-2">Sell rate</th>
                <th className="py-2">Booked</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="py-2 capitalize">{job.job_type}</td>
                  <td className="py-2 capitalize">{job.status}</td>
                  <td className="py-2">${job.sell_rate}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No jobs yet — this is expected on a fresh database.
          </p>
        )}
      </div>
    </div>
  );
}
