import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AdminButton,
  AdminCard,
  AdminError,
  AdminLoading,
  AdminModal,
  AdminPage,
  AdminPagination,
  AdminSelect,
  AdminTable,
  formatDateTime,
} from "@/components/admin/AdminUI";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/audit-logs")({
  head: () => ({ meta: [{ title: "Audit logs | GoldenCares admin" }] }),
  component: AuditLogsPage,
});

const RANGES = [
  { value: "0", label: "All time" },
  { value: String(Date.now() - 24 * 60 * 60 * 1000), label: "Today" },
  { value: String(Date.now() - 7 * 24 * 60 * 60 * 1000), label: "Last 7 days" },
  { value: String(Date.now() - 30 * 24 * 60 * 60 * 1000), label: "Last 30 days" },
];

function AuditLogsPage() {
  const [range, setRange] = useState("0");
  const [selected, setSelected] = useState(null);
  const list = useAdminPagedList("adminListAuditLogs", { sinceMillis: Number(range) || undefined }, "logs", 100);

  const columns = [
    { key: "timestamp", label: "When", render: (row) => formatDateTime(row.timestamp) },
    { key: "admin", label: "Admin", render: (row) => row.adminEmail || row.admin || "—" },
    { key: "category", label: "Action", render: (row) => String(row.actionCategory || row.category || "—").replaceAll("_", " ") },
    { key: "target", label: "Target", render: (row) => <div><p className="text-foreground">{row.targetEntityType || "—"}</p><p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">{row.targetEntityId || "—"}</p></div> },
  ];

  return (
    <AdminPage title="Audit logs" description="Immutable record of administrative actions. Only primary admins can read this trail.">
      <AdminCard title="Admin actions" actions={<AdminSelect label="Date range" value={range} onChange={setRange} options={RANGES} className="w-full sm:w-44" />}>
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading audit logs…" /> : null}
        <AdminTable columns={columns} rows={list.rows} onRowClick={setSelected} empty="No audit records in this range." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} wide title={String(selected?.actionCategory || selected?.category || "Audit record").replaceAll("_", " ")} description={`${selected?.adminEmail || selected?.admin || "Unknown admin"} · ${formatDateTime(selected?.timestamp)}`}>
        {selected ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="label-strong">Previous state</p>
              <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-[0.72rem] text-foreground/80">{JSON.stringify(selected.previousState ?? null, null, 2)}</pre>
            </div>
            <div>
              <p className="label-strong">New state</p>
              <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-[0.72rem] text-foreground/80">{JSON.stringify(selected.newState ?? null, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </AdminPage>
  );
}
