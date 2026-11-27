import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminError,
  AdminField,
  AdminLoading,
  AdminModal,
  AdminPage,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  AdminTable,
  formatDateTime,
} from "@/components/admin/AdminUI";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/issues")({
  head: () => ({ meta: [{ title: "Issues | GoldenCares admin" }] }),
  component: IssuesPage,
});

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];
const SEVERITIES = [
  { value: "", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function IssuesPage() {
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const list = useAdminPagedList("adminListIssues", { status, severity, search: query }, "issues", 50);

  useEffect(() => {
    adminCall("adminGetIssuesSummary", {}).then(setSummary).catch(() => setSummary(null));
  }, []);

  async function save() {
    if (!selected) return;
    const resolutionNotes = document.getElementById("issue-notes")?.value?.trim() || "";
    const nextStatus = document.getElementById("issue-status")?.value;
    if (["resolved", "dismissed"].includes(nextStatus) && !resolutionNotes) {
      setMessage("Resolution notes are required before closing an issue.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminUpdateIssue", {
        issueId: selected.id,
        status: nextStatus,
        assignedTo: document.getElementById("issue-assignee")?.value?.trim() || "",
        resolutionNotes,
      });
      setMessage("Issue updated.");
      list.reload();
      adminCall("adminGetIssuesSummary", {}).then(setSummary).catch(() => {});
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: "reference", label: "Issue", render: (row) => <div><p className="font-semibold text-foreground">{row.reference || row.id}</p><p className="mt-0.5 text-[0.72rem] text-muted-foreground">{formatDateTime(row.createdAt)}</p></div> },
    { key: "category", label: "Category", render: (row) => String(row.category || "—").replaceAll("_", " ") },
    { key: "severity", label: "Severity", render: (row) => <AdminBadge status={row.severity} /> },
    { key: "status", label: "Status", render: (row) => <AdminBadge status={row.status} /> },
    { key: "reporter", label: "Reporter", render: (row) => row.reportedByEmail || row.reporterEmail || row.userId || "—" },
    { key: "assignee", label: "Assigned to", render: (row) => row.assignedTo || "—" },
  ];

  return (
    <AdminPage title="Issues" description="Triage service incidents, refund failures and caregiver no-shows.">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">Open</p><p className="mt-1 font-heading text-2xl text-foreground">{summary.openCount}</p></AdminCard>
          <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">In review</p><p className="mt-1 font-heading text-2xl text-foreground">{summary.inReviewCount}</p></AdminCard>
          <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">Critical</p><p className="mt-1 font-heading text-2xl text-destructive">{summary.criticalCount}</p></AdminCard>
          <AdminCard><p className="text-[0.72rem] uppercase tracking-wide text-muted-foreground">Unresolved</p><p className="mt-1 font-heading text-2xl text-foreground">{summary.unresolvedTotal}</p></AdminCard>
        </div>
      ) : null}

      <AdminCard title="Incident queue">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AdminSearch value={search} onChange={setSearch} onSubmit={() => { setQuery(search.trim()); list.reload(); }} placeholder="Search issues…" />
          <AdminSelect label="Status" value={status} onChange={setStatus} options={STATUS_FILTERS} className="w-full sm:w-44" />
          <AdminSelect label="Severity" value={severity} onChange={setSeverity} options={SEVERITIES} className="w-full sm:w-44" />
          <AdminButton variant="secondary" onClick={() => { setQuery(search.trim()); list.reload(); }}>Apply</AdminButton>
        </div>
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading issues…" /> : null}
        <AdminTable columns={columns} rows={list.rows} onRowClick={(row) => { setSelected(row); setMessage(""); }} empty="No issues match these filters." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.reference || selected?.id || "Issue"}
        description={selected ? `${String(selected.category || "").replaceAll("_", " ")} · reported ${formatDateTime(selected.createdAt)}` : ""}
        footer={<><AdminButton variant="secondary" onClick={() => setSelected(null)}>Close</AdminButton><AdminButton loading={busy} onClick={save}>Save issue</AdminButton></>}
      >
        {selected ? (
          <>
            {message ? <AdminError message={message} /> : null}
            <div className="rounded-xl border border-border bg-background p-4 text-[0.82rem]">
              <p><span className="text-muted-foreground">Description:</span> {selected.description || selected.title || "—"}</p>
              <p className="mt-1"><span className="text-muted-foreground">Severity:</span> {selected.severity || "—"} · <span className="text-muted-foreground">Status:</span> {selected.status || "—"}</p>
              {selected.metadata && Object.keys(selected.metadata).length ? (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-[0.72rem] text-foreground/80">{JSON.stringify(selected.metadata, null, 2)}</pre>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Status">
                <select id="issue-status" className="field mt-1" defaultValue={selected.status}>
                  {STATUS_FILTERS.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </AdminField>
              <AdminField label="Assigned to">
                <input id="issue-assignee" className="field mt-1" defaultValue={selected.assignedTo || ""} />
              </AdminField>
            </div>
            <AdminField label="Resolution notes" hint="Required before an issue can be resolved or dismissed.">
              <textarea id="issue-notes" className="field-area mt-1" rows={4} defaultValue={selected.resolutionNotes || ""} />
            </AdminField>
          </>
        ) : null}
      </AdminModal>
    </AdminPage>
  );
}
