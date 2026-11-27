import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AdminBadge,
  AdminCard,
  AdminError,
  AdminField,
  AdminLoading,
  AdminPage,
  AdminPagination,
  AdminSelect,
  AdminTable,
  formatDateTime,
  formatINR,
} from "@/components/admin/AdminUI";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/payouts")({
  head: () => ({ meta: [{ title: "Payouts | GoldenCares admin" }] }),
  component: PayoutsPage,
});

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "reversed", label: "Reversed" },
];

function PayoutsPage() {
  const [caregiverId, setCaregiverId] = useState("");
  const [status, setStatus] = useState("");
  const list = useAdminPagedList("adminListPayouts", { caregiverId, status }, "payouts", 50);

  const columns = [
    { key: "id", label: "Payout", render: (row) => <div><p className="font-mono text-[0.75rem]">{row.id}</p><p className="mt-0.5 text-[0.72rem] text-muted-foreground">{formatDateTime(row.createdAt || row.createdAtMillis)}</p></div> },
    { key: "caregiver", label: "Caregiver", render: (row) => row.caregiverName || row.caregiverId || "—" },
    { key: "amount", label: "Amount", render: (row) => formatINR(Number(row.amountPaise || 0) / 100) },
    { key: "status", label: "Status", render: (row) => <AdminBadge status={row.status} /> },
    { key: "payoutId", label: "RazorpayX ID", render: (row) => row.payoutId || row.providerPayoutId || "—" },
    { key: "failure", label: "Failure reason", render: (row) => row.failureReason || row.failureMessage || "—" },
    { key: "settled", label: "Settled", render: (row) => formatDateTime(row.settledAt || row.settledAtMillis) },
  ];

  return (
    <AdminPage title="Payouts" description="Read-only RazorpayX payout ledger. Payouts are created and settled by scheduled backend jobs.">
      <AdminCard title="Filters">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Caregiver ID"><input className="field mt-1" value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)} placeholder="Full Firestore ID" /></AdminField>
          <AdminSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
        </div>
      </AdminCard>
      <AdminCard title="Payout ledger">
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading payouts…" /> : null}
        <AdminTable columns={columns} rows={list.rows} empty="No payouts found." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>
    </AdminPage>
  );
}
