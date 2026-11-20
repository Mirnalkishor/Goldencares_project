# PayU setup

The booking form shows the configured quote (₹299 for one hour, ₹399 for two hours, and ₹599 for three hours). Payment is optional and is initiated only when the customer chooses PayU. The team still confirms the visit separately.

## Credentials

1. Copy `.env.example` to `.env` and set your Base44 app ID and app URL so authentication and booking data work.
2. Copy `.dev.vars.example` to `.dev.vars` for local development and enter PayU **test** credentials.
3. Set `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, and `PAYU_ENV=test` in the local Worker environment. Do not put PayU credentials in `VITE_*` variables, source files, or browser storage.
4. Configure the publicly reachable HTTPS return URL `https://<your-domain>/api/payu/response` in the PayU dashboard.
5. Before accepting real payments, set production credentials as encrypted Worker secrets and set `PAYU_ENV=live`. Keep test and live credentials separate.

The checkout hash is generated on the server, and the callback hash, transaction reference, and amount are verified before a payment is marked successful. The `PaymentAttempt` entity must be deployed with the other Base44 entities. Test a successful payment, a failed payment, and a tampered callback using PayU's test environment before going live.

PayU's hosted-checkout setup and test guidance: [Hosted Checkout](https://docs.payu.in/docs/prebuilt-checkout-payu-hosted.md), [Web Integration](https://docs.payu.in/docs/prebuilt-checkout-page-integration.md), and [Production Checklist](https://docs.payu.in/docs/integration-checklist-merchant-hosted-checkout.md).
