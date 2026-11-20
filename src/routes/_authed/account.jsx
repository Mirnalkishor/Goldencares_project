import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, CalendarDays, Clock, MapPin, PhoneCall, Users } from "lucide-react";
import StatusPill from "@/components/site/StatusPill";
import { formatDate, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_authed/account")({
  head: () => ({
    meta: [{ title: "My bookings | GoldenCares" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const [bookings, setBookings] = useState(null);
  const [application, setApplication] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [bookingCursor, setBookingCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadError("");
    Promise.all([
      base44.entities.BookingRequest.filter(
        { created_by_id: user.id },
        { sort: "-created_date", limit: 50 },
      ),
      base44.entities.CaregiverApplication.filter(
        { created_by_id: user.id },
        { sort: "-created_date", limit: 1 },
      ),
    ])
      .then(([bookingPage, applicationPage]) => {
        if (!active) return;
        setBookings(bookingPage.items ?? []);
        setBookingCursor(bookingPage.next_cursor ?? null);
        setApplication(applicationPage.items?.[0] ?? null);
      })
      .catch((error) => {
        if (active) setLoadError(error?.message || "We could not load your requests. Please try again.");
      });

    return () => {
      active = false;
    };
  }, [user.id, reload]);

  async function loadMoreBookings() {
    if (!bookingCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError("");
    try {
      const page = await base44.entities.BookingRequest.filter(
        { created_by_id: user.id },
        { sort: "-created_date", limit: 50, cursor: bookingCursor },
      );
      setBookings((items) => [...(items ?? []), ...(page.items ?? [])]);
      setBookingCursor(page.next_cursor ?? null);
    } catch (error) {
      setLoadError(error?.message || "We could not load older requests. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  const firstName = (user.full_name || "").split(" ")[0] || "there";

  return (
    <section className="container-page py-12 lg:py-16">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary/70">Family portal</p>
          <h1 className="mt-3 font-heading text-[2.2rem] leading-tight text-foreground sm:text-[2.8rem]">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-[0.98rem] text-muted-foreground">
            Every visit you request appears here, with the status our team has set for it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[0.9rem] font-semibold text-primary-foreground"
          >
            Book a visit <ArrowRight className="h-4 w-4" />
          </Link>
          {user.role === "admin" ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-[0.9rem] font-semibold text-foreground"
            >
              Team view
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-9">
        <h2 className="font-heading text-[1.5rem] text-foreground">Your requests</h2>

        {loadError ? (
          <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.9rem] text-destructive">
            <p>{loadError}</p>
            <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-2 font-semibold underline">
              Try again
            </button>
          </div>
        ) : bookings === null ? (
          <div className="mt-5 space-y-3">
            {[0, 1].map((key) => (
              <div key={key} className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-card" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-5 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
            <p className="font-heading text-[1.3rem] text-foreground">No visits booked yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-[0.92rem] leading-relaxed text-muted-foreground">
              When you request a companion visit while signed in, it appears here with its status.
            </p>
            <Link to="/book" className="mt-5 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-primary">
              Request your first visit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {bookings.map((booking) => {
              const isCallback = booking.request_type === "callback";
              return (
                <li key={booking.id} className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-[1.25rem] leading-snug text-foreground">
                        {isCallback ? "Callback request" : booking.service_name}
                      </h3>
                      <p className="mt-1 text-[0.85rem] text-muted-foreground">
                        {isCallback
                          ? `${booking.city} · we call you back`
                          : `${formatDuration(booking.duration_hours)} · ${booking.city}`}
                      </p>
                    </div>
                    <StatusPill status={booking.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-[0.85rem] text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> {formatDate(booking.preferred_date)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> {booking.preferred_time || "Any time"}
                    </span>
                    {booking.address ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" /> {booking.address}
                      </span>
                    ) : null}
                    {booking.preferred_contact ? (
                      <span className="inline-flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-primary" /> {booking.preferred_contact}
                      </span>
                    ) : null}
                  </div>

                  {booking.notes ? (
                    <p className="mt-3 text-[0.85rem] leading-relaxed text-muted-foreground">{booking.notes}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {bookings?.length && bookingCursor && !loadError ? (
          <button
            type="button"
            onClick={loadMoreBookings}
            disabled={loadingMore}
            className="mt-5 rounded-full border border-border px-5 py-2.5 text-[0.88rem] font-semibold text-foreground disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load older requests"}
          </button>
        ) : null}
      </div>

      {application ? (
        <div className="mt-10 rounded-[1.5rem] border border-border bg-secondary/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-[1.25rem] text-foreground">Caregiver application</h2>
                <p className="text-[0.85rem] text-muted-foreground">
                  Submitted for {application.city} · {application.experience}
                </p>
              </div>
            </div>
            <StatusPill status={application.status} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
