import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin } from "lucide-react";
import { CITIES, CONTACT, DISCLAIMER, NAV } from "@/lib/site";
import { useLiveServices } from "@/lib/serviceCatalog";
import Brand from "./Brand";
import { CallAction, WhatsAppAction } from "./ContactActions";

const legal = [
  { label: "Policies", to: "/policies" },
  { label: "Privacy", to: "/policies", hash: "privacy" },
  { label: "Terms", to: "/policies", hash: "terms" },
  { label: "Refunds", to: "/policies", hash: "refunds" },
];

export default function SiteFooter() {
  const { services } = useLiveServices();
  return (
    <footer className="mt-20 bg-primary text-primary-foreground">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_0.9fr]">
          <div>
            <Brand light />
            <p className="mt-5 max-w-xs text-[0.92rem] leading-relaxed text-primary-foreground/70">
              Companionship and everyday help for seniors in Chandigarh, Mohali and Panchkula.
              Verified people, warm company, care that can start within hours.
            </p>
            <div className="mt-5 space-y-2.5 text-[0.88rem] text-primary-foreground/70">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 hover:text-primary-foreground">
                <Mail className="h-4 w-4 shrink-0" /> {CONTACT.email}
              </a>
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0" /> {CONTACT.address}
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0" /> {CONTACT.hours}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-[0.7rem] font-semibold uppercase text-primary-foreground/50" style={{ letterSpacing: "0.2em" }}>
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.9rem] text-primary-foreground/75">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    to="/services/$slug"
                    params={{ slug: service.slug }}
                    className="transition-colors hover:text-primary-foreground"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[0.7rem] font-semibold uppercase text-primary-foreground/50" style={{ letterSpacing: "0.2em" }}>
              GoldenCares
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.9rem] text-primary-foreground/75">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-primary-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/faq" className="transition-colors hover:text-primary-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/join" className="transition-colors hover:text-primary-foreground">
                  Become a caregiver
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.7rem] font-semibold uppercase text-primary-foreground/50" style={{ letterSpacing: "0.2em" }}>
              Families
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.9rem] text-primary-foreground/75">
              <li>
                <Link to="/book" className="transition-colors hover:text-primary-foreground">
                  Book care
                </Link>
              </li>
              <li>
                <Link to="/account" className="transition-colors hover:text-primary-foreground">
                  My bookings
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition-colors hover:text-primary-foreground">
                  Sign in
                </Link>
              </li>
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    hash={item.hash}
                    className="transition-colors hover:text-primary-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <CallAction className="border border-primary-foreground/20 px-4 py-2.5 text-primary-foreground hover:border-primary-foreground/50" />
              <WhatsAppAction className="border border-primary-foreground/20 px-4 py-2.5 text-primary-foreground hover:border-primary-foreground/50" />
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-primary-foreground/15 p-5">
          <p className="text-[0.82rem] leading-relaxed text-primary-foreground/65">{DISCLAIMER}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-primary-foreground/15 pt-6 text-[0.78rem] text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 GoldenCares. Made with care in Chandigarh.</p>
          <p>Serving {CITIES.join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
