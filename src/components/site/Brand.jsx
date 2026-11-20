import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="GoldenCares"
      className={cn("h-10 w-10", className)}
    >
      <rect x="0" y="0" width="40" height="40" rx="12" fill="hsl(var(--primary))" />
      <path
        d="M12.5 29.5V19.5a7.5 7.5 0 0 1 15 0v10"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20.5" r="3.1" fill="hsl(var(--accent))" />
      <path
        d="M10 29.5h20"
        stroke="hsl(var(--primary-foreground))"
        strokeOpacity="0.55"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Brand({ light = false, compact = false, className = "" }) {
  return (
    <Link
      to="/"
      aria-label="GoldenCares home"
      className={cn("group inline-flex items-center gap-3 rounded-xl", className)}
    >
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-3" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-[1.35rem] tracking-[-0.02em]",
            light ? "text-primary-foreground" : "text-foreground"
          )}
        >
          Golden<span className="italic text-accent">Cares</span>
        </span>
        {compact ? null : (
          <span
            className={cn(
              "mt-1.5 text-[0.58rem] font-semibold uppercase",
              light ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
            style={{ letterSpacing: "0.22em" }}
          >
            Companion care · Tricity
          </span>
        )}
      </span>
    </Link>
  );
}