import { useEffect, useMemo, useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { CalendarOff, CircleCheck, Clock3, Loader2 } from "lucide-react";
import { getDb } from "@/api/firebaseClient";
import {
  ACTIVE_BOOKING_STATUSES,
  istDateKey,
  todayIstKey,
  toArray,
} from "./utils";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function pick(personnel, profile, key, fallback) {
  const value = personnel?.[key] ?? profile?.[key];
  return value === undefined || value === null ? fallback : value;
}

export default function AvailabilityTab({ uid, personnel, profile, bookings, onSaved }) {
  const todayKey = todayIstKey();
  const [dates, setDates] = useState(() =>
    toArray(pick(personnel, profile, "unavailableDates", [])).sort(),
  );
  const [weekdays, setWeekdays] = useState(() =>
    toArray(pick(personnel, profile, "unavailableWeekdays", [])).sort(),
  );
  const [isOnline, setIsOnline] = useState(() =>
    Boolean(pick(personnel, profile, "isOnline", false)),
  );
  const [availableToday, setAvailableToday] = useState(() => {
    const stored = Boolean(pick(personnel, profile, "isAvailable", true));
    const override = pick(personnel, profile, "isAvailableOverrideDate", null);
    const unavailable = toArray(pick(personnel, profile, "unavailableDates", []));
    return !unavailable.includes(todayKey) && (stored || override !== todayKey);
  });
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unavailable = toArray(pick(personnel, profile, "unavailableDates", []));
    const blockedDays = toArray(pick(personnel, profile, "unavailableWeekdays", []));
    const stored = Boolean(pick(personnel, profile, "isAvailable", true));
    const override = pick(personnel, profile, "isAvailableOverrideDate", null);
    setDates([...unavailable].sort());
    setWeekdays([...blockedDays].sort());
    setIsOnline(Boolean(pick(personnel, profile, "isOnline", false)));
    setAvailableToday(!unavailable.includes(todayKey) && (stored || override !== todayKey));
  }, [personnel, profile, todayKey]);

  const bookedDates = useMemo(() => {
    const result = new Set();
    for (const booking of bookings || []) {
      if (!ACTIVE_BOOKING_STATUSES.has(booking.status)) continue;
      const key = istDateKey(booking.date);
      if (!key || key < todayKey) continue;
      result.add(key);
    }
    return result;
  }, [bookings, todayKey]);

  const blockedWeekdays = useMemo(() => {
    const result = new Set();
    for (const key of bookedDates) {
      const weekday = new Date(`${key}T00:00:00Z`).getUTCDay();
      result.add(weekday);
    }
    return result;
  }, [bookedDates]);

  const deletionScheduled = pick(personnel, profile, "deletionStatus", "") === "scheduled";

  async function save(fields, rollback) {
    if (deletionScheduled) {
      setError(
        "Your account deletion is scheduled. Cancel it from your profile before changing availability.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const db = getDb();
      const batch = writeBatch(db);
      const payload = { ...fields, updatedAt: new Date().toISOString() };
      batch.set(doc(db, "servicePersonnel", uid), payload, { merge: true });
      batch.set(doc(db, "users", uid), payload, { merge: true });
      await batch.commit();
      onSaved?.();
    } catch (saveError) {
      rollback?.();
      setError(saveError?.message || "We could not save your availability. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleToday() {
    if (bookedDates.has(todayKey)) {
      setError("You already have a visit today, so availability cannot be turned off for today.");
      return;
    }
    const nextAvailable = !availableToday;
    const nextDates = nextAvailable
      ? dates.filter((date) => date !== todayKey)
      : [...new Set([...dates, todayKey])].sort();
    setAvailableToday(nextAvailable);
    setDates(nextDates);
    save(
      {
        isAvailable: nextAvailable,
        isAvailableOverrideDate: nextAvailable ? null : todayKey,
        unavailableDates: nextDates,
      },
      () => {
        setAvailableToday(!nextAvailable);
        setDates(dates);
      },
    );
  }

  function addDate() {
    if (!newDate) return;
    if (newDate < todayKey) {
      setError("Past dates cannot be marked unavailable.");
      return;
    }
    if (bookedDates.has(newDate)) {
      setError("You already have a visit on that date, so it cannot be marked unavailable.");
      return;
    }
    const nextDates = [...new Set([...dates, newDate])].sort();
    const affectsToday = newDate === todayKey;
    setDates(nextDates);
    if (affectsToday) setAvailableToday(false);
    save(
      {
        unavailableDates: nextDates,
        ...(affectsToday
          ? { isAvailable: false, isAvailableOverrideDate: todayKey }
          : {}),
      },
      () => {
        setDates(dates);
        if (affectsToday) setAvailableToday(availableToday);
      },
    );
    setNewDate("");
  }

  function removeDate(date) {
    const nextDates = dates.filter((item) => item !== date);
    const affectsToday = date === todayKey;
    setDates(nextDates);
    if (affectsToday) setAvailableToday(true);
    save(
      {
        unavailableDates: nextDates,
        ...(affectsToday
          ? { isAvailable: true, isAvailableOverrideDate: null }
          : {}),
      },
      () => {
        setDates(dates);
        if (affectsToday) setAvailableToday(availableToday);
      },
    );
  }

  function toggleWeekday(weekday) {
    if (!weekdays.includes(weekday) && blockedWeekdays.has(weekday)) {
      setError("You have an upcoming visit on this weekday, so it cannot be blocked.");
      return;
    }
    const nextWeekdays = weekdays.includes(weekday)
      ? weekdays.filter((item) => item !== weekday)
      : [...weekdays, weekday].sort();
    setWeekdays(nextWeekdays);
    save({ unavailableWeekdays: nextWeekdays }, () => setWeekdays(weekdays));
  }

  function toggleOnline() {
    const next = !isOnline;
    setIsOnline(next);
    save({ isOnline: next }, () => setIsOnline(isOnline));
  }

  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      <div className="rounded-[1.5rem] border border-border bg-card p-6">
        <p className="eyebrow text-primary/70">Duty status</p>
        <h2 className="mt-2 font-heading text-[1.35rem] text-foreground">
          {availableToday ? "Available for visits today" : "Not available today"}
        </h2>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-muted-foreground">
          Turning availability off today also adds today to your unavailable dates. Booked days stay locked.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || bookedDates.has(todayKey)}
            onClick={toggleToday}
            className={`rounded-full px-5 py-2.5 text-[0.86rem] font-semibold disabled:opacity-50 ${
              availableToday
                ? "border border-border text-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {saving ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
            {availableToday ? "Go offline today" : "Go online today"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={toggleOnline}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[0.86rem] font-semibold text-foreground disabled:opacity-50"
          >
            <CircleCheck className={`h-4 w-4 ${isOnline ? "text-emerald-600" : "text-muted-foreground"}`} />
            {isOnline ? "Online for assignments" : "Offline for assignments"}
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <CalendarOff className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-[1.35rem] text-foreground">Unavailable dates</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="date"
            aria-label="Add unavailable date"
            min={todayKey}
            value={newDate}
            onChange={(event) => setNewDate(event.target.value)}
            className="field max-w-[13rem]"
          />
          <button
            type="button"
            disabled={saving || !newDate}
            onClick={addDate}
            className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-semibold text-primary-foreground disabled:opacity-50"
          >
            Add date
          </button>
        </div>
        {dates.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {dates.map((date) => (
              <li key={date} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[0.82rem]">
                <span>{date}</span>
                <button
                  type="button"
                  aria-label={`Remove ${date}`}
                  disabled={saving}
                  onClick={() => removeDate(date)}
                  className="font-semibold text-primary disabled:opacity-50"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[0.88rem] text-muted-foreground">No unavailable dates saved.</p>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-border bg-card p-6 lg:col-span-2">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-[1.35rem] text-foreground">Weekly days off</h2>
        </div>
        <p className="mt-2 text-[0.88rem] text-muted-foreground">
          These weekdays are blocked for new assignments. Days with an upcoming visit cannot be blocked.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {WEEKDAYS.map(({ value, label }) => {
            const active = weekdays.includes(value);
            const blocked = blockedWeekdays.has(value);
            return (
              <button
                key={label}
                type="button"
                disabled={saving || blocked}
                aria-pressed={active}
                onClick={() => toggleWeekday(value)}
                className={`rounded-full border px-4 py-2 text-[0.85rem] font-semibold disabled:opacity-45 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/75"
                }`}
              >
                {label}
                {blocked ? " · booked" : ""}
              </button>
            );
          })}
        </div>
        {bookedDates.size ? (
          <p className="mt-4 text-[0.82rem] text-muted-foreground">
            Upcoming booked dates: {[...bookedDates].sort().join(", ")}
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.9rem] text-destructive lg:col-span-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}
