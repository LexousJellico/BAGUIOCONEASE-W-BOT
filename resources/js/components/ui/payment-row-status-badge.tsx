import { Badge } from "@/components/ui/badge";

export default function PaymentRowStatusBadge({ status }: { status?: string | null }) {
  const s = (status || "").toLowerCase();
  let cls = "bg-slate-500 text-white";
  switch (s) {
    case "pending":
      cls = "bg-amber-500 text-black";
      break;
    case "confirmed":
      cls = "bg-green-600 text-white";
      break;
    case "failed":
      cls = "bg-red-600 text-white";
      break;
    case "declined":
      cls = "bg-rose-600 text-white";
      break;
    case "refunded":
      cls = "bg-indigo-600 text-white";
      break;
  }
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "-";
  return <Badge className={cls}>{label}</Badge>;
}
