import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  AdminTable,
  formatDateTime,
} from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/whitelist")({
  head: () => ({ meta: [{ title: "Whitelist | GoldenCares admin" }] }),
  component: WhitelistPage,
});

function WhitelistPage() {
  const { authz } = useAdmin();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [csv, setCsv] = useState("");

  const list = useAdminPagedList("adminListPartners", {}, "partners", 100);
  const rows = list.rows.filter((row) =>
    String(row.email || "").toLowerCase().includes(search.trim().toLowerCase()),
  );
  const canManage = authz?.permissions?.canManageAdmins || authz?.isPrimary === true;

  async function upsert(email, isActive) {
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminUpsertPartner", { email, isActive });
      setShowAdd(false);
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(email) {
    if (!window.confirm(`Remove ${email} from the partner whitelist?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminDeletePartner", { email });
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function bulkUpload() {
    const emails = [...new Set(
      csv.split(/[\n,;]+/).map((value) => value.trim().toLowerCase()).filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
    )];
    if (!emails.length) {
      setMessage("No valid email addresses found in the CSV.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminBulkUpsertPartners", { emails, isActive: true });
      setShowBulk(false);
      setCsv("");
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: "email", label: "Email", render: (row) => <span className="font-semibold text-foreground">{row.email}</span> },
    { key: "status", label: "Status", render: (row) => <AdminBadge status={row.isActive !== false ? "active" : "dismissed"} /> },
    { key: "updatedBy", label: "Updated by", render: (row) => row.updatedBy || "—" },
    { key: "updatedAt", label: "Updated", render: (row) => formatDateTime(row.updatedAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <AdminButton variant="secondary" disabled={!canManage} onClick={(event) => { event.stopPropagation(); upsert(row.email, row.isActive === false); }}>
            {row.isActive === false ? "Enable" : "Disable"}
          </AdminButton>
          <AdminButton variant="danger" disabled={!canManage} onClick={(event) => { event.stopPropagation(); remove(row.email); }}>Delete</AdminButton>
        </div>
      ),
    },
  ];

  return (
    <AdminPage title="Whitelist" description="Control which partner email addresses may sign in to the partner portal.">
      {message ? <AdminError message={message} /> : null}
      <AdminCard
        title={`${rows.length} whitelisted emails`}
        actions={<><AdminButton variant="secondary" disabled={!canManage} onClick={() => setShowBulk(true)}>Bulk upload CSV</AdminButton><AdminButton disabled={!canManage} onClick={() => setShowAdd(true)}>Add email</AdminButton></>}
      >
        <AdminSearch value={search} onChange={setSearch} placeholder="Filter emails…" />
        <div className="mt-4">
          <AdminError message={list.error} onRetry={list.reload} />
          {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading whitelist…" /> : null}
          <AdminTable columns={columns} rows={rows} empty="No whitelisted emails yet." />
          <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
        </div>
      </AdminCard>

      <AdminModal open={showAdd} onClose={() => setShowAdd(false)} title="Add whitelisted email" footer={<><AdminButton variant="secondary" onClick={() => setShowAdd(false)}>Cancel</AdminButton><AdminButton loading={busy} onClick={() => upsert(document.getElementById("wl-email")?.value?.trim(), true)}>Add email</AdminButton></>}>
        <AdminField label="Email address"><input id="wl-email" type="email" className="field mt-1" placeholder="partner@example.com" /></AdminField>
      </AdminModal>

      <AdminModal open={showBulk} onClose={() => setShowBulk(false)} title="Bulk upload partners" description="Paste a CSV column or a comma-separated list of email addresses." footer={<><AdminButton variant="secondary" onClick={() => setShowBulk(false)}>Cancel</AdminButton><AdminButton loading={busy} onClick={bulkUpload}>Upload</AdminButton></>}>
        <AdminField label="Email addresses" hint="Duplicates are removed and invalid rows are skipped.">
          <textarea id="wl-csv" className="field-area mt-1" rows={8} value={csv} onChange={(event) => setCsv(event.target.value)} placeholder={"one@example.com\ntwo@example.com"} />
        </AdminField>
      </AdminModal>
    </AdminPage>
  );
}
