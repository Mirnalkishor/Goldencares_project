import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className = "" }) {
  return (
    <img
      src="/images/goldencares-emblem.png"
      alt=""
      className={cn("h-10 w-10", className)}
    />
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