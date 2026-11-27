import StatusPill from "@/components/site/StatusPill";
import { CalendarDays, ClipboardList, Clock3, MapPin, UserRound } from "lucide-react";
import {
  bookingAddress,
  bookingDateValue,
  bookingServiceName,
  bookingTime,
  formatBookingDate,
  paiseToInr,
} from "./utils";

export default function AllOrdersTab({ bookings, denied }) {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-[1.5rem] text-foreground">All orders</h2>
          <p className="mt-1 text-[0.88rem] text-muted-foreground">
            The 7 most recent bookings across GoldenCares. Assignments are still automatic.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[0.8rem] font-medium text-muted-foreground">
          <ClipboardList className="h-4 w-4 text-primary" /> Latest 7
        </span>
      </div>

      {denied ? (
        <div role="alert" className="mt-5 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-[0.9rem] text-amber-900">
          Your account cannot read the shared order feed yet. Ask the team to publish the updated Firestore rules.
        </div>
      ) : null}

      {bookings === null ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-[1.5rem] border border-border bg-card" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <p className="font-heading text-[1.3rem] text-foreground">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.92rem] leading-relaxed text-muted-foreground">
            New bookings will appear here as soon as families request care.
          </p>
        </div>
      ) : (
        <ul aria-label="All orders list" className="mt-5 space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-[1.2rem] text-foreground">{bookingServiceName(booking)}</h3>
                    {(booking.displayId || booking.bookingDisplayId) && (
                      <span className="text-[0.75rem] font-medium text-muted-foreground">
                        {booking.displayId || booking.bookingDisplayId}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[0.85rem] text-muted-foreground">
                    {booking.elderName ? `${booking.elderName} · ` : ""}
                    {booking.city || "City to confirm"}
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
                {booking.duration || booking.duration_hours ? (
                  <span>{booking.duration || booking.duration_hours}</span>
                ) : null}
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> {bookingAddress(booking)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-[0.85rem] text-muted-foreground">
                  <UserRound className="mr-1.5 inline h-4 w-4 text-primary" />
                  Caregiver:{" "}
                  <span className="font-medium text-foreground">
                    {booking.servicePersonnelName || booking.caregiverName || "Unassigned"}
                  </span>
                </p>
                {booking.caregiverEarningPaise != null ? (
                  <p className="text-[0.85rem] font-semibold text-foreground">
                    Visit payout: {paiseToInr(booking.caregiverEarningPaise)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
