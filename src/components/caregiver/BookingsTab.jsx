import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusPill from "@/components/site/StatusPill";
import { base44 } from "@/api/base44Client";
import {
  CalendarDays,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  PhoneCall,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  bookingDateValue,
  bookingTime,
  formatBookingDate,
  paiseToInr,
  UPCOMING_BOOKING_STATUSES,
} from "./utils";

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

function inFilter(booking, filter) {
  if (filter === "all") return true;
  const status = booking.status || "";
  if (filter === "upcoming") {
    return UPCOMING_BOOKING_STATUSES.has(status);
  }
  return status === filter;
}

export default function BookingsTab({ bookings, onChanged }) {
  const [filter, setFilter] = useState("upcoming");
  const [selected, setSelected] = useState(null);

  const visible = (bookings || []).filter((booking) => inFilter(booking, filter));

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-[1.5rem] text-foreground">Assigned visits</h2>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {bookings === null ? (
        <div className="mt-5 space-y-3">
          {[0, 1].map((key) => (
            <div key={key} className="h-32 animate-pulse rounded-[1.5rem] border border-border bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <p className="font-heading text-[1.3rem] text-foreground">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.92rem] leading-relaxed text-muted-foreground">
            Visits are assigned automatically when a family books care in your area. New assignments will
            appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((booking) => (
            <li key={booking.id} className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-[1.25rem] text-foreground">
                      {booking.serviceName || "Companion visit"}
                    </h3>
                    {booking.displayId ? (
                      <span className="text-[0.75rem] font-medium text-muted-foreground">{booking.displayId}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[0.85rem] text-muted-foreground">
                    {booking.userName || booking.full_name || "Family member"}
                    {booking.elderName ? ` · for ${booking.elderName}` : ""}
                  </p>
                </div>
                <StatusPill status={booking.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-[0.85rem] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> {formatBookingDate(bookingDateValue(booking))}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" /> {bookingTime(booking)}
                </span>
                {booking.duration ? <span>{booking.duration}</span> : null}
                {booking.userLocationAddress ? (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {booking.userLocationAddress}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.85rem] font-medium text-foreground">
                  Visit payout: {booking.caregiverEarningPaise != null ? paiseToInr(booking.caregiverEarningPaise) : "—"}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(booking)}
                  className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-semibold text-primary-foreground"
                >
                  View details
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BookingDetailDialog
        booking={selected}
        onClose={() => setSelected(null)}
        onChanged={onChanged}
      />
    </div>
  );
}

function BookingDetailDialog({ booking, onClose, onChanged }) {
  const [contact, setContact] = useState(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!booking) return;
    setContact(null);
    setOtp("");
    setMessage("");
    base44.functions
      .invoke("getCareRecipientContact", { bookingId: booking.id })
      .then((result) => setContact(result || null))
      .catch(() => setContact({ unavailable: true }));
  }, [booking?.id]);

  if (!booking) return null;

  const canStart = ["confirmed", "upcoming"].includes(booking.status);
  const canComplete = ["in_progress", "completion_requested"].includes(booking.status);

  async function verify(kind) {
    setBusy(true);
    setMessage("");
    try {
      const callable = kind === "start" ? "verifyStartOtp" : "verifyCompletionOtp";
      await base44.functions.invoke(callable, { bookingId: booking.id, otp: otp.trim() });
      setOtp("");
      onChanged?.();
      onClose();
    } catch (error) {
      setMessage(error?.message || `We could not verify that ${kind} OTP.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle className="font-heading text-[1.4rem]">
              {booking.serviceName || "Companion visit"}
            </DialogTitle>
            <StatusPill status={booking.status} />
          </div>
          <DialogDescription>
            {formatBookingDate(bookingDateValue(booking))} · {bookingTime(booking)} · {booking.duration || "Duration to confirm"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-border p-4">
            <h3 className="font-heading text-[1.05rem] text-foreground">Care recipient</h3>
            <dl className="mt-3 space-y-2 text-[0.88rem]">
              <DetailRow label="Name" value={booking.elderName || booking.userName || "—"} />
              <DetailRow label="Age" value={booking.elderAge ? `${booking.elderAge} years` : "—"} />
              <DetailRow label="Relation" value={booking.relationToRecipient || "—"} />
              <DetailRow label="Language" value={booking.language_preference || "—"} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border p-4">
            <h3 className="font-heading text-[1.05rem] text-foreground">Visit location</h3>
            <p className="mt-3 text-[0.88rem] leading-relaxed text-muted-foreground">
              {booking.userLocationAddress || booking.address || "Address shared by the family"}
            </p>
            {booking.specialNeeds || booking.medicalConditions ? (
              <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-[0.82rem] text-foreground">
                {[booking.specialNeeds, booking.medicalConditions].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </section>
        </div>

        <section className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-[1.05rem] text-foreground">Customer contact</h3>
          </div>
          {contact === null ? (
            <p className="mt-3 flex items-center gap-2 text-[0.88rem] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading contact details…
            </p>
          ) : contact?.unavailable ? (
            <p className="mt-3 text-[0.88rem] text-muted-foreground">
              Contact details are unavailable. Call the support desk if you need help with this visit.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.88rem] text-muted-foreground">
              {contact?.name || contact?.phone ? (
                <span className="inline-flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-primary" />
                  <a href={`tel:${contact.phone || ""}`} className="hover:text-primary">
                    {contact.name || "Customer"} · {contact.phone || "—"}
                  </a>
                </span>
              ) : null}
              {contact?.email ? (
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                </span>
              ) : null}
            </div>
          )}
          {contact?.emergencyContacts?.length ? (
            <div className="mt-3 space-y-2">
              {contact.emergencyContacts.map((item, index) => (
                <p key={`${item.name || "contact"}-${index}`} className="text-[0.82rem] text-muted-foreground">
                  Emergency: {item.name || "Contact"} · {item.phone || item.number || "—"}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-[1.05rem] text-foreground">Payment split</h3>
          </div>
          <div className="mt-3 grid gap-2 text-[0.85rem] sm:grid-cols-3">
            <DetailRow label="Visit price" value={booking.price != null ? paiseToInr(Number(booking.price) * 100) : "—"} />
            <DetailRow label="Your payout" value={booking.caregiverEarningPaise != null ? paiseToInr(booking.caregiverEarningPaise) : "—"} />
            <DetailRow label="Transaction" value={booking.transactionId || "—"} />
          </div>
        </section>

        {canStart || canComplete ? (
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <h3 className="font-heading text-[1.05rem] text-foreground">
              {canStart ? "Start the visit" : "Complete the visit"}
            </h3>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-muted-foreground">
              Ask the family for the {canStart ? "start" : "completion"} code they received in the app, then enter it
              below.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                aria-label={canStart ? "Start OTP" : "Completion OTP"}
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="6-digit code"
                className="field max-w-[12rem]"
              />
              <button
                type="button"
                disabled={busy || !otp.trim()}
                onClick={() => verify(canStart ? "start" : "complete")}
                className="rounded-full bg-primary px-5 py-2.5 text-[0.85rem] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                {canStart ? "Verify start code" : "Verify completion code"}
              </button>
            </div>
            {message ? <p role="alert" className="mt-3 text-[0.85rem] text-destructive">{message}</p> : null}
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
