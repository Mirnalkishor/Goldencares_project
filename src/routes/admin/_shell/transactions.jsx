import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminModal,
  AdminPage,
  AdminPagination,
  AdminSearch,
  AdminTable,
  formatDateTime,
  formatINR,
} from "@/components/admin/AdminUI";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/transactions")({
  head: () => ({ meta: [{ title: "Transactions | GoldenCares admin" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const list = useAdminPagedList(
    "adminListTransactions",
    {
      transactionId: query && !query.startsWith("GC-") && !query.startsWith("U-") ? query : "",
      bookingId: query.startsWith("GC-") ? query : "",
      userId: query.startsWith("U-") ? query : "",
    },
    "transactions",
  );

  const columns = [
    { key: "reference", label: "Transaction", render: (row) => <div><p className="font-semibold text-foreground">{row.displayId || row.reference || row.id}</p><p className="mt-0.5 text-[0.72rem] text-muted-foreground">{formatDateTime(row.createdAt || row.createdAtMillis)}</p></div> },
    { key: "booking", label: "Booking", render: (row) => row.bookingId || "—" },
    { key: "service", label: "Service", render: (row) => row.serviceName || "—" },
    { key: "amount", label: "Amount", render: (row) => formatINR(row.displayAmount) },
    { key: "fee", label: "Platform fee", render: (row) => formatINR(row.displayPlatformFee) },
    { key: "method", label: "Method", render: (row) => row.paymentMethod || row.method || "—" },
    { key: "status", label: "Status", render: (row) => <AdminBadge status={row.status} /> },
  ];

  return (
    <AdminPage title="Transactions" description="Read-only Razorpay ledger. Payment records are written by the backend and cannot be edited here.">
      <AdminCard
        title="Payment ledger"
        actions={<><AdminSearch value={search} onChange={setSearch} onSubmit={() => setQuery(search.trim())} placeholder="Transaction, booking or user ID…" /><AdminButton variant="secondary" onClick={() => setQuery(search.trim())}>Search</AdminButton></>}
      >
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading transactions…" /> : null}
        <AdminTable columns={columns} rows={list.rows} onRowClick={setSelected} empty="No transactions found." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.displayId || selected?.reference || selected?.id || "Transaction"} description="Payment record" wide>
        {selected ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Amount"><p className="mt-1 text-foreground">{formatINR(selected.displayAmount)}</p></AdminField>
              <AdminField label="Platform fee"><p className="mt-1 text-foreground">{formatINR(selected.displayPlatformFee)}</p></AdminField>
              <AdminField label="Status"><p className="mt-1"><AdminBadge status={selected.status} /></p></AdminField>
              <AdminField label="Created"><p className="mt-1 text-foreground">{formatDateTime(selected.createdAt || selected.createdAtMillis)}</p></AdminField>
              <AdminField label="Razorpay payment ID"><p className="mt-1 break-all font-mono text-[0.78rem] text-foreground">{selected.paymentId || selected.razorpayPaymentId || "—"}</p></AdminField>
              <AdminField label="Provider order ID"><p className="mt-1 break-all font-mono text-[0.78rem] text-foreground">{selected.orderId || selected.providerOrderId || "—"}</p></AdminField>
              <AdminField label="Booking ID"><p className="mt-1 break-all text-foreground">{selected.bookingId || "—"}</p></AdminField>
              <AdminField label="User ID"><p className="mt-1 break-all text-foreground">{selected.userId || "—"}</p></AdminField>
              <AdminField label="Caregiver ID"><p className="mt-1 break-all text-foreground">{selected.servicePersonnelId || "—"}</p></AdminField>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="label-strong">Raw record</p>
              <pre className="mt-2 max-h-72 overflow-auto text-[0.72rem] text-muted-foreground">{JSON.stringify(selected, null, 2)}</pre>
            </div>
          </>
        ) : <AdminEmpty>Select a transaction to inspect it.</AdminEmpty>}
      </AdminModal>
    </AdminPage>
  );
}
