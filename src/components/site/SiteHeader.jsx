import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, LogOut, MessageCircle, Phone, ShieldCheck, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthContext";
import { CITIES, CONTACT, hasPhone, hasWhatsApp, telHref, whatsappHref } from "@/lib/site";
import { services } from "@/lib/services";
import Brand from "./Brand";
import MobileNav from "./MobileNav";

function HeaderContactButton() {
  const className =
    "hidden h-10 w-10 place-items-center rounded-full border border-border text-primary transition-colors hover:border-primary/45 hover:bg-secondary sm:grid";

  if (hasPhone()) {
    return (
      <a href={telHref()} aria-label={`Call GoldenCares on ${CONTACT.phone}`} className={className}>
        <Phone className="h-4 w-4" />
      </a>
    );
  }
  if (hasWhatsApp()) {
    return (
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message GoldenCares on WhatsApp"
        className={className}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    );
  }
  return (
    <Link to="/contact" aria-label="Call or message GoldenCares" className={className}>
      <Phone className="h-4 w-4" />
    </Link>
  );
}

export default function SiteHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="container-page flex items-center justify-between gap-6 py-2 text-[0.78rem]">
          <p className="flex items-center gap-2 text-primary-foreground/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Care can start within hours · {CITIES.join(" · ")}
          </p>
          <div className="flex items-center gap-5 text-primary-foreground/75">
            <span>{CONTACT.hours}</span>
            {hasPhone() ? (
              <a href={telHref()} className="inline-flex items-center gap-1.5 hover:text-primary-foreground">
                <Phone className="h-3.5 w-3.5" /> {CONTACT.phone}
              </a>
            ) : null}
            <a href={`mailto:${CONTACT.email}`} className="hover:text-primary-foreground">
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      <div
        className={`border-b bg-background/95 backdrop-blur-md transition-all duration-300 ${
          scrolled ? "border-border shadow-[0_10px_30px_-24px_rgba(11,58,58,0.5)]" : "border-transparent"
        }`}
      >
        <div className="container-page flex items-center justify-between gap-4 py-3.5">
          <Brand />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.93rem] font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
                >
                  Services <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[19rem] rounded-2xl border-border bg-card p-2">
                <DropdownMenuLabel className="px-2 pb-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Eight ways we help
                </DropdownMenuLabel>
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <DropdownMenuItem key={service.slug} asChild className="rounded-xl px-2 py-2">
                      <Link to="/services/$slug" params={{ slug: service.slug }} className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[0.9rem] text-foreground">{service.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem asChild className="rounded-xl px-2 py-2">
                  <Link to="/services" className="flex items-center gap-2 text-[0.88rem] font-semibold text-primary">
                    See all services <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/how-it-works"
              className="rounded-full px-3.5 py-2 text-[0.93rem] font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
            >
              How it works
            </Link>
            <Link
              to="/caregivers"
              className="rounded-full px-3.5 py-2 text-[0.93rem] font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
            >
              Find caregivers
            </Link>
            <Link
              to="/about"
              className="rounded-full px-3.5 py-2 text-[0.93rem] font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="rounded-full px-3.5 py-2 text-[0.93rem] font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Your account"
                    className="hidden h-10 w-10 place-items-center rounded-full border border-border bg-secondary text-[0.8rem] font-semibold text-primary sm:grid"
                  >
                    {initials || <UserRound className="h-4 w-4" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border bg-card p-2">
                  <DropdownMenuLabel className="px-2 pb-2">
                    <span className="block text-[0.85rem] font-semibold text-foreground">
                      {user?.full_name || "Your account"}
                    </span>
                    <span className="block truncate text-[0.75rem] font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/account">My bookings</Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" ? (
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/admin">Team view</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/join">Become a caregiver</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => logout()} className="rounded-xl text-muted-foreground">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-foreground/75 transition-colors hover:text-primary sm:block"
              >
                Sign in
              </Link>
            )}

            <HeaderContactButton />

            <Link
              to="/book"
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Book Care Now <ArrowRight className="h-4 w-4" />
            </Link>

            <MobileNav />
          </div>
        </div>
      </div>

      <div
        className={`${
          scrolled ? "hidden" : "hidden md:flex"
        } items-center justify-center gap-2 border-b border-border/70 bg-secondary/40 py-1.5 text-[0.74rem] text-muted-foreground`}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Background-checked, in-person interviewed companions · Companionship and assistance only
      </div>
    </header>
  );
}