import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { amountInPaise, verifyPayuResponseHash } from "@/lib/payu";

const callbackFields = [
  "key",
  "txnid",
  "amount",
  "productinfo",
  "firstname",
  "email",
  "status",
  "hash",
  "udf1",
  "udf2",
  "udf3",
  "udf4",
  "udf5",
  "mihpayid",
  "error_Message",
];

export const Route = createFileRoute("/api/payu/response")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/x-www-form-urlencoded")) {
          return new Response("Unsupported callback format.", { status: 415 });
        }

        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
          return new Response("Callback is too large.", { status: 413 });
        }
        const form = new URLSearchParams(rawBody);
        const params = {};
        for (const name of callbackFields) {
          const values = form.getAll(name);
          if (values.length > 1) return new Response("Invalid callback.", { status: 400 });
          params[name] = values[0] || "";
        }

        const key = env.PAYU_MERCHANT_KEY;
        const salt = env.PAYU_MERCHANT_SALT;
        if (!key || !salt || params.key !== key || !params.udf1) {
          return new Response("Payment verification failed.", { status: 400 });
        }
        if (!(await verifyPayuResponseHash(params, salt))) {
          return new Response("Payment verification failed.", { status: 400 });
        }

        const service = context.getBase44().asServiceRole.entities;
        const attempt = await service.PaymentAttempt.get(params.udf1).catch(() => null);
        if (
          !attempt ||
          attempt.txnid !== params.txnid ||
          amountInPaise(params.amount) !== Math.round(Number(attempt.amount_inr) * 100) ||
          params.productinfo !== "GoldenCares companion visit"
        ) {
          return new Response("Payment reference does not match.", { status: 400 });
        }

        if (attempt.status !== "success") {
          await service.PaymentAttempt.update(attempt.id, {
            status: params.status === "success" ? "success" : "failed",
            payu_id: params.mihpayid.slice(0, 64),
            failure_reason: params.status === "success" ? "" : params.error_Message.slice(0, 200),
          });
        }

        const resultUrl = new URL("/payment-result", request.url);
        resultUrl.searchParams.set("ref", attempt.id);
        return Response.redirect(resultUrl, 303);
      },
    },
  },
});
