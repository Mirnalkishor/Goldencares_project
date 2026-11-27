import { useEffect, useState } from "react";
import { Banknote, CreditCard, Loader2, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatLedgerDate, paiseToInr } from "./utils";

export default function EarningsTab({
  personnel,
  earnings,
  payouts,
  earningsDenied,
  payoutsDenied,
  onSaved,
}) {
  const payoutDetails = personnel?.payoutDetails || {};
  const availablePaise = Number(personnel?.availablePaise || 0);
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setError("");
  }, [method]);

  async function savePayout() {
    setError("");
    setNotice("");
    if (method === "upi" && !upiId.trim()) {
      setError("Enter your UPI ID.");
      return;
    }
    if (
      method === "bank" &&
      (!accountNumber.trim() || accountNumber.trim() !== confirmAccount.trim() || !ifsc.trim() || !holderName.trim())
    ) {
      setError("Enter matching account numbers, IFSC, and account holder name.");
      return;
    }
    setBusy(true);
    try {
      const payload =
        method === "upi"
          ? { upiId: upiId.trim() }
          : {
              accountNumber: accountNumber.trim(),
              ifsc: ifsc.trim().toUpperCase(),
              holderName: holderName.trim(),
            };
      await base44.functions.invoke("savePayoutDetails", payload);
      setUpiId("");
      setAccountNumber("");
      setConfirmAccount("");
      setNotice("Payout details saved. They will be available once verification completes.");
      onSaved?.();
    } catch (saveError) {
      setError(saveError?.message || "We could not save your payout details.");
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    setError("");
    setNotice("");
    if (!window.confirm(`Request a payout of ${paiseToInr(availablePaise)}?`)) return;
    setBusy(true);
    try {
      await base44.functions.invoke("requestPayout", {});
      setNotice("Payout request submitted. We will update you when it is processed.");
      onSaved?.();
    } catch (redeemError) {
      setError(redeemError?.message || "We could not submit that payout request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 space-y-4">
      <section className="rounded-[1.5rem] bg-[#17324d] p-6 text-white">
        <p className="text-[0.78rem] uppercase tracking-wide text-white/70">Available to redeem</p>
        <p className="mt-2 font-heading text-[2.4rem] leading-none">{paiseToInr(availablePaise)}</p>
        <div className="mt-5 grid gap-3 text-[0.85rem] sm:grid-cols-3">
          <BalanceStat label="Held" value={paiseToInr(personnel?.heldPaise)} />
          <BalanceStat label="Lifetime earned" value={paiseToInr(personnel?.lifetimeEarnedPaise)} />
          <BalanceStat label="This financial year" value={paiseToInr(personnel?.fyGrossPaise)} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {payoutDetails.verified ? (
            <button
              type="button"
              disabled={busy || availablePaise <= 0}
              onClick={redeem}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.86rem] font-semibold text-[#17324d] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Redeem {paiseToInr(availablePaise)}
            </button>
          ) : (
            <span className="rounded-full bg-white/15 px-4 py-2 text-[0.82rem]">Add and verify payout details to redeem</span>
          )}
          {payoutDetails.type === "upi" && payoutDetails.upiMasked ? (
            <span className="text-[0.82rem] text-white/75">UPI: {payoutDetails.upiMasked}</span>
          ) : null}
          {payoutDetails.type === "bank_account" && payoutDetails.accountLast4 ? (
            <span className="text-[0.82rem] text-white/75">
              Bank: ••••{payoutDetails.accountLast4} · {payoutDetails.ifsc}
            </span>
          ) : null}
        </div>
      </section>

      {earningsDenied || payoutsDenied ? (
        <p className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-[0.88rem] text-amber-900">
          Your earnings ledger and payout history need a verified account. Verify your email or phone in the
          mobile app to see them here. Balances above are still available.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[0.88rem] text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[0.88rem] text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-[1.3rem] text-foreground">Payout destination</h2>
          </div>
          <div className="mt-4 flex gap-2">
            {[
              { key: "upi", label: "UPI" },
              { key: "bank", label: "Bank account" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMethod(item.key)}
                className={`rounded-full border px-4 py-2 text-[0.82rem] font-semibold ${
                  method === item.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {method === "upi" ? (
              <label className="block">
                <span className="label-strong">UPI ID</span>
                <input
                  aria-label="UPI ID"
                  value={upiId}
                  onChange={(event) => setUpiId(event.target.value)}
                  placeholder="name@bank"
                  className="field mt-2"
                />
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="label-strong">Account number</span>
                  <input
                    aria-label="Account number"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    className="field mt-2"
                  />
                </label>
                <label className="block">
                  <span className="label-strong">Confirm account number</span>
                  <input
                    aria-label="Confirm account number"
                    value={confirmAccount}
                    onChange={(event) => setConfirmAccount(event.target.value)}
                    className="field mt-2"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-strong">IFSC</span>
                    <input
                      aria-label="IFSC"
                      value={ifsc}
                      onChange={(event) => setIfsc(event.target.value)}
                      className="field mt-2 uppercase"
                    />
                  </label>
                  <label className="block">
                    <span className="label-strong">Account holder</span>
                    <input
                      aria-label="Account holder"
                      value={holderName}
                      onChange={(event) => setHolderName(event.target.value)}
                      className="field mt-2"
                    />
                  </label>
                </div>
              </>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={savePayout}
              className="rounded-full bg-primary px-5 py-2.5 text-[0.85rem] font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
              Save payout details
            </button>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <Banknote className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-[1.3rem] text-foreground">Lifetime summary</h2>
          </div>
          <dl className="mt-4 space-y-3 text-[0.88rem]">
            <SummaryRow label="Gross earnings" value={paiseToInr(personnel?.lifetimeEarnedPaise)} />
            <SummaryRow label="Clawbacks" value={paiseToInr(personnel?.clawbackPaise)} />
            <SummaryRow label="Visits completed" value={String(personnel?.visitsCompleted || 0)} />
            <SummaryRow label="Rating" value={personnel?.rating ? `${Number(personnel.rating).toFixed(1)} / 5` : "—"} />
          </dl>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-border bg-card p-6">
        <h2 className="font-heading text-[1.3rem] text-foreground">Earnings ledger</h2>
        {earnings === null || earningsDenied ? (
          <p className="mt-4 text-[0.88rem] text-muted-foreground">Ledger unavailable.</p>
        ) : earnings.length === 0 ? (
          <p className="mt-4 text-[0.88rem] text-muted-foreground">No earnings posted yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-[0.85rem]">
              <thead className="text-[0.75rem] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Booking</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="py-2.5">{formatLedgerDate(entry.createdAt)}</td>
                    <td className="py-2.5">{entry.bookingId || "—"}</td>
                    <td className="py-2.5 capitalize">{(entry.status || "—").replace(/_/g, " ")}</td>
                    <td className="py-2.5 text-right font-medium">{paiseToInr(entry.netPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-6">
        <h2 className="font-heading text-[1.3rem] text-foreground">Payout history</h2>
        {payouts === null || payoutsDenied ? (
          <p className="mt-4 text-[0.88rem] text-muted-foreground">Payout history unavailable.</p>
        ) : payouts.length === 0 ? (
          <p className="mt-4 text-[0.88rem] text-muted-foreground">No payouts requested yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/50 p-3 text-[0.85rem]">
                <span className="text-muted-foreground">{formatLedgerDate(payout.createdAt)}</span>
                <span className="capitalize">{payout.status || "—"}</span>
                <span className="font-semibold">{paiseToInr(payout.totalPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BalanceStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-[0.72rem] uppercase tracking-wide text-white/65">{label}</p>
      <p className="mt-1 text-[1rem] font-semibold">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
