import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { AdminButton, AdminError, AdminField } from "@/components/admin/AdminUI";
import { useAdmin } from "@/lib/AdminAuthContext";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin sign in | GoldenCares" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, reason, error, loading } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    try {
      const authz = await signIn(email, password);
      navigate({
        to: authz?.requiresPasswordChange ? "/admin/change-password" : "/admin/dashboard",
        replace: true,
      });
    } catch {
      // Error is rendered from the admin auth context.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border bg-card p-7 sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="eyebrow mt-5 text-primary/70">GoldenCares team</p>
        <h1 className="mt-2 font-heading text-[1.9rem] text-foreground">Admin console</h1>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-muted-foreground">
          Sign in with your administrator account. Admin sessions expire after eight hours and are valid on one
          device at a time.
        </p>

        {(reason || error || localError) && (
          <div className="mt-5">
            <AdminError
              message={
                reason === "superseded"
                  ? "Your account was signed in from another device. Please sign in again."
                  : reason === "expired"
                    ? "Your admin session expired after eight hours. Please sign in again."
                    : localError || error
              }
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <AdminField label="Email address">
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-1"
              placeholder="admin@goldencares.in"
            />
          </AdminField>
          <AdminField label="Password">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field mt-1"
            />
          </AdminField>
          <AdminButton type="submit" loading={loading} className="w-full">
            <Lock className="h-4 w-4" /> Continue to dashboard
          </AdminButton>
        </form>
      </div>
    </main>
  );
}
