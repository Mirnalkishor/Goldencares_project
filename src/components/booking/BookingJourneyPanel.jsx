import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Loader2,
  ShieldCheck,
  Star,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  bookingDateValue,
  formatBookingDate,
  istDateKey,
  todayIstKey,
} from "@/components/caregiver/utils";

const SERVICE_CODE = "728988";
const START_STATUSES = new Set(["new", "confirmed", "upcoming", "scheduled"]);
const COMPLETE_STATUSES = new Set(["in_progress", "completion_requested"]);

function caregiverName(booking) {
  return booking?.servicePersonnelName || booking?.caregiverName || "Your caregiver";
}

function codeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function otpReady(hash, expiresAt) {
  if (!hash || !expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > Date.now();
}

function Stars({ value }) {
  return (
    <span aria-label={`${value} out of 5 stars`} className="inline-flex gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= value ? "fill-current" : "opacity-35"}`} />
      ))}
    </span>
  );
}

function friendlyError(error, fallback) {
  const raw = String(error?.message || error || fallback);
  return raw.replace(/\s*\[\d{3}\]\s*$/, "");
}

function CodeRow({ code, testId, expiresAt, caregiver, copy }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-card px-4 py-3">
      <span
        data-testid={testId}
        className="font-mono text-[1.6rem] font-semibold tracking-[0.35em] text-foreground"
      >
        {code}
      </span>
      <button
        type="button"
        onClick={() => copy(code)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.78rem] font-semibold text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-3.5 w-3.5" /> Copy
      </button>
      {expiresAt ? (
        <span className="text-[0.75rem] text-muted-foreground">Valid until {codeTime(expiresAt)}</span>
      ) : null}
      <span className="w-full text-[0.76rem] text-muted-foreground">
        Share this code with {caregiver}.
      </span>
    </div>
  );
}

function UnavailableCode({ testId, title, message }) {
  return (
    <div
      data-testid={testId}
      className="mt-3 rounded-xl border border-dashed border-border bg-card p-3.5"
    >
      <p className="text-[0.84rem] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[0.8rem] leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}

export default function BookingJourneyPanel({ booking, onChanged }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewDone, setReviewDone] = useState(Boolean(booking?.reviewSubmitted));
  const [rating, setRating] = useState(Number(booking?.reviewRating) || 0);
  const [comment, setComment] = useState(booking?.reviewComment || "");
  const primed = useRef(new Set());

  const status = booking?.status || "";
  const assigned = Boolean(booking?.servicePersonnelId || booking?.caregiverId);
  const showStart = assigned && START_STATUSES.has(status);
  const showCompletion = assigned && COMPLETE_STATUSES.has(status);
  const showReview = status === "completed" && assigned;
  const bookingDate = bookingDateValue(booking);
  const visitDateLabel = formatBookingDate(bookingDate);
  const startsToday = Boolean(bookingDate) && istDateKey(bookingDate) === todayIstKey();

  useEffect(() => {
    setReviewDone(Boolean(booking?.reviewSubmitted));
    if (booking?.reviewRating != null) setRating(Number(booking.reviewRating));
    if (booking?.reviewComment) setComment(booking.reviewComment);
  }, [booking?.reviewSubmitted, booking?.reviewRating, booking?.reviewComment]);

  // The code itself is fixed, but the server still needs an active hashed OTP
  // to verify. Prime it silently for bookings assigned before this flow existed.
  useEffect(() => {
    if (
      !showStart ||
      !startsToday ||
      otpReady(booking?.startOtpHash, booking?.startOtpExpiresAt)
    ) {
      return;
    }
    const key = `start:${booking.id}:${status}`;
    if (primed.current.has(key)) return;
    primed.current.add(key);
    base44.functions.invoke("generateStartOtp", { bookingId: booking.id }).catch(() => {});
  }, [
    booking?.id,
    booking?.startOtpExpiresAt,
    booking?.startOtpHash,
    showStart,
    startsToday,
    status,
  ]);

  // verifyStartOtp primes the completion OTP. This is only a fallback for
  // visits that were already in progress before that server change.
  useEffect(() => {
    if (
      !showCompletion ||
      !startsToday ||
      otpReady(booking?.completionOtpHash, booking?.completionOtpExpiresAt)
    ) {
      return;
    }
    const key = `completion:${booking.id}:${status}`;
    if (primed.current.has(key)) return;
    primed.current.add(key);
    base44.functions.invoke("generateCompletionOtp", { bookingId: booking.id }).catch(() => {});
  }, [
    booking?.id,
    booking?.completionOtpExpiresAt,
    booking?.completionOtpHash,
    showCompletion,
    startsToday,
    status,
  ]);

  if (!showStart && !showCompletion && !showReview) return null;

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Code copied to your clipboard.");
    } catch {
      setNotice("Select the code above and copy it manually.");
    }
  }

  async function submitReview() {
    setError("");
    setNotice("");
    if (!rating) {
      setError("Choose a star rating first.");
      return;
    }
    if (!comment.trim()) {
      setError("Add a short comment about the visit.");
      return;
    }
    setBusy("review");
    try {
      await base44.functions.invoke("submitBookingReview", {
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      });
      setReviewDone(true);
      setNotice("Thanks — your rating and comment are now on your caregiver's profile.");
      onChanged?.();
    } catch (reviewError) {
      setError(friendlyError(reviewError, "We could not save your review. Please try again."));
    } finally {
      setBusy("");
    }
  }

  return (
    <section
      data-testid="booking-journey"
      className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
    >
      {showStart ? (
        <div className="border-b border-primary/15 pb-4">
          <p className="inline-flex items-center gap-2 font-semibold text-foreground">
            <ClipboardCheck className="h-4 w-4 text-primary" /> Arrival code
          </p>
          <p className="mt-1 text-[0.84rem] leading-relaxed text-muted-foreground">
            Share this code when {caregiverName(booking)} arrives. They enter it in their panel to
            start the visit.
          </p>

          {startsToday ? (
            <CodeRow
              code={SERVICE_CODE}
              testId="arrival-code"
              expiresAt={booking.startOtpExpiresAt}
              caregiver={caregiverName(booking)}
              copy={copy}
            />
          ) : (
            <UnavailableCode
              testId="arrival-code-unavailable"
              title="Arrival code unlocks on your visit day"
              message={`We’ll show it here on ${visitDateLabel}. Share it with ${caregiverName(booking)} when they arrive.`}
            />
          )}
        </div>
      ) : null}

      {showCompletion ? (
        <div className={showStart ? "pt-4" : ""}>
          <p className="inline-flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Completion code
          </p>
          <p className="mt-1 text-[0.84rem] leading-relaxed text-muted-foreground">
            Share this only when the visit is finished. {caregiverName(booking)} enters it to mark
            the job complete.
          </p>

          {startsToday ? (
            <CodeRow
              code={SERVICE_CODE}
              testId="completion-code"
              expiresAt={booking.completionOtpExpiresAt}
              caregiver={caregiverName(booking)}
              copy={copy}
            />
          ) : (
            <UnavailableCode
              testId="completion-code-unavailable"
              title="Completion code unlocks on your visit day"
              message={`We’ll show it here on ${visitDateLabel}. Share it with ${caregiverName(booking)} only when the visit has finished.`}
            />
          )}
        </div>
      ) : null}

      {showReview ? (
        <div className={showStart || showCompletion ? "mt-4 border-t border-primary/15 pt-4" : ""}>
          {reviewDone || booking.reviewSubmitted ? (
            <div className="rounded-xl bg-card p-4">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Thanks for your review
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Stars value={Number(booking.reviewRating || rating)} />
                <span className="text-[0.82rem] text-muted-foreground">
                  {Number(booking.reviewRating || rating)} / 5
                </span>
              </div>
              {booking.reviewComment ? (
                <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">
                  “{booking.reviewComment}”
                </p>
              ) : null}
            </div>
          ) : (
            <div>
              <p data-testid="review-form" className="font-heading text-[1.15rem] text-foreground">
                Rate your visit
              </p>
              <p className="mt-1 text-[0.84rem] text-muted-foreground">
                Your rating and comment go straight to {caregiverName(booking)}’s profile.
              </p>
              <div role="group" aria-label="Star rating" className="mt-3 flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className="rounded-lg p-1 text-amber-500 hover:bg-amber-50"
                  >
                    <Star
                      className={`h-7 w-7 ${value <= rating ? "fill-current" : "opacity-35"}`}
                    />
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-[0.82rem] font-medium text-foreground" htmlFor={`review-${booking.id}`}>
                Comment
              </label>
              <textarea
                id={`review-${booking.id}`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                maxLength={300}
                placeholder="How was the visit?"
                className="field mt-1.5 w-full"
              />
              <p className="mt-1 text-[0.75rem] text-muted-foreground">Up to 25 words.</p>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={submitReview}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.84rem] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit review
              </button>
            </div>
          )}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-[0.82rem] text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-[0.82rem] text-emerald-700">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
