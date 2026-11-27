import { useState } from "react";
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
  const [emailCode, setEmailCode] = useState("");
  const [phone, setPhone] = useState(String(user?.phone || ""));
  const [phoneCode, setPhoneCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const emailVerified = user?.activation?.emailVerified === true;
  const phoneVerified = user?.activation?.phoneVerified === true;
  const complete = user?.activation?.complete === true;

  async function finish() {
    await refresh();
    const destination = returnTo && returnTo !== "/activate" ? returnTo : (user?.role === "caregiver" ? "/caregiver" : "/account");
    navigate({ to: destination, replace: true });
  }

  async function sendEmailCode() {
    setBusy("email-send");
    setError("");
    try {
      await base44.functions.invoke("activationSendEmailOtp", {});
      setEmailSent(true);
      toast.success("Email code sent", { description: "Check your inbox. The code expires in 10 minutes." });
    } catch (err) {
      setError(err.message || "Could not send the email code.");
    } finally {
      setBusy("");
    }
  }

  async function verifyEmailCode(event) {
    event.preventDefault();
    setBusy("email-verify");
    setError("");
    try {
      await base44.functions.invoke("activationVerifyEmailOtp", { code: emailCode });
      await refresh();
      setEmailSent(false);
      setEmailCode("");
      toast.success("Email verified");
      if (phoneVerified) await finish();
    } catch (err) {
      setError(err.message || "Could not verify that code.");
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
      await refresh();
      setPhoneSent(false);
      setPhoneCode("");
      setConfirmation(null);
      toast.success("Mobile verified");
      if (emailVerified) await finish();
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
        <StatusRow done={emailVerified} icon={Mail} title="Email verification" detail={emailVerified ? "Verified" : "6-digit code sent to your inbox"} />
        <StatusRow done={phoneVerified} icon={Smartphone} title="Mobile verification" detail={phoneVerified ? "Verified" : "SMS code sent to your number"} />
      </div>
      <AuthError>{error}</AuthError>

      {!emailVerified ? (
        <form onSubmit={verifyEmailCode} className="mb-7 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">1. Verify email</p>
          {!emailSent ? (
            <button type="button" onClick={sendEmailCode} disabled={busy === "email-send"} className="text-sm font-semibold text-primary hover:underline">
              {busy === "email-send" ? "Sending…" : "Send email code"}
            </button>
          ) : (
            <>
              <div className="mb-4 flex justify-center"><OtpInput value={emailCode} onChange={setEmailCode} /></div>
              <SubmitButton busy={busy === "email-verify"} busyLabel="Verifying…" disabled={emailCode.length < 6}>
                Verify email
              </SubmitButton>
              <button type="button" onClick={sendEmailCode} disabled={busy === "email-send"} className="mt-3 text-xs font-medium text-primary hover:underline">
                Resend code
              </button>
            </>
          )}
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
