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
  AdminSelect,
  AdminTable,
  formatDate,
} from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/users")({
  head: () => ({ meta: [{ title: "Users | GoldenCares admin" }] }),
  component: UsersPage,
});

const EDITABLE = [
  ["name", "Name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "text"],
  ["city", "City", "text"],
  ["state", "State", "text"],
  ["address", "Address", "text"],
];

function UsersPage() {
  const { authz } = useAdmin();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const list = useAdminPagedList("adminListUsers", { role: "family" }, "users");
  // `adminListUsers` only accepts an exact document ID. Everything else is
  // filtered from the loaded page, matching the old admin's behaviour.
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? list.rows.filter((row) =>
        [row.id, row.name, row.email, row.phone, row.city].some((value) =>
          String(value || "").toLowerCase().includes(needle),
        ),
      )
    : list.rows;

  async function save() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const updates = {};
      for (const [key] of EDITABLE) {
        const element = document.getElementById(`user-${key}`);
        if (element) updates[key] = element.value.trim();
      }
      updates.isActive = document.getElementById("user-active")?.value === "true";
      await adminCall("adminUpdateUser", { userId: selected.id, updates });
      setMessage("User updated.");
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selected || !window.confirm(`Delete ${selected.name || selected.email || selected.id}? This cannot be undone.`)) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminDeleteUser", { userId: selected.id });
      setSelected(null);
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: "name", label: "Family", render: (row) => <div><p className="font-semibold text-foreground">{row.name || row.email || row.id}</p><p className="mt-0.5 text-[0.72rem] text-muted-foreground">{row.email || ""}</p></div> },
    { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
    { key: "city", label: "City", render: (row) => row.city || "—" },
    { key: "joined", label: "Joined", render: (row) => formatDate(row.createdAt) },
    { key: "active", label: "Status", render: (row) => <AdminBadge status={row.isActive === false ? "dismissed" : "active"}>{row.isActive === false ? "Deactivated" : "Active"}</AdminBadge> },
  ];

  return (
    <AdminPage title="Users" description="Family accounts, contact details and account status.">
      <AdminCard
        title="Family accounts"
        actions={<AdminSearch value={search} onChange={(value) => { setSearch(value); setQuery(value); }} placeholder="Name, email, phone or user ID…" />}
      >
        <p className="mb-4 text-[0.8rem] text-muted-foreground">Found {rows.length} of {list.rows.length} loaded accounts. Use “Load more” to widen the search.</p>
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading users…" /> : null}
        <AdminTable columns={columns} rows={rows} onRowClick={setSelected} empty="No family accounts found." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || selected?.email || selected?.id || "User"}
        description={selected?.id}
        wide
        footer={<><AdminButton variant="secondary" onClick={() => setSelected(null)}>Close</AdminButton>{authz?.permissions?.canDeleteAccounts ? <AdminButton variant="danger" loading={busy} onClick={remove}>Delete account</AdminButton> : null}<AdminButton loading={busy} onClick={save}>Save changes</AdminButton></>}
      >
        {selected ? (
          <>
            {message ? <AdminError message={message} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {EDITABLE.map(([key, label, type]) => (
                <AdminField key={key} label={label}>
                  <input id={`user-${key}`} type={type} className="field mt-1" defaultValue={selected[key] || ""} />
                </AdminField>
              ))}
              <AdminField label="Account status">
                <select id="user-active" className="field mt-1" defaultValue={String(selected.isActive !== false)}>
                  <option value="true">Active</option>
                  <option value="false">Deactivated</option>
                </select>
              </AdminField>
            </div>
            <p className="text-[0.8rem] text-muted-foreground">Role: {selected.role || "family"} · Joined {formatDate(selected.createdAt)}</p>
          </>
        ) : null}
      </AdminModal>
    </AdminPage>
  );
}
