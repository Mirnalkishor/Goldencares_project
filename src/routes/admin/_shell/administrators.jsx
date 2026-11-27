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
  AdminSelect,
  AdminTable,
  formatDateTime,
} from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";
import { adminCall, adminErrorMessage } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/_shell/administrators")({
  head: () => ({ meta: [{ title: "Administrators | GoldenCares admin" }] }),
  component: AdministratorsPage,
});

function AdministratorsPage() {
  const { authz } = useAdmin();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminCall("adminListAdmins", { limit: 300 });
      setAdmins(data?.admins || []);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function grant() {
    setBusy(true);
    setMessage("");
    try {
      const result = await adminCall("grantAdminRole", {
        email: document.getElementById("admin-new-email")?.value?.trim(),
        adminType: document.getElementById("admin-new-type")?.value,
      });
      setNewPassword(result?.temporaryPassword || "");
      setShowAdd(false);
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(admin) {
    if (!window.confirm(`Remove ${admin.email} as an administrator?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await adminCall("adminRemoveAdmin", { email: admin.email });
      load();
    } catch (err) {
      setMessage(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: "email", label: "Administrator", render: (row) => <div><p className="font-semibold text-foreground">{row.email}</p><p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">{row.uid || "—"}</p></div> },
    { key: "type", label: "Role", render: (row) => <AdminBadge status={row.isRoot ? "warning" : row.isPrimary ? "info" : "neutral"}>{row.adminType || "secondary"}</AdminBadge> },
    { key: "password", label: "Password", render: (row) => <AdminBadge status={row.mustChangePassword ? "warning" : "success"}>{row.mustChangePassword ? "Reset required" : "Set"}</AdminBadge> },
    { key: "addedBy", label: "Added by", render: (row) => row.addedBy || "—" },
    { key: "addedAt", label: "Added", render: (row) => formatDateTime(row.addedAt) },
    { key: "actions", label: "Actions", render: (row) => <AdminButton variant="danger" disabled={!row.canBeRemoved || !authz?.permissions?.canManageAdmins || busy} onClick={() => remove(row)}>Remove</AdminButton> },
  ];

  return (
    <AdminPage title="Administrators" description="Grant and revoke primary or secondary admin roles. Root cannot be removed, and nobody can remove themselves.">
      {message ? <AdminError message={message} /> : null}
      {newPassword ? (
        <AdminCard title="One-time temporary password" description="Copy this now. It will not be shown again.">
          <code className="block rounded-lg bg-muted p-3 text-[0.9rem] text-foreground">{newPassword}</code>
          <AdminButton className="mt-3" variant="secondary" onClick={() => { navigator.clipboard?.writeText(newPassword); setNewPassword(""); }}>Copy and dismiss</AdminButton>
        </AdminCard>
      ) : null}
      <AdminCard title="Admin roles" actions={<AdminButton disabled={!authz?.permissions?.canManageAdmins} onClick={() => setShowAdd(true)}>Add administrator</AdminButton>}>
        <AdminError message={error} onRetry={load} />
        {loading ? <AdminLoading label="Loading administrators…" /> : <AdminTable columns={columns} rows={admins} empty="No administrators found." />}
      </AdminCard>

      <AdminModal open={showAdd} onClose={() => setShowAdd(false)} title="Add administrator" description="If the Firebase Auth account does not exist yet, a temporary password is generated for it." footer={<><AdminButton variant="secondary" onClick={() => setShowAdd(false)}>Cancel</AdminButton><AdminButton loading={busy} onClick={grant}>Grant role</AdminButton></>}>
        <AdminField label="Email address"><input id="admin-new-email" type="email" className="field mt-1" placeholder="admin@goldencares.in" /></AdminField>
        <AdminField label="Role">
          <select id="admin-new-type" className="field mt-1" defaultValue="secondary"><option value="secondary">Secondary</option><option value="primary">Primary</option></select>
        </AdminField>
      </AdminModal>
    </AdminPage>
  );
}
