// `base44`-compatible API shim, now backed by FIREBASE (not Base44).
// Keeps `realf` UI calls working: base44.entities.*, base44.auth.*, base44.functions, base44.asServiceRole, base44.mcp.
// Backend = original Golden-Cares-App Firebase project golden-care-d4863 / production-mumbai / asia-south1.
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  reload,
  getIdToken,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseApp, getDb, auth as getAuthClient, functions as getFunctionsClient, callFunction } from "@/api/firebaseClient";

const toMillis = (v) => (v instanceof Timestamp ? v.toMillis() : v);
function serialize(value) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

function docToEntity(snap) {
  if (!snap.exists()) return null;
  const data = serialize(snap.data());
  return { id: snap.id, ...data };
}

// ---- entity store (Firestore) ----------------------------------------------
function entityStore(collectionName) {
  const col = () => collection(getDb(), collectionName);
  return {
    async create(data) {
      const payload = { ...data, created_date: serverTimestamp(), updated_date: serverTimestamp() };
      // Original app queries/sorts bookings on `createdAt`; keep it a real
      // server timestamp so it sorts consistently with existing Flutter bookings.
      if (collectionName === "bookings" && payload.createdAt === undefined) {
        payload.createdAt = serverTimestamp();
      }
      // Base44 uses `id`; Firestore uses doc id. Allow explicit id.
      if (payload.id) {
        const id = String(payload.id);
        delete payload.id;
        const ref = doc(col(), id);
        await setDoc(ref, payload);
        return docToEntity(await getDoc(ref));
      }
      const ref = await addDoc(col(), payload);
      return docToEntity(await getDoc(ref));
    },
    async get(id) {
      const snap = await getDoc(doc(col(), String(id)));
      if (!snap.exists()) {
        const err = new Error("Not found");
        err.status = 404;
        throw err;
      }
      return docToEntity(snap);
    },
    async filter(queryObj = {}, opts = {}) {
      const clauses = [];
      for (const [k, v] of Object.entries(queryObj || {})) {
        if (v === undefined) continue;
        clauses.push(where(k, "==", v));
      }
      let sortField;
      let sortDir = "asc";
      const sort = opts.sort;
      if (sort) {
        if (sort.startsWith("-")) { sortField = sort.slice(1); sortDir = "desc"; }
        else if (sort.startsWith("+")) { sortField = sort.slice(1); sortDir = "asc"; }
        else { sortField = sort; sortDir = opts.sortDir || opts.order || "asc"; }
      }
      let q = query(col(), ...clauses);
      if (sortField) q = query(q, orderBy(sortField, sortDir));
      const lim = opts.limit ?? opts.pageSize;
      if (lim) q = query(q, fbLimit(lim));
      if (opts.cursor || opts.next_cursor) {
        // Cursor pagination is app-level; `next_cursor` returned for parity. (Firestore startAfter needs a snapshot.)
      }
      const snap = await getDocs(q);
      const items = snap.docs.map(docToEntity);
      return { items, next_cursor: null, has_more: false };
    },
    async list(opts = {}) { return this.filter({}, opts); },
    async update(id, data) {
      const ref = doc(col(), String(id));
      await updateDoc(ref, { ...data, updated_date: serverTimestamp() });
      return docToEntity(await getDoc(ref));
    },
    async delete(id) { await deleteDoc(doc(col(), String(id))); return { ok: true }; },
    async findOne(queryObj = {}) { const { items } = await this.filter(queryObj, { limit: 1 }); return items[0] ?? null; },
  };
}

// Original `realf`/Base44 names kept as API aliases, but mapped to ORIGINAL
// `Golden-Cares-App` FIREBASE PRODUCTION collections in `golden-care-d4863`/`production-mumbai`.
const ENTITIES = ["BookingRequest", "CaregiverApplication", "User", "PaymentAttempt"];
const COLLECTION_MAP = {
  BookingRequest: "bookings",          // original `bookings` (was Base44 `BookingRequest`)
  CaregiverApplication: "servicePersonnel", // original `servicePersonnel` (was Base44 `CaregiverApplication`)
  User: "users",                       // original `users`
  PaymentAttempt: "transactions",      // original `transactions`; PayU placeholder (not verified)
};
function makeEntities() {
  const store = {};
  for (const name of ENTITIES) store[name] = entityStore(COLLECTION_MAP[name] || name);
  // Proxy for any other Firestore collection (original Golden-Cares-App has many).
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === "string") { target[prop] = entityStore(prop); return target[prop]; }
      return undefined;
    },
  });
}

// ---- auth (Firebase Auth) --------------------------------------------------
const authApi = {
  async me() {
    const a = getAuthClient();
    const u = a.currentUser;
    if (!u) { const err = new Error("Unauthorized"); err.status = 401; throw err; }
    await reload(u).catch(() => {});
    const tokenResult = await u.getIdTokenResult().catch(() => null);
    const claims = tokenResult?.claims || {};
    // Role is stored on users/{uid}, not in the ID token for existing accounts.
    // The Firestore doc is the UI source of truth; server rules still enforce it.
    const profileSnap = await getDoc(doc(getDb(), "users", u.uid)).catch(() => null);
    const profile = profileSnap?.exists() ? profileSnap.data() : null;
    const displayName = u.displayName || profile?.name || profile?.full_name || null;
    return {
      ...claims,
      id: u.uid,
      uid: u.uid,
      email: u.email,
      full_name: displayName,
      name: displayName,
      photo_url: u.photoURL,
      email_verified: u.emailVerified,
      provider: u.providerData?.[0]?.providerId,
      isApproved: profile?.isApproved ?? claims.isApproved,
      verificationStatus: profile?.verificationStatus,
      role: claims.role === "admin" ? "admin" : (profile?.role || claims.role || "family"),
    };
  },
  hasToken() {
    const a = getAuthClient();
    if (a.currentUser) return true;
    // Firebase session restores async; cached token may still exist.
    try { return Boolean(a.currentUser || window.localStorage.getItem("firebase_token")); } catch { return Boolean(a.currentUser); }
  },
  async setToken(token) { /* Firebase uses its own session; token kept for parity. */ return { ok: true, token: token ?? null }; },
  async register({ email, password, full_name, name } = {}) {
    const cred = await createUserWithEmailAndPassword(getAuthClient(), email, password);
    if (full_name || name) await updateProfile(cred.user, { displayName: full_name || name }).catch(() => {});
    await sendEmailVerification(cred.user).catch(() => {});
    return { user: cred.user, needsVerification: true };
  },
  async loginWithProvider(provider = "google", _opts = {}) {
    const a = getAuthClient();
    if (provider === "google") { const p = new GoogleAuthProvider(); return signInWithPopup(a, p); }
    return signInWithRedirect(a, new GoogleAuthProvider());
  },
  async loginWithEmail(email, password) { return signInWithEmailAndPassword(getAuthClient(), email, password); },
  async logout() { await signOut(getAuthClient()); return { ok: true }; },
  redirectToLogin(returnTo) {
    if (typeof window !== "undefined") {
      const r = returnTo || window.location.pathname + window.location.search;
      window.location.href = "/login?returnTo=" + encodeURIComponent(r);
    }
  },
  async resetPasswordRequest(email) { await sendPasswordResetEmail(getAuthClient(), email); return { ok: true }; },
  async resetPassword({ email, token, code, newPassword, password } = {}) {
    await confirmPasswordReset(getAuthClient(), token || code, newPassword || password);
    return { ok: true };
  },
  async verifyOtp(arg = {}) {
    const code = arg.code || arg.otp || arg.token;
    if (code) await applyActionCode(getAuthClient(), code).catch(() => {});
    return { ok: true };
  },
  async resendOtp() { const u = getAuthClient().currentUser; if (u) await sendEmailVerification(u); return { ok: true }; },
  async changePassword(_email, _old, newPassword) { await updatePassword(getAuthClient().currentUser, newPassword); return { ok: true }; },
};

// ---- base44-compatible export ----------------------------------------------
const entities = makeEntities();
export const base44 = {
  appId: "golden-care-d4863",
  entities,
  auth: authApi,
  functions: { invoke: (name, data) => httpsCallable(getFunctionsClient(), name)(data ?? {}).then((r) => r.data), callFn: callFunction },
  callFn: callFunction,
  asServiceRole: { entities, auth: authApi, functions: { invoke: (name, data) => httpsCallable(getFunctionsClient(), name)(data ?? {}).then((r) => r.data) } },
  // Base44 MCP consent — no Firebase equivalent; placeholder so ConsentPage renders.
  mcp: {
    async getConsentInfo() { return { tools: [], data: [], agents: [], actions: [] }; },
    async respondToConsent() { return { ok: true }; },
  },
  getApp: getFirebaseApp,
};

// token helper (replaces @base44/sdk getAccessToken)
export async function getAccessToken() {
  const u = getAuthClient().currentUser;
  if (!u) return null;
  try { return await getIdToken(u); } catch { return null; }
}
export default base44;
