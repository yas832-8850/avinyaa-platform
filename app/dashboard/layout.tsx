import Link from "next/link";
import SignOutButton from "./signout-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#15181D]">
      <nav className="w-56 border-r border-[#2C313A] bg-[#1E2229] p-4 space-y-1 flex-shrink-0">
        <div className="text-sm font-semibold tracking-[0.15em] text-[#EDEEF0] mb-1">AVINYAA</div>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-4" />

        <div className="text-[10px] text-[#8B92A0] uppercase tracking-[0.15em] mt-4 mb-2">Freight</div>
        <Link href="/dashboard/jobs" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Jobs</Link>
        <Link href="/dashboard/jobs/new/multi-line" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">New Booking</Link>
        <Link href="/dashboard/carriers" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Carriers</Link>
        <Link href="/dashboard/margin-rules" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Margin Rules</Link>

        <div className="text-[10px] text-[#8B92A0] uppercase tracking-[0.15em] mt-5 mb-2">Projects</div>
        <Link href="/dashboard/job-master" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Job Master List</Link>
        <Link href="/dashboard/reports/nodes" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">All Tasks Report</Link>
        <Link href="/dashboard/quotes" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Quotes</Link>

        <div className="text-[10px] text-[#8B92A0] uppercase tracking-[0.15em] mt-5 mb-2">Admin</div>
        <Link href="/dashboard/settings" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Settings</Link>

        <div className="mt-6 pt-4 border-t border-[#2C313A]"><a href="/dashboard/account" className="block text-sm py-1.5 px-2 text-[#EDEEF0] hover:bg-[#15181D] hover:text-[#F0A83A]">Account Settings</a></div>
        <div className="mt-6 pt-4 border-t border-[#2C313A]">
          <SignOutButton />
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
