import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChoiceCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  meta,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
          : selected
            ? "border-primary bg-primary/[0.06] ring-2 ring-primary/15"
            : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/35",
        className
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
            selected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[0.97rem] font-semibold leading-snug text-foreground">{title}</span>
          {selected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
        </span>
        {description ? (
          <span className="mt-1 block text-[0.85rem] leading-relaxed text-muted-foreground">{description}</span>
        ) : null}
        {meta ? (
          <span className="mt-1.5 block text-[0.68rem] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.14em" }}>
            {meta}
          </span>
        ) : null}
      </span>
    </button>
  );
}
