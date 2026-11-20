import { createFileRoute } from "@tanstack/react-router";
import { getEntityOrNull } from "@/lib/entity-errors";

export const Route = createFileRoute("/api/payu/status")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const reference = new URL(request.url).searchParams.get("ref");
        if (!reference || reference.length > 128) {
          return Response.json({ error: "Invalid payment reference." }, { status: 400 });
        }

        const attempt = await getEntityOrNull(
          context.getBase44().asServiceRole.entities.PaymentAttempt,
          reference,
        );
        if (!attempt) return Response.json({ error: "Payment not found." }, { status: 404 });

        return Response.json(
          {
            status: attempt.status,
            amountInr: Number(attempt.amount_inr),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
