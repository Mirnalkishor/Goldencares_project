import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminAuthProvider, useAdmin } from "@/lib/AdminAuthContext";
import { AdminLoading } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminRoot,
});

function AdminRoot() {
  return (
    <AdminAuthProvider>
      <AdminGate>
        <Outlet />
      </AdminGate>
    </AdminAuthProvider>
  );
}

function AdminGate({ children }) {
  const { loading, user, requiresPasswordChange } = useAdmin();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/admin/login") {
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    if (user && pathname === "/admin/login") {
      navigate({ to: requiresPasswordChange ? "/admin/change-password" : "/admin/dashboard", replace: true });
      return;
    }
    if (user && requiresPasswordChange && pathname !== "/admin/change-password") {
      navigate({ to: "/admin/change-password", replace: true });
      return;
    }
    if (user && !requiresPasswordChange && pathname === "/admin/change-password") {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [loading, user, requiresPasswordChange, pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminLoading label="Checking admin session…" />
      </div>
    );
  }

  return children;
}
