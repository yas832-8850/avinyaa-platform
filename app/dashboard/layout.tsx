import Link from "next/link";
import SignOutButton from "./signout-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-56 border-r bg-gray-50 p-4 space-y-1 flex-shrink-0">
        <div className="font-semibold text-sm mb-4">Avinyaa Platform</div>

        <div className="text-xs text-gray-400 uppercase tracking-wide mt-4 mb-1">Freight</div>
        <Link href="/dashboard/jobs" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Jobs</Link>
        <Link href="/dashboard/jobs/new/multi-line" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">New Booking</Link>
        <Link href="/dashboard/carriers" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Carriers</Link>
        <Link href="/dashboard/margin-rules" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Margin Rules</Link>

        <div className="text-xs text-gray-400 uppercase tracking-wide mt-4 mb-1">Projects</div>
        <Link href="/dashboard/job-master" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Job Master List</Link>
        <Link href="/dashboard/reports/nodes" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">All Tasks Report</Link>
        <Link href="/dashboard/settings/statuses" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Status Settings</Link>
                <Link href="/dashboard/quotes" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Quotes</Link>
                        <Link href="/dashboard/settings/organisation" className="block text-sm py-1.5 px-2 rounded hover:bg-gray-200">Organisation Settings</Link>
              <div className="mt-6 pt-4 border-t">
          <SignOutButton />
        </div></nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}