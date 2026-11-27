import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatusPill from "@/components/site/StatusPill";
import PickOrderTab from "@/components/caregiver/PickOrderTab";
import AvailabilityTab from "@/components/caregiver/AvailabilityTab";
import BookingsTab from "@/components/caregiver/BookingsTab";
import EarningsTab from "@/components/caregiver/EarningsTab";
import ProfileTab from "@/components/caregiver/ProfileTab";
import {
  bookingDateValue,
  bookingServiceName,
  bookingTime,
  formatBookingDate,
  formatLedgerDate,
  isPermissionError,
  paiseToInr,
  sortBookings,
  UPCOMING_BOOKING_STATUSES,
} from "@/components/caregiver/utils";

export const Route = createFileRoute("/_authed/caregiver")({
  head: () => ({
    meta: [{ title: "Caregiver panel | GoldenCares" }],
  }),
  component: CaregiverPage,
});

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "orders", label: "Pick order", icon: ClipboardList },
  { id: "availability", label: "Availability", icon: Clock3 },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "profile", label: "Profile", icon: UserRound },
];

async function loadAssignedBookings(uid) {
  async function byField(field) {
    try {
      const page = await base44.entities.BookingRequest.filter({ [field]: uid }, { limit: 100 });
      return page.items || [];
    } catch {
      return [];
    }
  }
  const [byPersonnel, byCaregiver] = await Promise.all([
    byField("servicePersonnelId"),
    byField("caregiverId"),
  ]);
  const unique = new Map();
  for (const booking of [...byPersonnel, ...byCaregiver]) unique.set(booking.id, booking);
  // Do not query/sort on `date`: web bookings use `preferred_date` and would be
  // excluded by an orderBy on a field they do not have.
  return sortBookings([...unique.values()]);
}

async function loadLedger(entityName, field, uid) {
  try {
    const page = await base44.entities[entityName].filter(
      { [field]: uid },
      { sort: "-createdAt", limit: 100 },
    );
    return { items: page.items || [], denied: false };
  } catch (error) {
    return { items: [], denied: isPermissionError(error) };
  }
}

async function loadNotifications(uid) {
  try {
    const page = await base44.entities[`servicePersonnel/${uid}/notifications`].filter(
      {},
      { sort: "-createdAt", limit: 30 },
    );
    return page.items || [];
  } catch {
    try {
      const page = await base44.entities[`servicePersonnel/${uid}/notifications`].filter({}, { limit: 30 });
      return page.items || [];
    } catch {
      return [];
    }
  }
}

function CaregiverPage() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [personnel, setPersonnel] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [earningsDenied, setEarningsDenied] = useState(false);
  const [payoutsDenied, setPayoutsDenied] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reload, setReload] = useState(0);

  const isCaregiver = user.role === "caregiver" || profile?.role === "caregiver";

  useEffect(() => {
    if (!isCaregiver) return;
    let active = true;
    setLoadError("");
    Promise.all([
      base44.entities.User.get(user.id).catch(() => null),
      base44.entities.CaregiverApplication.get(user.id).catch(() => null),
      loadAssignedBookings(user.id),
      loadLedger("earnings", "caregiverId", user.id),
      loadLedger("payoutRequests", "caregiverId", user.id),
      loadNotifications(user.id),
    ])
      .then(([profileDoc, personnelDoc, assigned, ledger, payoutPage, noticePage]) => {
        if (!active) return;
        setProfile(profileDoc);
        setPersonnel(personnelDoc);
        setBookings(assigned);
        setEarnings(ledger.items);
        setEarningsDenied(ledger.denied);
        setPayouts(payoutPage.items);
        setPayoutsDenied(payoutPage.denied);
        setNotifications(noticePage);
      })
      .catch((error) => {
        if (active) setLoadError(error?.message || "We could not load your caregiver panel. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [user.id, user.role, isCaregiver, reload]);

  // Families generate arrival/completion codes from their panel. Refresh the
  // assigned list while Bookings is open so the right OTP field appears.
  useEffect(() => {
    if (!isCaregiver || tab !== "bookings") return undefined;
    const refresh = async () => {
      try {
        setBookings(await loadAssignedBookings(user.id));
      } catch {
        // Keep the last good list; the main loader will retry on reload.
      }
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [isCaregiver, tab, user.id]);

  const upcoming = useMemo(
    () => (bookings || []).filter((booking) => UPCOMING_BOOKING_STATUSES.has(booking.status)),
    [bookings],
  );
  const completed = useMemo(
    () => (bookings || []).filter((booking) => booking.status === "completed"),
    [bookings],
  );
  const nextVisit = useMemo(() => {
    const withDates = upcoming.filter((booking) => bookingDateValue(booking));
    const soonest = [...withDates].sort((a, b) =>
      String(bookingDateValue(a)).localeCompare(String(bookingDateValue(b))),
    );
    return soonest[0] || upcoming[0] || null;
  }, [upcoming]);

  if (!isCaregiver) {
    return (
      <section className="container-page py-16">
        <div className="mx-auto max-w-md rounded-[1.75rem] border border-border bg-card p-8 text-center">
          <h1 className="font-heading text-[1.7rem] text-foreground">This page is for caregivers.</h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
            Your account is not set up as a caregiver. If you should have access, contact support.
          </p>
          <Link
            to="/account"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.86rem] font-semibold text-primary-foreground"
          >
            Go to my account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  async function markNotificationRead(notification) {
    setActionError("");
    try {
      await base44.functions.invoke("markNotificationsRead", {
        notificationIds: [notification.id],
        collection: "servicePersonnel",
      });
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(error?.message || "We could not mark that notification as read.");
    }
  }

  async function markAllRead() {
    const ids = (notifications || [])
      .filter((notification) => !notification.isRead)
      .slice(0, 100)
      .map((notification) => notification.id);
    if (!ids.length) return;
    setActionError("");
    try {
      await base44.functions.invoke("markNotificationsRead", {
        notificationIds: ids,
        collection: "servicePersonnel",
      });
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(error?.message || "We could not mark notifications as read.");
    }
  }

  function reloadData() {
    setReload((value) => value + 1);
  }

  const firstName = (personnel?.name || profile?.name || user.full_name || "there").split(" ")[0];
  const approved = Boolean(personnel?.isApproved ?? profile?.isApproved);
  const availablePaise = Number(personnel?.availablePaise || 0);
  const unreadNotifications = (notifications || []).filter((item) => !item.isRead).length;

  return (
    <section className="container-page py-12 lg:py-16">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary/70">Caregiver panel</p>
          <h1 className="mt-3 font-heading text-[2.2rem] leading-tight text-foreground sm:text-[2.8rem]">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-[0.98rem] text-muted-foreground">
            Your assignments, availability, earnings, and profile in one place.
          </p>
        </div>
      </div>

      {!approved ? (
        <div className="mt-6 flex flex-col gap-3 rounded-[1.25rem] border border-amber-300/50 bg-amber-50 p-4 text-[0.9rem] text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Waiting for approval</p>
            <p className="mt-0.5 text-amber-800">
              You can review this panel now. New assignments begin after the team approves your profile.
            </p>
          </div>
          <button type="button" onClick={() => setTab("profile")} className="shrink-0 font-semibold underline">
            Check verification
          </button>
        </div>
      ) : null}

      {personnel?.deletionStatus === "scheduled" ? (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.9rem] text-destructive">
          Your account deletion is scheduled. Availability changes are locked until it is cancelled.
        </div>
      ) : null}

      {loadError ? (
        <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.9rem] text-destructive">
          <p>{loadError}</p>
          <button type="button" onClick={reloadData} className="mt-2 font-semibold underline">
            Try again
          </button>
        </div>
      ) : null}
      {actionError ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.9rem] text-destructive">
          {actionError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
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
            {id === "dashboard" && unreadNotifications ? (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.68rem] text-accent-foreground">
                {unreadNotifications}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "dashboard" ? (
        <DashboardTab
          personnel={personnel}
          bookings={bookings}
          upcoming={upcoming}
          nextVisit={nextVisit}
          completedCount={completed.length}
          availablePaise={availablePaise}
          notifications={notifications}
          onOpenBookings={() => setTab("bookings")}
          onOpenAvailability={() => setTab("availability")}
          onOpenEarnings={() => setTab("earnings")}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllRead}
        />
      ) : null}
      {tab === "bookings" ? (
        <BookingsTab bookings={bookings} personnel={personnel} onChanged={reloadData} />
      ) : null}
      {tab === "orders" ? (
        <PickOrderTab
          onChanged={reloadData}
          onOpenBookings={() => setTab("bookings")}
        />
      ) : null}
      {tab === "availability" ? (
        <AvailabilityTab
          key={`availability-${reload}`}
          uid={user.id}
          personnel={personnel}
          profile={profile}
          bookings={bookings || []}
          onSaved={reloadData}
        />
      ) : null}
      {tab === "earnings" ? (
        <EarningsTab
          personnel={personnel}
          earnings={earnings}
          payouts={payouts}
          earningsDenied={earningsDenied}
          payoutsDenied={payoutsDenied}
          onSaved={reloadData}
        />
      ) : null}
      {tab === "profile" ? (
        <ProfileTab
          key={`profile-${reload}`}
          uid={user.id}
          personnel={personnel}
          profile={profile}
          onSaved={reloadData}
        />
      ) : null}
    </section>
  );
}

function DashboardTab({
  personnel,
  bookings,
  upcoming,
  nextVisit,
  completedCount,
  availablePaise,
  notifications,
  onOpenBookings,
  onOpenAvailability,
  onOpenEarnings,
  onMarkRead,
  onMarkAllRead,
}) {
  const unread = (notifications || []).filter((item) => !item.isRead).length;

  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      <div className="rounded-[1.5rem] border border-border bg-card p-6 lg:col-span-2">
        <p className="eyebrow text-primary/70">At a glance</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <SummaryCard icon={CalendarDays} label="Upcoming visits" value={upcoming.length ?? 0} />
          <SummaryCard icon={Check} label="Visits completed" value={completedCount} />
          <SummaryCard icon={Wallet} label="Available balance" value={paiseToInr(availablePaise)} />
          <SummaryCard
            icon={Star}
            label="Rating"
            value={personnel?.rating ? `${Number(personnel.rating).toFixed(1)} / 5` : "—"}
          />
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[1.35rem] text-foreground">Next visit</h2>
          <button type="button" onClick={onOpenBookings} className="text-[0.84rem] font-semibold text-primary">
            All visits <ArrowRight className="inline h-3.5 w-3.5" />
          </button>
        </div>
        {bookings === null ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary/50" />
        ) : nextVisit ? (
          <div className="mt-4 rounded-2xl bg-secondary/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-[1.1rem] text-foreground">{bookingServiceName(nextVisit)}</h3>
              <StatusPill status={nextVisit.status} />
            </div>
            <p className="mt-2 text-[0.86rem] text-muted-foreground">
              {formatBookingDate(bookingDateValue(nextVisit))} · {bookingTime(nextVisit)}
            </p>
            {nextVisit.userLocationAddress ? (
              <p className="mt-2 flex items-start gap-2 text-[0.84rem] text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {nextVisit.userLocationAddress}
              </p>
            ) : null}
            <button type="button" onClick={onOpenBookings} className="mt-4 rounded-full bg-primary px-4 py-2 text-[0.82rem] font-semibold text-primary-foreground">
              Open visit details
            </button>
          </div>
        ) : (
          <p className="mt-4 text-[0.88rem] leading-relaxed text-muted-foreground">
            No upcoming visits yet. Keep your availability on so you can be matched with families nearby.
          </p>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-[1.35rem] text-foreground">Updates</h2>
          </div>
          {unread ? (
            <button type="button" onClick={onMarkAllRead} className="text-[0.82rem] font-semibold text-primary">
              Mark all read
            </button>
          ) : null}
        </div>
        {notifications === null ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary/50" />
        ) : notifications.length === 0 ? (
          <p className="mt-4 text-[0.88rem] text-muted-foreground">You are all caught up.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <li key={notification.id} className={`rounded-xl p-3 text-[0.85rem] ${notification.isRead ? "bg-secondary/40 text-muted-foreground" : "bg-primary/5 text-foreground"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{notification.title || "New update"}</p>
                    <p className="mt-0.5 leading-relaxed">{notification.body || notification.message || ""}</p>
                    <p className="mt-1 text-[0.75rem] text-muted-foreground">{formatLedgerDate(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead ? (
                    <button
                      type="button"
                      onClick={() => onMarkRead(notification)}
                      className="shrink-0 text-[0.78rem] font-semibold text-primary"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-border bg-secondary/40 p-6 lg:col-span-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-[1.35rem] text-foreground">Quick actions</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onOpenAvailability} className="rounded-full bg-card px-5 py-2.5 text-[0.85rem] font-semibold text-foreground">
            Manage availability
          </button>
          <button type="button" onClick={onOpenEarnings} className="rounded-full bg-card px-5 py-2.5 text-[0.85rem] font-semibold text-foreground">
            View earnings
          </button>
          <a href="mailto:support@goldencares.in" className="rounded-full bg-card px-5 py-2.5 text-[0.85rem] font-semibold text-foreground">
            Contact support
          </a>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-[0.76rem] uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-[1.35rem] font-semibold text-foreground">{value}</p>
    </div>
  );
}
