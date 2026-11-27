import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { Loader2, MailCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getAuthClient } from "@/api/firebaseClient";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { sanitizeReturnTo } from "@/lib/authReturnTo";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  validateSearch: (search) => ({
    oobCode: typeof search.oobCode === "string" ? search.oobCode : "",
    mode: typeof search.mode === "string" ? search.mode : "",
    returnTo: typeof search.returnTo === "string" ? search.returnTo : "",
  }),
  head: () => ({ meta: [{ title: "Verify email | GoldenCares" }] }),
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { oobCode, mode, returnTo } = Route.useSearch();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("working");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      if (mode && mode !== "verifyEmail") {
        setMessage("This link is not an email verification link.");
        setStatus("error");
        return;
      }
      if (!oobCode) {
        setMessage("This verification link is missing its code. Request a fresh one from the activation page.");
        setStatus("error");
        return;
      }

      const auth = getAuthClient();
      await auth.authStateReady();

      try {
        await applyActionCode(auth, oobCode);
      } catch (err) {
        // Reopening an already-used link is harmless; the account flag is what
        // activationVerifyEmail checks.
        if (auth.currentUser?.emailVerified || err?.code === "auth/email-already-verified") {
          // continue
        } else {
          throw err;
        }
      }

      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        await base44.functions.invoke("activationVerifyEmail", {});
        const next = await refresh();
        const destination = sanitizeReturnTo(returnTo);
        if (next?.user?.activation?.complete === true) {
          window.location.assign(destination || "/account");
          return;
        }
        window.location.assign(`/activate${destination && destination !== "/" ? `?returnTo=${encodeURIComponent(destination)}` : ""}`);
        return;
      }

      setStatus("signed-out");
    })().catch((err) => {
      setMessage(err?.message || "We could not verify that link. Request a fresh one.");
      setStatus("error");
    });
  }, [oobCode, mode, returnTo, refresh]);

  if (status === "working") {
    return (
      <AuthLayout icon={Loader2} title="Verifying your email" subtitle="This will only take a moment">
        <p className="text-center text-sm text-muted-foreground">Checking your verification link…</p>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout icon={MailCheck} title="Verification link problem" subtitle="We could not complete that link">
        {message ? <p role="alert" className="text-center text-sm text-destructive">{message}</p> : null}
        <Link to="/activate" className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">
          Back to activation
        </Link>
      </AuthLayout>
    );
  }

  if (status === "signed-out") {
    return (
      <AuthLayout icon={MailCheck} title="Email verified" subtitle="Sign in to finish activating your account">
        <Link to="/login" search={{ returnTo: "/activate" }} className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={MailCheck} title="Email verified" subtitle="Opening activation…">
      <p className="text-center text-sm text-muted-foreground">You can verify your mobile number next.</p>
    </AuthLayout>
  );
}
