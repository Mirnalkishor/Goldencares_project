// MFA — Firebase Multi-Factor Auth (was Base44 /api/apps/<id>/auth/mfa).
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getMultiFactorResolver } from "firebase/auth";
import { multiFactor, PhoneMultiFactorGenerator, TotpMultiFactorGenerator, PhoneAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { base44 } from "@/api/base44Client";
import { getFirebaseApp } from "@/api/firebaseClient";

const auth = () => getAuth(getFirebaseApp());

// --- copied from original Golden-Cares-App `auth_service.dart` ----------------
// OLD signInWithEmail: FirebaseAuth.instance.signInWithEmailAndPassword(email, password).
export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth(), email, password);
}
// OLD signUpWithEmail: FirebaseAuth.instance.createUserWithEmailAndPassword(email, password).
export async function signUpWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth(), email, password);
  return cred;
}

// provider: "google" | "microsoft" | "facebook" | "apple"
export async function loginWithSocial(provider, _returnTo) {
  const a = auth();
  let p;
  if (provider === "google") p = new GoogleAuthProvider();
  else p = new GoogleAuthProvider(); // other providers can be added with their Firebase providers
  return signInWithPopup(a, p);
}

export function loginWithGoogle(returnTo) { return loginWithSocial("google", returnTo); }

// Email/password sign-in; if MFA is enrolled Firebase returns a `multiFactorError` -> handled by caller (MfaFlow).
export async function loginWithMfa(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth(), email, password);
    await base44.auth.setToken(await cred.user.getIdToken());
    return { access_token: await cred.user.getIdToken(), user: cred.user };
  } catch (error) {
    if (error?.code === "auth/multi-factor-auth-required") {
      return { mfa_required: true, mfa_session_token: error, resolver: getMultiFactorResolver(auth(), error) };
    }
    throw error;
  }
}

// Complete an MFA challenge. `result` is `{ resolver }` / mfa session. `code`. `method` 'totp'|'sms'.
export async function continueMfa(result, _returnTo, code, method = "totp") {
  const resolver = result?.resolver || (result?.code === "auth/multi-factor-auth-required" ? getMultiFactorResolver(auth(), result) : null);
  if (!resolver) return { ok: true };
  let assertion;
  if (method === "sms") {
    const hint = resolver.hints?.find((h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID) || resolver.hints?.[0];
    const provider = new PhoneAuthProvider(auth());
    const verificationId = await provider.verifyPhoneNumber({ multiFactorHint: hint, session: resolver.session }, new RecaptchaVerifier(auth(), "recaptcha", {}));
    assertion = PhoneMultiFactorGenerator.assertion(verificationId, code);
  } else {
    const hint = resolver.hints?.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID) || resolver.hints?.[0];
    assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
  }
  const cred = await resolver.resolveSignIn(assertion);
  await base44.auth.setToken(await cred.user.getIdToken());
  return { access_token: await cred.user.getIdToken(), user: cred.user };
}

// Enroll TOTP factor for current user (original Firebase MFA). Returns secret; caller shows QR; confirm with confirmAuthenticator.
export async function startTotpEnrollment() {
  const u = auth().currentUser;
  const session = await multiFactor(u).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  return { secret, qrCodeUrl: secret.generateQrCodeUrl(u.email, "GoldenCares") };
}

export async function confirmTotpEnrollment(code, secret) {
  const u = auth().currentUser;
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
  await multiFactor(u).enroll(assertion, "Authenticator");
  return { ok: true };
}
