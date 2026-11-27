import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminButton, AdminCard, AdminError, AdminField, AdminPage } from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";

export const Route = createFileRoute("/admin/change-password")({
  head: () => ({ meta: [{ title: "Set password | GoldenCares admin" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword, signOut } = useAdmin();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use at least 12 characters with upper and lower case letters, a number, and a symbol.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(password);
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err) {
      setError(err?.message || "We could not update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage
      title="Set your admin password"
      description="This is required once when your administrator account is created or reset."
    >
      <AdminCard className="max-w-xl">
        <AdminError message={error} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminField label="New password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-1" />
          </AdminField>
          <AdminField label="Confirm password">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field mt-1" />
          </AdminField>
          <div className="flex flex-wrap gap-2">
            <AdminButton type="submit" loading={busy}>Save new password</AdminButton>
            <AdminButton variant="secondary" onClick={signOut}>Sign out</AdminButton>
          </div>
        </form>
      </AdminCard>
    </AdminPage>
  );
}
