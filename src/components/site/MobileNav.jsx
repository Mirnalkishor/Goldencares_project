import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { CONTACT, NAV } from "@/lib/site";
import { services } from "@/lib/services";
import Brand from "./Brand";
import { CallAction, EmailAction, WhatsAppAction } from "./ContactActions";

export default function MobileNav() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/40 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[92vw] max-w-sm border-l border-border bg-background p-0"
      >
        <SheetTitle className="sr-only">GoldenCares menu</SheetTitle>
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-10 pt-6">
          <Brand />

          <nav aria-label="Mobile" className="mt-7 flex flex-col divide-y divide-border/70 border-y border-border/70">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="py-3.5 font-heading text-[1.15rem] text-foreground">
                {item.label}
              </Link>
            ))}
            <Link to="/faq" className="py-3.5 font-heading text-[1.15rem] text-foreground">
              FAQ
            </Link>
          </nav>

          <div className="mt-6">
            <p className="eyebrow">Popular services</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {services.slice(0, 4).map((service) => (
                <Link
                  key={service.slug}
                  to="/services/$slug"
                  params={{ slug: service.slug }}
                  className="rounded-full border border-border px-3.5 py-1.5 text-[0.8rem] text-foreground/80"
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-4 pt-8">
            <Link
              to="/book"
              className="flex items-center justify-between rounded-full bg-primary px-5 py-3.5 text-[0.95rem] font-semibold text-primary-foreground"
            >
              Book Care Now <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <CallAction className="border border-border px-4 py-3 text-foreground" label="Call" />
              <WhatsAppAction className="border border-border px-4 py-3 text-foreground" />
            </div>
            <EmailAction className="w-full justify-start px-0 py-1 text-[0.85rem] font-medium text-muted-foreground" />

            {isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
                <Link
                  to="/account"
                  className="rounded-full border border-border px-4 py-3 text-center text-[0.85rem] font-semibold text-foreground"
                >
                  My bookings
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-3 text-[0.85rem] font-semibold text-muted-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
                {user?.role === "admin" ? (
                  <Link
                    to="/admin"
                    className="col-span-2 rounded-full bg-secondary px-4 py-3 text-center text-[0.85rem] font-semibold text-primary"
                  >
                    Team view
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
                <Link
                  to="/login"
                  className="rounded-full border border-border px-4 py-3 text-center text-[0.85rem] font-semibold text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full border border-border px-4 py-3 text-center text-[0.85rem] font-semibold text-foreground"
                >
                  Create account
                </Link>
              </div>
            )}

            <p className="text-[0.75rem] text-muted-foreground">{CONTACT.hours}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}