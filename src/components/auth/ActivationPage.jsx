import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { beginPhoneLink, completePhoneLink, normalizePhoneInput } from "@/lib/activation";
import { safeReturnTo } from "@/lib/authReturnTo";

function OtpInput({ value, onChange }) {
  return (
    <InputOTP maxLength={6} value={value} onChange={onChange} autoComplete="one-time-code">
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

function StatusRow({ done, icon: Icon, title, detail }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 ${done ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-[0.9rem] font-semibold text-foreground">{title}</p>
        <p className="text-[0.78rem] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function ActivationPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const returnTo = safeReturnTo();
  const [phone, setPhone] = useState(String(user?.phone || ""));
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const emailVerified = user?.activation?.emailVerified === true;
  const phoneVerified = user?.activation?.phoneVerified === true;
  const firebaseEmailVerified = user?.email_verified === true;
  const complete = user?.activation?.complete === true;

  function destinationFor(nextUser) {
    if (returnTo && returnTo !== "/activate") return returnTo;
    return nextUser?.role === "caregiver" ? "/caregiver" : "/account";
  }

  useEffect(() => {
    if (complete) navigate({ to: destinationFor(user), replace: true });
    // `destinationFor` only reads the current render's user/returnTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, navigate]);

  async function refreshAndFinish() {
    const next = await refresh();
    if (next?.user?.activation?.complete === true) {
      navigate({ to: destinationFor(next.user), replace: true });
    }
    return next;
  }

  async function sendEmailLink() {
    setBusy("email-send");
    setError("");
    try {
      await base44.auth.sendActivationEmail();
      toast.success("Verification link sent", { description: "Open the link in your inbox to verify this email." });
    } catch (err) {
      setError(err.message || "Could not send the verification link.");
    } finally {
      setBusy("");
    }
  }

  async function confirmEmail() {
    setBusy("email-confirm");
    setError("");
    try {
      await base44.functions.invoke("activationVerifyEmail", {});
      await refreshAndFinish();
      toast.success("Email verified");
    } catch (err) {
      setError(err.message || "Open the verification link in your email first.");
    } finally {
      setBusy("");
    }
  }

  async function sendPhoneCode() {
    const normalized = normalizePhoneInput(phone);
    if (!normalized) {
      setError("Enter a valid mobile number.");
      return;
    }
    setBusy("phone-send");
    setError("");
    try {
      const result = await beginPhoneLink(normalized);
      setConfirmation(result);
      setPhone(normalized);
      setPhoneSent(true);
      toast.success("SMS code sent");
    } catch (err) {
      setError(err.message || "Could not send the SMS code.");
    } finally {
      setBusy("");
    }
  }

  async function verifyPhoneCode(event) {
    event.preventDefault();
    if (!confirmation) return;
    setBusy("phone-verify");
    setError("");
    try {
      await completePhoneLink(confirmation, phoneCode);
      await base44.functions.invoke("activationVerifyPhone", { phone });
      await refreshAndFinish();
      setPhoneSent(false);
      setPhoneCode("");
      setConfirmation(null);
      toast.success("Mobile verified");
    } catch (err) {
      setError(err.message || "Could not verify that code.");
    } finally {
      setBusy("");
    }
  }

  if (complete) {
    return (
      <AuthLayout icon={CheckCircle2} title="Account activated" subtitle="Opening your account…">
        <p className="text-center text-sm text-muted-foreground">Email and mobile are both verified.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Mail} title="Activate your account" subtitle="Verify both your email and mobile number to continue">
      <div className="mb-6 space-y-2">
        <StatusRow
          done={emailVerified}
          icon={Mail}
          title="Email verification"
          detail={
            emailVerified
              ? "Verified"
              : firebaseEmailVerified
                ? "Link opened — confirm below"
                : "Verification link sent to your inbox"
          }
        />
        <StatusRow done={phoneVerified} icon={Smartphone} title="Mobile verification" detail={phoneVerified ? "Verified" : "SMS code sent to your number"} />
      </div>
      <AuthError>{error}</AuthError>

      {!emailVerified ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            confirmEmail();
          }}
          className="mb-7 rounded-xl border border-border bg-card p-4"
        >
          <p className="mb-1 text-sm font-semibold text-foreground">1. Verify email</p>
          <p className="text-[0.82rem] leading-relaxed text-muted-foreground">
            {firebaseEmailVerified
              ? "Your email is verified. Confirm below to continue."
              : "Open the link we emailed you. It returns here and verifies your email automatically."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SubmitButton busy={busy === "email-confirm"} busyLabel="Checking…">
              I&apos;ve opened the link
            </SubmitButton>
            <button
              type="button"
              onClick={sendEmailLink}
              disabled={busy === "email-send"}
              className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
            >
              {busy === "email-send" ? "Sending…" : "Resend verification link"}
            </button>
          </div>
        </form>
      ) : null}

      {!phoneVerified ? (
        <form onSubmit={verifyPhoneCode} className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">2. Verify mobile</p>
          <Label htmlFor="activation-phone">Mobile number</Label>
          <Input
            id="activation-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+919876543210"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={busy === "phone-send" || phoneSent}
            className="mt-1"
            required
          />
          {!phoneSent ? (
            <button type="button" onClick={sendPhoneCode} disabled={busy === "phone-send"} className="mt-3 text-sm font-semibold text-primary hover:underline">
              {busy === "phone-send" ? "Sending SMS…" : "Send SMS code"}
            </button>
          ) : (
            <>
              <div className="mb-4 mt-4 flex justify-center"><OtpInput value={phoneCode} onChange={setPhoneCode} /></div>
              <SubmitButton busy={busy === "phone-verify"} busyLabel="Verifying…" disabled={phoneCode.length < 6}>
                Verify mobile
              </SubmitButton>
              <button type="button" onClick={sendPhoneCode} disabled={busy === "phone-send"} className="mt-3 text-xs font-medium text-primary hover:underline">
                Resend SMS
              </button>
            </>
          )}
          <div id="activation-recaptcha" className="sr-only" aria-hidden="true" />
        </form>
      ) : null}
    </AuthLayout>
  );
}
