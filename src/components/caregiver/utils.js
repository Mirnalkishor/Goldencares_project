export const ACTIVE_BOOKING_STATUSES = new Set([
  "new",
  "pending_payment",
  "confirmed",
  "upcoming",
  "in_progress",
  "completion_requested",
]);

export const UPCOMING_BOOKING_STATUSES = new Set([
  "new",
  "pending_payment",
  "confirmed",
  "upcoming",
  "in_progress",
  "completion_requested",
]);

export function paiseToInr(paise) {
  const value = Number(paise || 0) / 100;
  return `₹${value.toFixed(2)}`;
}

export function istDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function todayIstKey() {
  return istDateKey(new Date());
}

export function bookingDateValue(booking) {
  return booking?.date || booking?.preferred_date || "";
}

export function bookingServiceName(booking) {
  return booking?.serviceName || booking?.service_name || "Companion visit";
}

export function bookingTime(booking) {
  return booking?.time || booking?.preferred_time || "Time to confirm";
}

export function bookingAddress(booking) {
  return booking?.userLocationAddress || booking?.address || booking?.city || "Address shared by the family";
}

export function formatBookingDate(value) {
  if (!value) return "Date to confirm";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatLedgerDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toArray(value) {
  if (Array.isArray(value)) return [...value];
  if (value == null) return [];
  return [value];
}

export function commaList(value) {
  return toArray(value).join(", ");
}

export function isPermissionError(error) {
  return (
    error?.code === "permission-denied" ||
    error?.status === 403 ||
    /permission|insufficient/i.test(error?.message || "")
  );
}

export function sortByDate(items, field = "date") {
  return [...(items || [])].sort((a, b) =>
    String(b?.[field] || "").localeCompare(String(a?.[field] || "")),
  );
}

// Web bookings use `preferred_date`; older Flutter bookings use `date`.
export function sortBookings(items) {
  return [...(items || [])].sort((a, b) => {
    const aKey = a?.date || a?.preferred_date || a?.createdAt || "";
    const bKey = b?.date || b?.preferred_date || b?.createdAt || "";
    return String(bKey).localeCompare(String(aKey));
  });
}
