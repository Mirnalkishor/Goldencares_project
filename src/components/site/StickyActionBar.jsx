import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { hasPhone, hasWhatsApp, telHref, whatsappHref } from "@/lib/site";

export default function StickyActionBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.startsWith("/book")) return null;

  const secondary = hasWhatsApp() ? (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message GoldenCares on WhatsApp"
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary/25 bg-card px-4 py-3 text-[0.88rem] font-semibold text-primary"
    >
      <MessageCircle className="h-4 w-4" /> WhatsApp
    </a>
  ) : hasPhone() ? (
    <a
      href={telHref()}
      aria-label="Call GoldenCares"
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary/25 bg-card px-4 py-3 text-[0.88rem] font-semibold text-primary"
    >
      <Phone className="h-4 w-4" /> Call us
    </a>
  ) : (
    <Link
      to="/contact"
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary/25 bg-card px-4 py-3 text-[0.88rem] font-semibold text-primary"
    >
      <MessageCircle className="h-4 w-4" /> Contact us
    </Link>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2.5">
        <Link
          to="/book"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-[0.9rem] font-semibold text-primary-foreground"
        >
          Book Care <ArrowRight className="h-4 w-4" />
        </Link>
        {secondary}
      </div>
    </div>
  );
}