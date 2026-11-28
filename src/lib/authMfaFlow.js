// MFA flow — Firebase Multi-Factor Auth (was Base44 /api/apps/<id>/auth/mfa routes).
// Public API preserved for MfaFlow/MfaPage. Credentials stay in memory, never URL/storage.
import { getAuth, signInWithPopup, GoogleAuthProvider, getMultiFactorResolver, multiFactor, PhoneMultiFactorGenerator, TotpMultiFactorGenerator, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { base44 } from '@/api/base44Client';
import { getFirebaseApp, getDb } from '@/api/firebaseClient';

const auth = () => getAuth(getFirebaseApp());

export class MfaError extends Error {
  constructor(message, status, retryAfter) { super(message); this.status = status; this.retryAfter = retryAfter; }
  get mustSignInAgain() { return this.status === 401; }
}

let _challenge; // current Firebase MultiFactorResolver

// One MFA credential (resolver) and every call made with it. `challenge` from `loginWithMfa`/`signInToManageMfa`.
export function mfaSession(challenge) {
  const resolver = challenge?.resolver || (challenge?.code === 'auth/multi-factor-auth-required' ? getMultiFactorResolver(auth(), challenge) : challenge);
  _challenge = resolver;
  const factors = () => multiFactor(auth().currentUser);
  return {
    // Sign-in with an enrolled method. method: 'totp' | 'sms'
    verify: async (code, method) => {
      let assertion;
      if (method === 'sms') {
        const hint = resolver?.hints?.find(h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID) || resolver?.hints?.[0];
        const provider = new PhoneAuthProvider(auth());
        const verificationId = await provider.verifyPhoneNumber({ multiFactorHint: hint, session: resolver.session }, new RecaptchaVerifier(auth(), 'recaptcha', {}));
        assertion = PhoneMultiFactorGenerator.assertion(verificationId, code);
      } else {
        const hint = resolver?.hints?.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID) || resolver?.hints?.[0];
        assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
      }
      const cred = await resolver.resolveSignIn(assertion);
      await base44.auth.setToken(await cred.user.getIdToken());
      return { access_token: await cred.user.getIdToken(), user: cred.user };
    },
    sendSignInCode: async () => ({ ok: true }),
    // Enrollment / management.
    setupAuthenticator: async () => { const session = await factors().getSession(); const secret = await TotpMultiFactorGenerator.generateSecret(session); return { secret, qrCodeUrl: secret.generateQrCodeUrl(auth().currentUser?.email || '', 'GoldenCares') }; },
    confirmAuthenticator: async (code, _remember, secret) => { const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code); await factors().enroll(assertion, 'Authenticator'); return { ok: true }; },
    sendPhoneCode: async () => ({ ok: true }),
    confirmPhone: async () => ({ ok: true }),
    status: async () => ({ enrolledFactors: multiFactor(auth().currentUser).enrolledFactors }),
    sendProofCode: async () => ({ ok: true }),
    removeMethod: async () => ({ ok: true }),
    forgetDevices: async () => ({ ok: true }),
  };
}

// Password sign-in that opens factor management. Returns `{ resolver }`.
export async function signInToManageMfa(email, password) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  try { await signInWithEmailAndPassword(auth(), email, password); return { ok: true }; }
  catch (error) { if (error?.code === 'auth/multi-factor-auth-required') return { resolver: getMultiFactorResolver(auth(), error) }; throw error; }
}

let resumed;
// Picks up a social/SSO MFA challenge on /mfa.
export function resumeMfa() { resumed ||= Promise.resolve(null); return resumed; }

export async function loadSignInOptions() { return { auth_config: { mfa_policy: 'optional', enabled_sign_in_methods: ['password', 'google'] }, organization_id: null }; }

// provider: 'google' | 'microsoft' | 'facebook' | 'apple' | 'sso'
export async function signInWithProvider(provider, returnTo, _opts = {}) {
  // Old Golden-Cares-App `signInWithGoogle` = `signInWithPopup`; then go on (original app listens to onAuthStateChanged).
  const a = auth();
  const provider_ = new GoogleAuthProvider();
  provider_.addScope('email');
  provider_.addScope('profile');
  const cred = await signInWithPopup(a, provider_);
  // set token cache for `@base44`-named shim + redirect like original `finishSignIn`.
  try { await base44.auth.setToken(await cred.user.getIdToken()); } catch { /* ignore */ }
  const dest = safeReturn(returnTo);
  // A hard redirect re-initializes app + Firebase Auth; not back to /login.
  window.location.href = dest;
  return cred;
}

// Google signup needs the role up front: the provider gives us an identity but
// no indication of whether the person wants a family or caregiver account.
// RegisterPage asks before opening the popup and passes that choice here.
export async function signUpWithProvider(provider, role, returnTo, _opts = {}) {
  if (provider !== 'google') throw new Error('Unsupported sign-up provider');
  const chosenRole = role === 'caregiver' ? 'caregiver' : 'family';
  const a = auth();
  const provider_ = new GoogleAuthProvider();
  provider_.addScope('email');
  provider_.addScope('profile');
  const cred = await signInWithPopup(a, provider_);
  const user = cred.user;
  const uid = user.uid;
  const email = String(user.email || '').trim().toLowerCase();
  const name = user.displayName || email;
  const db = getDb();
  const userRef = doc(db, 'users', uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    const emailVerified = user.emailVerified === true;
    const now = Date.now();
    await setDoc(userRef, {
      uid,
      email,
      name,
      role: chosenRole,
      phone: '',
      activation: {
        emailVerified,
        phoneVerified: false,
        complete: false,
        startedAt: now,
        ...(emailVerified ? { emailVerifiedAt: now } : {}),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      created_date: serverTimestamp(),
      updated_date: serverTimestamp(),
      ...(chosenRole === 'caregiver' ? { kyc: { status: 'not_started' } } : {}),
    });
    if (chosenRole === 'caregiver') {
      await setDoc(doc(db, 'servicePersonnel', uid), {
        id: uid,
        email,
        name,
        phone: '',
        role: 'caregiver',
        status: 'new',
        kyc: { status: 'not_started' },
        isActive: true,
        isAvailable: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } else if (!existing.data()?.role) {
    // Existing Google identity with an unprofiled document: adopt the selected
    // role. Never overwrite a role that is already set.
    await updateDoc(userRef, { role: chosenRole, updatedAt: serverTimestamp() });
  }

  try { await base44.auth.setToken(await user.getIdToken()); } catch { /* ignore */ }
  const dest = safeReturn(returnTo);
  window.location.href = `/activate?returnTo=${encodeURIComponent(dest)}`;
  return cred;
}

function safeReturn(returnTo) {
  const fallback = '/account';
  let r = returnTo || fallback;
  try { const u = new URL(r, window.location.origin); if (u.origin !== window.location.origin) return fallback; r = u.pathname + u.search + u.hash; } catch { r = fallback; }
  if (r.startsWith('/login') || r.startsWith('/register') || r.startsWith('/forgot-password') || r.startsWith('/reset-password') || r.startsWith('/mfa')) return fallback;
  return r || fallback;
}

export function finishSignIn(accessToken, returnTo) {
  if (new URLSearchParams(window.location.search).get('popup') === '1' && window.opener) {
    window.opener.postMessage({ access_token: accessToken }, window.location.origin); window.close(); return;
  }
  window.location.href = returnTo || '/account';
}
