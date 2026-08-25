const STATUS_COLORS: Record<string, string> = {
  pending: "border-[#8B92A0] text-[#8B92A0]",
  active: "border-[#4FA8D8] text-[#4FA8D8]",
  booked: "border-[#4FA8D8] text-[#4FA8D8]",
  in_progress: "border-[#F0A83A] text-[#F0A83A]",
  completed: "border-[#5FB88A] text-[#5FB88A]",
  cancelled: "border-[#E08080] text-[#E08080]",
};

export default function StatusChip({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status.toLowerCase()] ?? "border-[#8B92A0] text-[#8B92A0]";
  return (
    <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${colorClass}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}