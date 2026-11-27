import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import BookingWizard from "@/components/booking/BookingWizard";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import { DisclaimerBand } from "@/components/site/Disclaimer";
import { CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/book")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  validateSearch: (search) => {
    const next = {};
    if (typeof search.service === "string" && search.service) next.service = search.service;
    const duration = Number(search.duration);
    if (Number.isFinite(duration) && duration > 0) next.duration = duration;
    return next;
  },
  head: () => ({
    meta: [
      { title: "Book a Senior Companion in Chandigarh, Mohali or Panchkula | GoldenCares" },
      {
        name: "description",
        content:
          "Book companionship for your parent in four short steps: service, hours, address, and timing. We confirm every detail by phone before the visit.",
      },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { service, duration } = Route.useSearch();

  return (
    <>
      <section className="border-b border-border bg-secondary/40">
        <div className="container-page py-8 lg:py-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to services
          </Link>
          <h1 className="mt-4 max-w-2xl font-heading text-[2.2rem] leading-[1.05] text-foreground text-balance sm:text-[2.8rem]">
            Book care in three minutes.
          </h1>
          <p className="mt-3 max-w-xl text-[1rem] leading-relaxed text-muted-foreground">
            Sign in or create an account to request care in four short steps. The exact quote for your service
            and duration appears before you submit; pay securely with Razorpay to place your request.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-[0.82rem] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Background-checked companions
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> {CONTACT.hours}
            </span>
          </div>
        </div>
      </section>

      <section className="container-page py-8 lg:py-14">
        <BookingWizard initialService={service} initialDuration={duration} />
      </section>

      <DisclaimerBand className="pb-16" />
    </>
  );
}
