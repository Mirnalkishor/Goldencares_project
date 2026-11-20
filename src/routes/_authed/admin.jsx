import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Clock, MapPin, PhoneCall, Mail } from "lucide-react";
import StatusPill from "@/components/site/StatusPill";
import { formatDate, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_authed/admin")({
  head: () => ({
    meta: [{ title: "Team view | GoldenCares" }],
  }),
  component: AdminPage,
});

const BOOKING_STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"];
const APP_STATUSES = ["new", "reviewing", "approved", "declined"];
const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function AdminPage() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState("bookings");
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState(null);
  const [applications, setApplications] = useState(null);

  useEffect(() => {
    if (user.role !== "admin") return;
    let active = true;
    base44.entities.BookingRequest.filter({}, { sort: "-created_date", limit: 100 }).then((page) => {
      if (active) setBookings(page.items ?? []);
    });
    base44.entities.CaregiverApplication.filter({}, { sort: "-created_date", limit: 100 }).then((page) => {
      if (active) setApplications(page.items ?? []);
    });
    return () => {
      active = false;
    };
  }, [user.role]);

  if (user.role !== "admin") {
    return (
      <section className="container-page py-16">
        <div className="mx-auto max-w-md rounded-[1.75rem] border border-border bg-card p-8 text-center">
          <h1 className="font-heading text-[1.7rem] text-foreground">This page is for the GoldenCares team.</h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
            Your account does not have admin access. If you should have it, ask the app owner to change your
            role.
          </p>
        </div>
      </section>
    );
  }

  async function updateBooking(id, status) {
    setBookings((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    await base44.entities.BookingRequest.update(id, { status });
  }

  async function updateApplication(id, status) {
    setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    await base44.entities.CaregiverApplication.update(id, { status });
  }

  const visibleBookings = (bookings ?? []).filter((item) => filter === "all" || item.status === filter);
  const newCount = (bookings ?? []).filter((item) => item.status === "new").length;
  const newApps = (applications ?? []).filter((item) => item.status === "new").length;

  return (
    <section className="container-page py-12 lg:py-16">
      <p className="eyebrow text-primary/70">Team view</p>
      <h1 className="mt-3 font-heading text-[2.2rem] leading-tight text-foreground sm:text-[2.6rem]">
        Requests and applications
      </h1>
      <p className="mt-2 max-w-2xl text-[0.95rem] text-muted-foreground">
        New bookings appear here as soon as a family submits them. Change a status and the family sees it in
        their portal.
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("bookings")}
          className={`rounded-full px-4 py-2 text-[0.88rem] font-semibold transition-colors ${
            tab === "bookings" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground/75"
          }`}
        >
          Bookings {newCount ? <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.7rem] text-accent-foreground">{newCount}</span> : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("applications")}
          className={`rounded-full px-4 py-2 text-[0.88rem] font-semibold transition-colors ${
            tab === "applications" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground/75"
          }`}
        >
          Caregivers {newApps ? <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.7rem] text-accent-foreground">{newApps}</span> : null}
        </button>
      </div>

      {tab === "bookings" ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition-colors ${
                  filter === item.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {bookings === null ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-36 animate-pulse rounded-[1.5rem] border border-border bg-card" />
              ))}
            </div>
          ) : visibleBookings.length === 0 ? (
            <p className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-card p-8 text-center text-[0.92rem] text-muted-foreground">
              No bookings with this status.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {visibleBookings.map((booking) => (
                <li key={booking.id} className="rounded-[1.5rem] border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-[1.2rem] leading-snug text-foreground">
                        {booking.request_type === "callback" ? "Callback request" : booking.service_name}
                      </h2>
                      <p className="mt-1 text-[0.85rem] text-muted-foreground">
                        {booking.full_name} · {booking.city}
                        {booking.relationship ? ` · ${booking.relationship}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={booking.status} />
                      <label className="sr-only" htmlFor={`status-${booking.id}`}>
                        Change status
                      </label>
                      <select
                        id={`status-${booking.id}`}
                        value={booking.status}
                        onChange={(event) => updateBooking(booking.id, event.target.value)}
                        className="h-9 rounded-full border border-input bg-background px-3 text-[0.8rem] font-medium capitalize text-foreground"
                      >
                        {BOOKING_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-[0.82rem] text-muted-foreground">
                    {booking.request_type === "callback" ? null : (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" /> {formatDate(booking.preferred_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" /> {booking.preferred_time || "Any time"}
                        </span>
                        <span>{formatDuration(booking.duration_hours)}</span>
                      </>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-primary" />
                      <a href={`tel:${booking.phone}`} className="hover:text-primary">{booking.phone}</a>
                    </span>
                    {booking.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <a href={`mailto:${booking.email}`} className="hover:text-primary">{booking.email}</a>
                      </span>
                    ) : null}
                    {booking.address ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {booking.address}
                      </span>
                    ) : null}
                  </div>

                  {booking.notes ? (
                    <p className="mt-2 text-[0.82rem] leading-relaxed text-muted-foreground">{booking.notes}</p>
                  ) : null}
                  {booking.language_preference || booking.preferred_contact ? (
                    <p className="mt-2 text-[0.78rem] text-muted-foreground">
                      {booking.language_preference ? `Language: ${booking.language_preference}. ` : ""}
                      {booking.preferred_contact ? `Prefers: ${booking.preferred_contact}.` : ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : applications === null ? (
        <div className="mt-5 space-y-3">
          {[0, 1].map((key) => (
            <div key={key} className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-card" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-card p-8 text-center text-[0.92rem] text-muted-foreground">
          No caregiver applications yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {applications.map((application) => (
            <li key={application.id} className="rounded-[1.5rem] border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-[1.2rem] leading-snug text-foreground">{application.full_name}</h2>
                  <p className="mt-1 text-[0.85rem] text-muted-foreground">
                    {application.city} · {application.experience}
                    {application.languages ? ` · ${application.languages}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={application.status} />
                  <label className="sr-only" htmlFor={`app-status-${application.id}`}>
                    Change application status
                  </label>
                  <select
                    id={`app-status-${application.id}`}
                    value={application.status}
                    onChange={(event) => updateApplication(application.id, event.target.value)}
                    className="h-9 rounded-full border border-input bg-background px-3 text-[0.8rem] font-medium capitalize text-foreground"
                  >
                    {APP_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-[0.82rem] text-muted-foreground">
                <a href={`tel:${application.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                  <PhoneCall className="h-3.5 w-3.5 text-primary" /> {application.phone}
                </a>
                {application.email ? (
                  <a href={`mailto:${application.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {application.email}
                  </a>
                ) : null}
                {application.availability ? <span>Free: {application.availability}</span> : null}
              </div>
              {application.message ? (
                <p className="mt-2 text-[0.82rem] leading-relaxed text-muted-foreground">{application.message}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
