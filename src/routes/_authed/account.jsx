import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  MailWarning,
  MapPin,
  PhoneCall,
  UserRound,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { auth as getAuthClient } from "@/api/firebaseClient";
import StatusPill from "@/components/site/StatusPill";
import { formatDate, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_authed/account")({
  head: () => ({
    meta: [{ title: "My account | GoldenCares" }],
  }),
  component: AccountPage,
});

const TABS = [
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "updates", label: "Updates", icon: Bell },
];

function paymentAmount(tx) {
  if (typeof tx?.amountDisplay === "number") return tx.amountDisplay;
  if (typeof tx?.amount === "number") return tx.amount / 100;
  return 0;
}

function paymentStatus(tx) {
  return tx?.status || tx?.paymentStatus || "pending";
}

function paymentReference(tx) {
  return tx?.bookingDisplayId || tx?.referenceDisplayId || tx?.referenceId || tx?.bookingId || tx?.id || "—";
}

function AccountPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  // Role comes from users/{uid} via base44.auth.me(); caregivers never see the
  // family account portal, so redirect before any family data is rendered.
  const isCaregiverRoute = user.role === "caregiver";
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState(null);
  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [bookingCursor, setBookingCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");

  useEffect(() => {
    if (isCaregiverRoute) {
      navigate({ to: "/caregiver", replace: true });
      return;
    }
    let active = true;
    setLoadError("");
    Promise.all([
      base44.entities.BookingRequest.filter(
        { userId: user.id },
        { sort: "-createdAt", limit: 50 },
      ),
      base44.entities.CaregiverApplication.filter(
        { email: user.email },
        { limit: 1 },
      ),
      base44.entities.User.get(user.id).catch(() => null),
      base44.entities.PaymentAttempt.filter(
        { userId: user.id },
        { sort: "-createdAt", limit: 50 },
      ).catch(() => ({ items: [] })),
    ])
      .then(([bookingPage, applicationPage, profileDoc, paymentPage]) => {
        if (!active) return;
        setBookings(bookingPage.items ?? []);
        setBookingCursor(bookingPage.next_cursor ?? null);
        setApplication(applicationPage.items?.[0] ?? null);
        setProfile(profileDoc);
        setPayments(paymentPage.items ?? []);
      })
      .catch((error) => {
        if (active) setLoadError(error?.message || "We could not load your account. Please try again.");
      });

    return () => {
      active = false;
    };
  }, [user.id, user.email, reload, isCaregiverRoute, navigate]);

  async function loadMoreBookings() {
    if (!bookingCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError("");
    try {
      const page = await base44.entities.BookingRequest.filter(
        { userId: user.id },
        { sort: "-createdAt", limit: 50, cursor: bookingCursor },
      );
      setBookings((items) => [...(items ?? []), ...(page.items ?? [])]);
      setBookingCursor(page.next_cursor ?? null);
    } catch (error) {
      setLoadError(error?.message || "We could not load older requests. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function resendVerification() {
    setVerificationNotice("");
    try {
      const currentUser = getAuthClient().currentUser;
      if (!currentUser) throw new Error("Please sign in again.");
      await sendEmailVerification(currentUser);
      setVerificationNotice("Verification email sent. Check your inbox and spam folder.");
    } catch (error) {
      setVerificationNotice(error?.message || "Could not send the verification email.");
    }
  }

  const effectiveRole = profile?.role || user.role || "family";
  const isCaregiver = effectiveRole === "caregiver";
  const firstName = (user.full_name || profile?.name || "").split(" ")[0] || "there";
  const displayName = user.full_name || profile?.name || user.email || "Your account";
  const displayPhone = profile?.phone || user.phone || "Not provided";
  const displayAddress = profile?.address || "Not provided";
  const emergencyContacts = profile?.emergencyContacts || [];

  if (isCaregiverRoute) {
    return (
      <section className="container-page py-16">
        <p className="text-center text-[0.95rem] text-muted-foreground">Opening your caregiver panel…</p>
      </section>
    );
  }

  return (
    <section className="container-page py-12 lg:py-16">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary/70">My account</p>
          <h1 className="mt-3 font-heading text-[2.2rem] leading-tight text-foreground sm:text-[2.8rem]">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-[0.98rem] text-muted-foreground">
            Bookings, profile, payments, and updates in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {isCaregiver ? (
            <Link
              to="/caregiver"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[0.9rem] font-semibold text-primary-foreground"
            >
              Caregiver panel <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[0.9rem] font-semibold text-primary-foreground"
            >
              Book a visit <ArrowRight className="h-4 w-4" />
            </Link>
          )}
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

      {!user.email_verified ? (
        <div className="mt-6 flex flex-col gap-3 rounded-[1.25rem] border border-amber-300/50 bg-amber-50 p-4 text-[0.9rem] text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MailWarning className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Verify your email address</p>
              <p className="mt-0.5 text-amber-800">
                Please verify your email so we can send booking confirmations and updates.
              </p>
              {verificationNotice ? <p className="mt-1 text-amber-800">{verificationNotice}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={resendVerification}
            className="shrink-0 rounded-full border border-amber-400 px-4 py-2 font-semibold text-amber-900"
          >
            Resend verification email
          </button>
        </div>
      ) : null}

      <div className={`mt-8 grid gap-3 ${isCaregiver ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <SummaryCard label="Bookings" value={bookings?.length ?? "—"} />
        <SummaryCard label="Payments" value={payments?.length ?? "—"} />
        {isCaregiver ? (
          <SummaryCard
            label="Caregiver application"
            value={application ? <StatusPill status={application.status} /> : "Not submitted"}
          />
        ) : null}
      </div>

      <div className="mt-9 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.88rem] font-semibold transition ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loadError ? (
        <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.9rem] text-destructive">
          <p>{loadError}</p>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-2 font-semibold underline">
            Try again
          </button>
        </div>
      ) : null}

      {tab === "bookings" ? (
        <BookingsTab
          bookings={bookings}
          bookingCursor={bookingCursor}
          loadingMore={loadingMore}
          loadMoreBookings={loadMoreBookings}
          loadError={loadError}
        />
      ) : null}

      {tab === "overview" ? (
        <OverviewTab
          bookings={bookings}
          payments={payments}
          application={application}
          firstName={firstName}
          isCaregiver={isCaregiver}
        />
      ) : null}

      {tab === "profile" ? (
        <ProfileTab
          displayName={displayName}
          email={user.email}
          phone={displayPhone}
          address={displayAddress}
          role={effectiveRole}
          emergencyContacts={emergencyContacts}
          application={application}
          isCaregiver={isCaregiver}
          verificationStatus={profile?.verificationStatus}
        />
      ) : null}

      {tab === "payments" ? <PaymentsTab payments={payments} /> : null}

      {tab === "updates" ? (
        <UpdatesTab
          bookings={bookings}
          application={application}
          payments={payments}
          isCaregiver={isCaregiver}
        />
      ) : null}
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-card p-4">
      <p className="text-[0.78rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 text-[1.5rem] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function BookingsTab({ bookings, bookingCursor, loadingMore, loadMoreBookings, loadError }) {
  return (
    <div className="mt-7">
      <h2 className="font-heading text-[1.5rem] text-foreground">Your requests</h2>

      {bookings === null ? (
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
  );
}

function OverviewTab({ bookings, payments, application, firstName, isCaregiver }) {
  const latestBooking = bookings?.[0];
  const latestPayment = payments?.[0];

  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      <div className="rounded-[1.5rem] border border-border bg-card p-6">
        <p className="eyebrow text-primary/70">At a glance</p>
        <h2 className="mt-2 font-heading text-[1.35rem] text-foreground">Hello, {firstName}.</h2>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
          Use this space to follow your requests, check payments, and keep your profile current.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link to="/book" className="rounded-full bg-primary px-4 py-2.5 text-[0.86rem] font-semibold text-primary-foreground">
            New booking
          </Link>
          <Link to="/services" className="rounded-full border border-border px-4 py-2.5 text-[0.86rem] font-semibold text-foreground">
            Browse services
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <InfoRow
          icon={CalendarDays}
          title="Latest booking"
          value={latestBooking ? latestBooking.service_name || "Callback request" : "No booking yet"}
          detail={latestBooking ? `${formatDate(latestBooking.preferred_date)} · ${latestBooking.status || "pending"}` : undefined}
        />
        <InfoRow
          icon={CreditCard}
          title="Latest payment"
          value={latestPayment ? `₹${paymentAmount(latestPayment).toFixed(2)}` : "No payment yet"}
          detail={latestPayment ? paymentStatus(latestPayment) : undefined}
        />
        {isCaregiver ? (
          <InfoRow
            icon={Users}
            title="Caregiver application"
            value={application ? "Submitted" : "Not submitted"}
            detail={application ? application.status || "new" : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, title, value, detail }) {
  return (
    <div className="flex items-start gap-3 rounded-[1.25rem] border border-border bg-card p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[0.78rem] uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-1 font-semibold text-foreground">{value}</p>
        {detail ? <p className="mt-0.5 text-[0.85rem] text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

function ProfileTab({
  displayName,
  email,
  phone,
  address,
  role,
  emergencyContacts,
  application,
  isCaregiver,
  verificationStatus,
}) {
  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      <div className="rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-[1.3rem] text-foreground">{displayName}</h2>
            <p className="text-[0.85rem] text-muted-foreground">{role}</p>
          </div>
        </div>
        <dl className="mt-5 space-y-3 text-[0.9rem]">
          <ProfileRow label="Email" value={email} />
          <ProfileRow label="Phone" value={phone} />
          <ProfileRow label="Address" value={address} />
          <ProfileRow label="Verification" value={verificationStatus || "Pending"} />
        </dl>
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-border bg-card p-6">
          <h3 className="font-heading text-[1.2rem] text-foreground">Emergency contacts</h3>
          {emergencyContacts.length === 0 ? (
            <p className="mt-2 text-[0.9rem] text-muted-foreground">No emergency contacts saved yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {emergencyContacts.map((contact, index) => (
                <li key={`${contact.name}-${index}`} className="rounded-xl bg-secondary/50 p-3 text-[0.88rem]">
                  <p className="font-semibold text-foreground">{contact.name}</p>
                  <p className="text-muted-foreground">
                    {contact.phone || contact.number} · {contact.relationship || contact.relation || "Contact"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isCaregiver && application ? (
          <div className="rounded-[1.5rem] border border-border bg-secondary/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-heading text-[1.2rem] text-foreground">Caregiver application</h3>
                  <p className="text-[0.85rem] text-muted-foreground">
                    Submitted for {application.city} · {application.experience}
                  </p>
                </div>
              </div>
              <StatusPill status={application.status} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function PaymentsTab({ payments }) {
  return (
    <div className="mt-7">
      <h2 className="font-heading text-[1.5rem] text-foreground">Payment history</h2>
      {payments === null ? (
        <div className="mt-5 h-28 animate-pulse rounded-[1.5rem] border border-border bg-card" />
      ) : payments.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <p className="font-heading text-[1.25rem] text-foreground">No payments yet.</p>
          <p className="mt-2 text-[0.9rem] text-muted-foreground">Your payment records will appear here.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {payments.map((tx) => (
            <li key={tx.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-border bg-card p-5">
              <div>
                <p className="font-heading text-[1.1rem] text-foreground">₹{paymentAmount(tx).toFixed(2)}</p>
                <p className="mt-1 text-[0.85rem] text-muted-foreground">
                  Ref: {paymentReference(tx)} · {formatDate(tx.createdAt)}
                </p>
              </div>
              <StatusPill status={paymentStatus(tx)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UpdatesTab({ bookings, application, payments, isCaregiver }) {
  const updates = [
    ...(bookings || []).slice(0, 5).map((booking) => ({
      id: `booking-${booking.id}`,
      title: booking.service_name || "Callback request",
      detail: `Booking status: ${booking.status || "pending"}`,
      date: booking.createdAt || booking.preferred_date,
    })),
    ...(isCaregiver && application
      ? [{
          id: `application-${application.id}`,
          title: "Caregiver application",
          detail: `Application status: ${application.status || "new"}`,
          date: application.createdAt || application.created_date,
        }]
      : []),
    ...(payments || []).slice(0, 3).map((tx) => ({
      id: `payment-${tx.id}`,
      title: `Payment ${paymentReference(tx)}`,
      detail: `Payment status: ${paymentStatus(tx)}`,
      date: tx.createdAt,
    })),
  ];

  return (
    <div className="mt-7">
      <h2 className="font-heading text-[1.5rem] text-foreground">Recent updates</h2>
      {updates.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <p className="font-heading text-[1.25rem] text-foreground">Nothing new yet.</p>
          <p className="mt-2 text-[0.9rem] text-muted-foreground">Booking and payment updates will appear here.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {updates.map((update) => (
            <li key={update.id} className="rounded-[1.35rem] border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{update.title}</p>
                {update.date ? <p className="text-[0.82rem] text-muted-foreground">{formatDate(update.date)}</p> : null}
              </div>
              <p className="mt-1 text-[0.88rem] text-muted-foreground">{update.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
