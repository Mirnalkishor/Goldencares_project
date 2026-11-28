import { ArrowLeft, HeartHandshake, Lock, Mail, Phone, UserPlus, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithEmail } from "@/lib/authMfa";
import { normalizePhoneInput } from "@/lib/activation";
import { safeReturnTo } from "@/lib/authReturnTo";

function initialRole() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("role");
  return value === "caregiver" || value === "family" ? value : null;
}

const ROLE_OPTIONS = [
  {
    value: "family",
    icon: UserRound,
    title: "Create user account",
    detail: "Book care for someone you love and manage visits from one place.",
  },
  {
    value: "caregiver",
    icon: HeartHandshake,
    title: "Become a caregiver",
    detail: "Offer companionship, choose your hours and complete a short verification.",
  },
];

/**
 * Registration is a two-step flow. The account type is chosen first — before
 * the form and before the Google popup — so both signup paths know the role.
 * Email/password plus mobile then lead to activation; caregiver KYC stays a
 * separate lock enforced on the caregiver panel and order feed.
 */
export function RegisterPage() {
  const returnTo = safeReturnTo();
  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const normalizedPhone = normalizePhoneInput(phone);
    if (!/^\+?\d{10,13}$/.test(normalizedPhone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setBusy(true);
    try {
      const cred = await signUpWithEmail(email, password);
      const uid = cred?.user?.uid || cred?.user?.id;
      if (!uid) throw new Error("Account was created but could not be identified. Please sign in.");

      await base44.entities.User.create({
        id: uid,
        email: email.trim().toLowerCase(),
        name: fullName.trim(),
        phone: normalizedPhone,
        role,
        activation: {
          emailVerified: false,
          phoneVerified: false,
          complete: false,
          startedAt: Date.now(),
        },
        ...(role === "caregiver" ? { kyc: { status: "not_started" } } : {}),
      });

      if (role === "caregiver") {
        await base44.entities.CaregiverApplication.create({
          id: uid,
          email: email.trim().toLowerCase(),
          name: fullName.trim(),
          phone: normalizedPhone,
          role: "caregiver",
          status: "new",
          kyc: { status: "not_started" },
          isActive: true,
          isAvailable: false,
        });
      }

      let emailSent = true;
      try {
        await base44.auth.sendActivationEmail();
      } catch {
        emailSent = false;
      }
      toast("Account created", {
        description: emailSent
          ? "We've emailed you a verification link. Open it, then verify your mobile number."
          : "Open the activation page to resend the verification link.",
      });

      const destination = `/activate?returnTo=${encodeURIComponent(returnTo)}`;
      window.location.href = destination;
    } catch (err) {
      setError(err.message || "Registration failed");
      setBusy(false);
    }
  }

  if (!role) {
    return (
      <AuthLayout icon={UserPlus} title="Join GoldenCares" subtitle="First, tell us how you'd like to use GoldenCares">
        <AuthError>{error}</AuthError>
        <div className="space-y-3">
          {ROLE_OPTIONS.map(({ value, icon: Icon, title, detail }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className="flex w-full items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[0.95rem] font-semibold text-foreground">{title}</span>
                <span className="mt-1 block text-[0.82rem] leading-relaxed text-muted-foreground">{detail}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <AuthLink to="/login" returnTo={returnTo}>
            Log in
          </AuthLink>
        </p>
      </AuthLayout>
    );
  }

  const isCaregiver = role === "caregiver";
  return (
    <AuthLayout
      icon={isCaregiver ? HeartHandshake : UserRound}
      title={isCaregiver ? "Create your caregiver account" : "Create your account"}
      subtitle={isCaregiver ? "A few details and a quick verification to start taking visits" : "Sign up to get started"}
    >
      <button
        type="button"
        onClick={() => setRole(null)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Change account type
      </button>
      <GoogleButton returnTo={returnTo} role={role} onError={setError} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">Full name</Label>
          <Input id="register-name" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12" disabled={busy} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-phone">Mobile number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-phone" type="tel" autoComplete="tel" inputMode="numeric" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Creating account...">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <AuthLink to="/login" returnTo={returnTo}>
          Log in
        </AuthLink>
      </p>
    </AuthLayout>
  );
}
