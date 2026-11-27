import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_shell/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
});
