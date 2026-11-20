import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ name: "referrer", content: "no-referrer" }] }),
  component: ResetPasswordPage,
});