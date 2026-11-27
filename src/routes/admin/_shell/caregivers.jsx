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
  AdminTable,
  formatDate,
} from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";
import { useAdminPagedList } from "@/lib/useAdminPagedList";

export const Route = createFileRoute("/admin/_shell/caregivers")({
  head: () => ({ meta: [{ title: "Caregivers | GoldenCares admin" }] }),
  component: CaregiversPage,
});

const EDITABLE = [
  ["name", "Name", "text"],
  ["phone", "Phone", "text"],
  ["city", "City", "text"],
  ["state", "State", "text"],
  ["address", "Address", "text"],
  ["profileImage", "Photo URL", "text"],
];

function CaregiversPage() {
  const { authz } = useAdmin();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);

  const list = useAdminPagedList("adminListServicePersonnel", {}, "personnel", 50);
  const rows = onlyPending ? list.rows.filter((row) => !row.isApproved) : list.rows;

  async function save() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const updates = {};
      for (const [key] of EDITABLE) {
        const element = document.getElementById(`cg-${key}`);
        if (element) updates[key] = element.value.trim();
      }
      updates.isAvailable = document.getElementById("cg-available")?.value === "true";
      updates.isActive = document.getElementById("cg-active")?.value === "true";
      if (authz?.isPrimary) {
        updates.visitsCompleted = Number(document.getElementById("cg-visits")?.value || 0);
        updates.experienceYears = Number(document.getElementById("cg-experience")?.value || 0);
      }
      await adminCall("adminUpdateServicePersonnel", { personnelId: selected.id, updates });
      setMessage("Caregiver updated.");
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleApproval() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminApproveCaregiver", {
        caregiverId: selected.id,
        approved: !selected.isApproved,
      });
      setSelected({ ...selected, isApproved: !selected.isApproved });
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!selected || !window.confirm(`Deactivate ${selected.name || selected.id}?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminDeleteServicePersonnel", { personnelId: selected.id });
      setSelected(null);
      list.reload();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: "name", label: "Caregiver", render: (row) => <div><p className="font-semibold text-foreground">{row.name || row.email || row.id}</p><p className="mt-0.5 text-[0.72rem] text-muted-foreground">{row.phone || ""}</p></div> },
    { key: "city", label: "City", render: (row) => row.city || "—" },
    { key: "experience", label: "Experience", render: (row) => row.experienceYears ? `${row.experienceYears} yrs` : "—" },
    { key: "rating", label: "Rating", render: (row) => row.rating ? Number(row.rating).toFixed(1) : "—" },
    { key: "kyc", label: "KYC", render: (row) => <AdminBadge status={row.isApproved ? "approved" : "pending"} /> },
    { key: "available", label: "Availability", render: (row) => <AdminBadge status={row.isAvailable ? "active" : "dismissed"} /> },
    { key: "joined", label: "Joined", render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <AdminPage title="Caregivers" description="Review approvals, availability, profile details and performance.">
      <AdminCard
        title={`${rows.length}${list.hasMore ? "+" : ""} caregivers`}
        actions={<AdminButton variant={onlyPending ? "primary" : "secondary"} onClick={() => setOnlyPending((value) => !value)}>{onlyPending ? "Showing pending KYC" : "Show pending KYC"}</AdminButton>}
      >
        <AdminError message={list.error} onRetry={list.reload} />
        {list.loading && list.rows.length === 0 ? <AdminLoading label="Loading caregivers…" /> : null}
        <AdminTable columns={columns} rows={rows} onRowClick={setSelected} empty="No caregivers found." />
        <AdminPagination hasMore={list.hasMore} loading={list.loading} onLoadMore={list.loadMore} />
      </AdminCard>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        wide
        title={selected?.name || selected?.id || "Caregiver"}
        description={`${selected?.city || "City not set"} · joined ${formatDate(selected?.createdAt)}`}
        footer={<><AdminButton variant="secondary" onClick={() => setSelected(null)}>Close</AdminButton>{authz?.isPrimary ? <AdminButton variant="danger" loading={busy} onClick={deactivate}>Deactivate</AdminButton> : null}<AdminButton variant="secondary" loading={busy} onClick={toggleApproval}>{selected?.isApproved ? "Revoke KYC" : "Approve KYC"}</AdminButton><AdminButton loading={busy} onClick={save}>Save changes</AdminButton></>}
      >
        {selected ? (
          <>
            {message ? <AdminError message={message} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {EDITABLE.map(([key, label, type]) => (
                <AdminField key={key} label={label}>
                  <input id={`cg-${key}`} type={type} className="field mt-1" defaultValue={selected[key] || ""} />
                </AdminField>
              ))}
              <AdminField label="Availability">
                <select id="cg-available" className="field mt-1" defaultValue={String(selected.isAvailable === true)}>
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </AdminField>
              <AdminField label="Account status">
                <select id="cg-active" className="field mt-1" defaultValue={String(selected.isActive !== false)}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </AdminField>
              {authz?.isPrimary ? (
                <>
                  <AdminField label="Visits completed (primary only)"><input id="cg-visits" type="number" className="field mt-1" defaultValue={selected.visitsCompleted || 0} /></AdminField>
                  <AdminField label="Experience years (primary only)"><input id="cg-experience" type="number" className="field mt-1" defaultValue={selected.experienceYears || 0} /></AdminField>
                </>
              ) : null}
            </div>
            {selected.reviews ? (
              <div className="rounded-xl border border-border bg-background p-4 text-[0.82rem]">
                <p className="label-strong">Reviews</p>
                <pre className="mt-2 max-h-40 overflow-auto text-[0.72rem] text-muted-foreground">{JSON.stringify(selected.reviews, null, 2)}</pre>
              </div>
            ) : null}
          </>
        ) : null}
      </AdminModal>
    </AdminPage>
  );
}
