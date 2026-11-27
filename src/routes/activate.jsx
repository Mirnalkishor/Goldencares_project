import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ActivationPage } from "@/components/auth/ActivationPage";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/activate")({
  ssr: false,
  head: () => ({ meta: [{ title: "Activate account | GoldenCares" }] }),
  component: ActivateRoute,
});

function ActivateRoute() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !user) navigate({ to: "/login", replace: true });
  }, [isLoadingAuth, user, navigate]);

  if (isLoadingAuth || !user) return null;
  return <ActivationPage />;
}
