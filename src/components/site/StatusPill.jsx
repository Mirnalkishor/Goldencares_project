import { cn } from "@/lib/utils";

const STYLES = {
  new: { label: "Request received", classes: "border-blue-200 bg-blue-50 text-blue-800" },
  contacted: { label: "We've been in touch", classes: "border-amber-200 bg-amber-50 text-amber-900" },
  scheduled: { label: "Visit scheduled", classes: "border-purple-200 bg-purple-50 text-purple-800" },
  completed: { label: "Visit completed", classes: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  confirmed: { label: "Confirmed", classes: "border-purple-200 bg-purple-50 text-purple-800" },
  upcoming: { label: "Upcoming", classes: "border-purple-200 bg-purple-50 text-purple-800" },
  in_progress: { label: "Visit in progress", classes: "border-blue-200 bg-blue-50 text-blue-800" },
  completion_requested: { label: "Completion requested", classes: "border-amber-200 bg-amber-50 text-amber-900" },
  pending_payment: { label: "Awaiting payment", classes: "border-amber-200 bg-amber-50 text-amber-900" },
  caregiver_noshow: { label: "Caregiver no-show", classes: "border-rose-200 bg-rose-50 text-rose-800" },
  expired: { label: "Expired", classes: "border-border bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", classes: "border-border bg-muted text-muted-foreground" },
  reviewing: { label: "In review", classes: "border-amber-200 bg-amber-50 text-amber-900" },
  approved: { label: "Approved", classes: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  declined: { label: "Not this time", classes: "border-border bg-muted text-muted-foreground" },
};

export default function StatusPill({ status, className = "" }) {
  const style = STYLES[status] || STYLES.new;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[0.72rem] font-semibold",
        style.classes,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {style.label}
    </span>
  );
}
