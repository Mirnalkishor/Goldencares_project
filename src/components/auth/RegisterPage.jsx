import { Lock, Mail, Phone, UserPlus } from "lucide-react";
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

/**
 * Registration now creates a real, gated account:
 * email/password + role + full name + mobile → activation OTPs → app access.
 * Caregiver KYC is a second lock enforced on the caregiver panel and order feed.
 */
export function RegisterPage() {
  const returnTo = safeReturnTo();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("family");
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

      try {
        await base44.functions.invoke("activationSendEmailOtp", {});
      } catch {
        toast("Account created", { description: "Open the activation page and resend the email code." });
      }

      const destination = `/activate?returnTo=${encodeURIComponent(returnTo)}`;
      window.location.href = destination;
    } catch (err) {
      setError(err.message || "Registration failed");
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={UserPlus} title="Create your account" subtitle="Sign up to get started">
      <GoogleButton returnTo={returnTo} onError={setError} />
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
        <fieldset className="space-y-2" disabled={busy}>
          <legend className="text-sm font-medium">Who am I?</legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="family" checked={role === "family"} onChange={() => setRole("family")} />
              User
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="caregiver" checked={role === "caregiver"} onChange={() => setRole("caregiver")} />
              Caregiver
            </label>
          </div>
        </fieldset>
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
