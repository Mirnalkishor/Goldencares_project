import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminBadge, AdminButton, AdminCard, AdminError, AdminField, AdminLoading, AdminPage } from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/_shell/id-translator")({
  head: () => ({ meta: [{ title: "ID Translator | GoldenCares admin" }] }),
  component: IdTranslatorPage,
});

const ROUTES = {
  booking: "/admin/bookings",
  transaction: "/admin/transactions",
  user: "/admin/users",
  caregiver: "/admin/caregivers",
};

const ENTITY_LABELS = {
  booking: "Booking",
  transaction: "Transaction",
  user: "User",
  caregiver: "Caregiver",
};

export default function IdTranslatorPage() {
  const { authz } = useAdmin();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  async function resolve(event) {
    event?.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await adminCall("adminResolveId", { query: query.trim() });
      setResult(data);
      setHistory((current) => [query.trim(), ...current.filter((item) => item !== query.trim())].slice(0, 8));
    } catch (err) {
      setMessage(adminErrorMessage(err));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function backfill() {
    if (!window.confirm("Backfill legacy display IDs across bookings and transactions? This can take a while and is limited to primary admins.")) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await adminCall("adminBackfillDisplayIds", {});
      setMessage(`Backfill complete: ${data?.bookingsUpdated || 0} bookings, ${data?.transactionsUpdated || 0} transactions updated.`);
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage title="ID Translator" description="Resolve booking references, transaction references, provider IDs, Firestore UUIDs and phone numbers to the underlying records.">
      {message ? <AdminError message={message} /> : null}
      <AdminCard title="Look up an ID">
        <form onSubmit={resolve} className="flex flex-col gap-3 sm:flex-row">
          <AdminField label="Reference, UUID, Razorpay payment ID or phone">
            <input className="field mt-1 sm:w-[420px]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="GC-ABC123 / pay_… / +91…" />
          </AdminField>
          <div className="flex items-end"><AdminButton type="submit" loading={busy}>Resolve</AdminButton></div>
        </form>
      </AdminCard>

      {busy && !result ? <AdminCard><AdminLoading label="Resolving…" /></AdminCard> : null}
      {result ? (
        <AdminCard title={`${result.count || 0} matches`} description={`Resolved “${result.query}”`}>
          {result.results?.length ? (
            <div className="space-y-3">
              {result.results.map((item) => (
                <div key={`${item.entityType}-${item.id}`} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><AdminBadge tone="info">{ENTITY_LABELS[item.entityType] || item.entityType}</AdminBadge><span className="font-semibold text-foreground">{item.displayId || item.id}</span></div>
                      <p className="mt-2 text-[0.88rem] text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <Link to={ROUTES[item.entityType] || "/admin/dashboard"} className="rounded-full border border-border px-4 py-2 text-[0.8rem] font-semibold text-foreground">Open in admin</Link>
                  </div>
                  {item.related && Object.keys(item.related).length ? (
                    <div className="mt-3 grid gap-2 border-t border-border pt-3 text-[0.75rem] sm:grid-cols-2">
                      {Object.entries(item.related).filter(([, value]) => value).map(([key, value]) => (
                        <button key={key} type="button" onClick={() => navigator.clipboard?.writeText(String(value))} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-left">
                          <span className="text-muted-foreground">{key}</span><span className="truncate font-mono text-foreground">{String(value)}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <p className="text-[0.9rem] text-muted-foreground">No records matched that reference.</p>}
        </AdminCard>
      ) : null}

      {history.length ? (
        <AdminCard title="Recent lookups">
          <div className="flex flex-wrap gap-2">{history.map((item) => <AdminButton key={item} variant="secondary" onClick={() => { setQuery(item); resolve({ preventDefault() {} }); }}>{item}</AdminButton>)}</div>
        </AdminCard>
      ) : null}

      <AdminCard title="Legacy display IDs" description="Backfill missing GC-/TX- display references across bookings and transactions.">
        <AdminButton variant="secondary" disabled={!authz?.isPrimary || busy} onClick={backfill}>Backfill display IDs</AdminButton>
      </AdminCard>
    </AdminPage>
  );
}
