import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import {
  amountInPaise,
  createPayuRequestHash,
  getVisitPriceInr,
  hashPaymentToken,
} from "@/lib/payu";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s()-]{8,20}$/;

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/payu/checkout")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const origin = request.headers.get("origin");
        if (!origin || origin !== new URL(request.url).origin) {
          return errorResponse("Invalid request origin.", 403);
        }

        if (!request.headers.get("content-type")?.includes("application/json")) {
          return errorResponse("Expected a JSON request.", 415);
        }

        const body = await request.json().catch(() => null);
        if (
          !body ||
          typeof body.bookingId !== "string" ||
          body.bookingId.length > 128 ||
          typeof body.token !== "string" ||
          !/^[\da-f]{64}$/i.test(body.token)
        ) {
          return errorResponse("Invalid payment request.", 400);
        }

        const key = env.PAYU_MERCHANT_KEY;
        const salt = env.PAYU_MERCHANT_SALT;
        const mode = env.PAYU_ENV;
        if (!key || !salt || !["test", "live"].includes(mode)) {
          return errorResponse("Online payments are not configured yet.", 503);
        }

        const base44 = context.getBase44();
        const service = base44.asServiceRole.entities;
        const booking = await service.BookingRequest.get(body.bookingId).catch(() => null);
        if (!booking || booking.request_type !== "visit" || !booking.payment_token_hash) {
          return errorResponse("Booking not found or not eligible for payment.", 404);
        }

        const suppliedTokenHash = await hashPaymentToken(body.token);
        if (suppliedTokenHash !== booking.payment_token_hash) {
          return errorResponse("Booking not found or not eligible for payment.", 404);
        }

        const amountInr = getVisitPriceInr(booking.duration_hours);
        if (
          amountInr === null ||
          !booking.email ||
          !EMAIL_PATTERN.test(booking.email) ||
          !booking.phone ||
          !PHONE_PATTERN.test(booking.phone)
        ) {
          return errorResponse("The booking details are incomplete for online payment.", 400);
        }

        const previousAttempts = await service.PaymentAttempt.filter(
          { booking_id: booking.id },
          { sort: "-created_date", limit: 20 },
        );
        if (previousAttempts.items?.some((attempt) => attempt.status === "success")) {
          return errorResponse("This booking has already been paid.", 409);
        }

        const pending = previousAttempts.items?.find(
          (attempt) =>
            attempt.status === "pending" &&
            Date.now() - new Date(attempt.created_date).getTime() < 20 * 60 * 1000,
        );
        let attempt = pending;
        if (!attempt) {
          for (const expired of previousAttempts.items ?? []) {
            if (expired.status === "pending") {
              await service.PaymentAttempt.update(expired.id, { status: "expired" });
            }
          }
          const txnid = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
          attempt = await service.PaymentAttempt.create({
            booking_id: booking.id,
            txnid,
            amount_inr: amountInr,
            status: "pending",
          });
        }

        const requestUrl = new URL(request.url);
        const callbackUrl = new URL("/api/payu/response", requestUrl).toString();
        const params = {
          key,
          txnid: attempt.txnid,
          amount: `${amountInr.toFixed(2)}`,
          productinfo: "GoldenCares companion visit",
          firstname: booking.full_name.trim().replaceAll("|", " ").slice(0, 60),
          email: booking.email.trim(),
          phone: booking.phone.trim(),
          surl: callbackUrl,
          furl: callbackUrl,
          udf1: attempt.id,
        };
        params.hash = await createPayuRequestHash(params, salt);

        return Response.json({
          action: mode === "live" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment",
          amountInr,
          fields: params,
        });
      },
    },
  },
});
