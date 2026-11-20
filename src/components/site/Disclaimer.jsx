import { Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DISCLAIMER } from "@/lib/site";

export function DisclaimerNote({ className = "" }) {
  return (
    <p className={`text-[0.82rem] leading-relaxed text-muted-foreground ${className}`}>{DISCLAIMER}</p>
  );
}

export function DisclaimerBand({ className = "" }) {
  return (
    <section className={className}>
      <div className="container-page">
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-secondary/50 p-6 sm:flex-row sm:items-center sm:gap-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-primary">
            <Info className="h-5 w-5" />
          </span>
          <p className="text-[0.9rem] leading-relaxed text-foreground/80">
            {DISCLAIMER}{" "}
            <Link to="/policies" className="font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4">
              Read our policies
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
