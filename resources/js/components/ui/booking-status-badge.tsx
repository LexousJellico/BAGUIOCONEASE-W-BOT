import { Badge } from "@/components/ui/badge";

export default function BookingStatusBadge({ status }: { status?: string | null }) {
  const s = (status || "").toLowerCase();
  let cls = "bg-slate-500 text-white";
  switch (s) {
    case "pending":
      cls = "bg-slate-500 text-white";
      break;
    case "active":
      cls = "bg-green-600 text-white";
      break;
    case "confirmed":
      cls = "bg-blue-600 text-white";
      break;
    case "cancelled":
      cls = "bg-gray-600 text-white";
      break;
    case "declined":
      cls = "bg-red-600 text-white";
      break;
    case "completed":
      cls = "bg-indigo-600 text-white";
      break;
  }
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "-";
  return <Badge className={cls}>{label}</Badge>;
}
