import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { CONTACT, hasPhone, hasWhatsApp, telHref, whatsappHref } from "@/lib/site";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors";

export function CallAction({ className = "", label = "Call us" }) {
  if (hasPhone()) {
    return (
      <a href={telHref()} className={cn(base, className)} aria-label={`Call GoldenCares on ${CONTACT.phone}`}>
        <Phone className="h-4 w-4" /> {label}
      </a>
    );
  }
  return (
    <Link to="/contact" className={cn(base, className)} aria-label="Contact GoldenCares">
      <Phone className="h-4 w-4" /> Contact us
    </Link>
  );
}

export function WhatsAppAction({ className = "", label = "WhatsApp" }) {
  if (hasWhatsApp()) {
    return (
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, className)}
        aria-label="Message GoldenCares on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" /> {label}
      </a>
    );
  }
  return (
    <Link to="/contact" className={cn(base, className)} aria-label="Contact GoldenCares">
      <MessageCircle className="h-4 w-4" /> Message us
    </Link>
  );
}

export function EmailAction({ className = "", label = CONTACT.email }) {
  return (
    <a href={`mailto:${CONTACT.email}`} className={cn(base, className)} aria-label={`Email ${CONTACT.email}`}>
      <Mail className="h-4 w-4" /> {label}
    </a>
  );
}

export default function ContactActions({ className = "" }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <CallAction className="border border-border bg-card px-5 py-2.5 text-foreground hover:border-primary/40" />
      <WhatsAppAction className="border border-border bg-card px-5 py-2.5 text-foreground hover:border-primary/40" />
      <EmailAction className="border border-border bg-card px-5 py-2.5 text-foreground hover:border-primary/40" />
    </div>
  );
}
