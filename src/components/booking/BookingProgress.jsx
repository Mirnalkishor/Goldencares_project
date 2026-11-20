import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookingProgress({ steps, current, onJump }) {
  return (
    <div className="mb-6">
      <p className="text-[0.78rem] font-semibold text-muted-foreground lg:hidden">
        Step {current + 1} of {steps.length} · <span className="text-foreground">{steps[current].label}</span>
      </p>

      <div className="mt-3 flex gap-1.5 lg:hidden" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current + 1} aria-label="Booking progress">
        {steps.map((step, index) => (
          <span
            key={step.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index <= current ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      <ol className="hidden items-center gap-1 lg:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.key} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => (done ? onJump(index) : undefined)}
                aria-current={active ? "step" : undefined}
                disabled={!done}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[0.82rem] font-medium transition-colors",
                  active && "bg-primary text-primary-foreground",
                  done && "text-primary hover:bg-secondary",
                  !active && !done && "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[0.7rem] font-semibold",
                    active && "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground",
                    done && "border-primary bg-primary text-primary-foreground",
                    !active && !done && "border-border"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {step.label}
              </button>
              {index < steps.length - 1 ? <span className="h-px flex-1 bg-border" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
