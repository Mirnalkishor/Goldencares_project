import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminBadge,
  AdminButton,
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
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/earnings")({
  head: () => ({ meta: [{ title: "Earnings | GoldenCares admin" }] }),
  component: EarningsPage,
});

function EarningsPage() {
  const [financialYear, setFinancialYear] = useState("");
  const [caregiverId, setCaregiverId] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const list = useAdminPagedList("adminListEarnings", { financialYear, caregiverId }, "earnings", 50);

  useEffect(() => {
    setError("");
    adminCall("adminEarningsReport", { financialYear, caregiverId })
      .then(setReport)
      .catch((err) => setError(adminErrorMessage(err)));
  }, [financialYear, caregiverId]);

  function downloadCsv() {
    const header = ["Earning ID", "Caregiver", "Booking", "Status", "Gross (Rs)", "Platform fee (Rs)", "TDS (Rs)", "Net (Rs)", "Financial year", "Created"];
    const lines = list.rows.map((row) => [
      row.id,
      row.caregiverName || row.caregiverId || "",
      row.bookingId || "",
      row.status || "",
      Number(row.grossPaise || 0) / 100,
      Number(row.feePaise || 0) / 100,
      Number(row.tdsPaise || 0) / 100,
      Number(row.netPaise || 0) / 100,
      row.financialYear || "",
      formatDateTime(row.createdAt || row.createdAtMillis),
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `goldencares-earnings-${financialYear || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    { key: "id", label: "Earning", render: (row) => <span className="font-mono text-[0.75rem]">{row.id}</span> },
    { key: "caregiver", label: "Caregiver", render: (row) => row.caregiverName || row.caregiverId || "—" },
    { key: "booking", label: "Booking", render: (row) => row.bookingId || "—" },
    { key: "status", label: "Status", render: (row) => <AdminBadge status={row.status} /> },
    { key: "gross", label: "Gross", render: (row) => formatINR(Number(row.grossPaise || 0) / 100) },
    { key: "fee", label: "Platform fee", render: (row) => formatINR(Number(row.feePaise || 0) / 100) },
    { key: "tds", label: "TDS", render: (row) => formatINR(Number(row.tdsPaise || 0) / 100) },
    { key: "net", label: "Net", render: (row) => formatINR(Number(row.netPaise || 0) / 100) },
    { key: "created", label: "Created", render: (row) => formatDateTime(row.createdAt || row.createdAtMillis) },
  ];

  const totals = report?.totals || {};

  return (
    <AdminPage title="Earnings" description="Caregiver earnings ledger with TDS withholding and financial-year reporting.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">Gross value</p><p className="mt-1 font-heading text-2xl text-foreground">{formatINR(Number(totals.grossPaise || 0) / 100)}</p></AdminCard>
        <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">Platform revenue</p><p className="mt-1 font-heading text-2xl text-foreground">{formatINR(Number(totals.feePaise || 0) / 100)}</p></AdminCard>
        <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">TDS withheld</p><p className="mt-1 font-heading text-2xl text-foreground">{formatINR(Number(totals.tdsPaise || 0) / 100)}</p></AdminCard>
        <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">Net to caregivers</p><p className="mt-1 font-heading text-2xl text-foreground">{formatINR(Number(totals.netPaise || 0) / 100)}</p></AdminCard>
      </div>

      <AdminCard title="Filters">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Caregiver ID"><input className="field mt-1" value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)} placeholder="Full Firestore ID" /></AdminField>
          <AdminField label="Financial year"><input className="field mt-1" value={financialYear} onChange={(event) => setFinancialYear(event.target.value)} placeholder="e.g. 2026-27" /></AdminField>
        </div>
      </AdminCard>

      {report?.byCaregiver?.length || report?.byFinancialYear?.length ? (
        <AdminCard title="TDS report" description="Use these tables for 26Q / Form 16A filing.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="label-strong">By caregiver</p>
              <AdminTable columns={[
                { key: "caregiverId", label: "Caregiver", render: (row) => row.caregiverName || row.caregiverId || "—" },
                { key: "tds", label: "TDS", render: (row) => formatINR(Number(row.tdsPaise || 0) / 100) },
                { key: "net", label: "Net", render: (row) => formatINR(Number(row.netPaise || 0) / 100) },
              ]} rows={report.byCaregiver || []} rowKey="caregiverId" empty="No caregiver totals." />
            </div>
            <div>
              <p className="label-strong">By financial year</p>
              <AdminTable columns={[
                { key: "financialYear", label: "FY" },
                { key: "tds", label: "TDS", render: (row) => formatINR(Number(row.tdsPaise || 0) / 100) },
                { key: "net", label: "Net", render: (row) => formatINR(Number(row.netPaise || 0) / 100) },
              ]} rows={report.byFinancialYear || []} rowKey="financialYear" empty="No yearly totals." />
            </div>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="Earnings ledger" actions={<AdminButton variant="secondary" onClick={downloadCsv}>Download CSV</AdminButton>}>
        <AdminError message={error || list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading earnings…" /> : null}
        <AdminTable columns={columns} rows={list.rows} empty="No earnings found." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>
    </AdminPage>
  );
}
