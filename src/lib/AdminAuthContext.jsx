import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb, getAuthClient } from "@/api/firebaseClient";
import {
  adminCall,
  adminErrorMessage,
  clearAdminSession,
  getAdminSession,
  refreshAdminToken,
  setAdminSession,
} from "@/lib/adminAuth";

const AdminAuthContext = createContext(null);
const EMPTY_STATE = {
  loading: true,
  user: null,
  authz: null,
  session: null,
  requiresPasswordChange: false,
  error: "",
  reason: "",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSessionClaim(expectedSessionId) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const user = getAuthClient().currentUser;
    if (!user) return;
    const result = await user.getIdTokenResult(attempt === 0);
    if (result.claims?.adminSessionId === expectedSessionId) return;
    await delay(400);
  }
}

function readReason() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("reason") || "";
}

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ ...EMPTY_STATE, reason: readReason() });
  const signInInFlightRef = useRef(false);

  const loadAuthz = useCallback(async (user) => {
    const authz = await adminCall("adminGetAdminAuthz", { forceRefresh: true });
    if (!user) return null;
    setState((current) => ({
      ...current,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || authz.email || user.email,
      },
      session: getAdminSession(),
      authz,
      requiresPasswordChange: authz.requiresPasswordChange === true,
      error: "",
    }));
    return authz;
  }, []);

  useEffect(() => {
    const auth = getAuthClient();
    return onAuthStateChanged(auth, async (user) => {
      // signIn() registers the admin session after Firebase Auth fires; let it
      // own the state update so the guard does not sign the user out mid-login.
      if (signInInFlightRef.current) return;
      if (!user) {
        clearAdminSession();
        setState({ ...EMPTY_STATE, loading: false });
        return;
      }
      try {
        await loadAuthz(user);
      } catch (error) {
        if (isUnauthorized(error)) {
          // A signed-in family/caregiver account has no admin role. Do not end
          // their consumer session — just treat the admin console as signed out.
          clearAdminSession();
          setState({ ...EMPTY_STATE, loading: false, error: adminErrorMessage(error) });
          return;
        }
        setState((current) => ({
          ...current,
          loading: false,
          user: { uid: user.uid, email: user.email, displayName: user.displayName || user.email },
          error: adminErrorMessage(error),
        }));
      } finally {
        setState((current) => ({ ...current, loading: false }));
      }
    });
  }, [loadAuthz]);

  // Cross-device supersede and 8-hour expiry watcher.
  useEffect(() => {
    const email = state.user?.email;
    const sessionId = state.session?.sessionId;
    if (!email || !sessionId) return undefined;

    let active = true;
    const sessionRef = doc(getDb(), "admin_sessions", email.trim().toLowerCase());
    const unsubscribe = onSnapshot(
      sessionRef,
      (snap) => {
        if (!active || !snap.exists()) return;
        const remoteId = snap.data()?.sessionId;
        if (remoteId && remoteId !== sessionId) {
          forceSignOut("superseded");
        }
      },
      () => {
        // A transient rules/network error must not sign the admin out.
      },
    );

    const timer = window.setInterval(() => {
      const expiresAt = getAdminSession()?.expiresAtMillis;
      if (expiresAt && Date.now() > Number(expiresAt)) forceSignOut("expired");
    }, 60_000);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [state.user?.email, state.session?.sessionId]);

  async function forceSignOut(reason) {
    clearAdminSession();
    await firebaseSignOut(getAuthClient()).catch(() => {});
    setState({ ...EMPTY_STATE, loading: false, reason });
    if (typeof window !== "undefined") {
      window.location.assign(`/admin/login?reason=${encodeURIComponent(reason)}`);
    }
  }

  async function signIn(email, password) {
    signInInFlightRef.current = true;
    clearAdminSession();
    setState((current) => ({ ...current, error: "", loading: true }));
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(getAuthClient(), normalizedEmail, password);
      await refreshAdminToken(true);
      const result = await adminCall(
        "adminRegisterSession",
        { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "" },
        { skipRetry: true },
      );
      const session = {
        sessionId: result.sessionId,
        expiresAtMillis: result.expiresAtMillis,
        email: normalizedEmail,
      };
      setAdminSession(session);
      await waitForSessionClaim(result.sessionId);
      const authz = await adminCall("adminGetAdminAuthz", { forceRefresh: true });
      setState((current) => ({
        ...current,
        loading: false,
        user: {
          uid: getAuthClient().currentUser?.uid,
          email: normalizedEmail,
          displayName: normalizedEmail,
        },
        authz,
        session,
        requiresPasswordChange: authz.requiresPasswordChange === true,
        error: "",
      }));
      return authz;
    } catch (error) {
      clearAdminSession();
      await firebaseSignOut(getAuthClient()).catch(() => {});
      setState((current) => ({ ...current, loading: false, error: adminErrorMessage(error) }));
      throw error;
    } finally {
      signInInFlightRef.current = false;
    }
  }

  async function changePassword(newPassword) {
    const result = await adminCall("adminSetInitialPassword", { newPassword });
    await refreshAdminToken(true);
    await loadAuthz(getAuthClient().currentUser);
    return result;
  }

  async function refresh() {
    const user = getAuthClient().currentUser;
    if (!user) return null;
    try {
      return await loadAuthz(user);
    } catch (error) {
      setState((current) => ({ ...current, error: adminErrorMessage(error) }));
      throw error;
    }
  }

  async function signOut() {
    clearAdminSession();
    await firebaseSignOut(getAuthClient()).catch(() => {});
    setState({ ...EMPTY_STATE, loading: false });
  }

  const value = useMemo(
    () => ({
      ...state,
      session: state.session ?? getAdminSession(),
      signIn,
      signOut,
      changePassword,
      refresh,
      forceSignOut,
    }),
    [state, signIn, signOut, changePassword, refresh],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

function isUnauthorized(error) {
  return error?.code === "unauthenticated" || error?.code === "permission-denied";
}

export function useAdmin() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminAuthProvider>");
  return ctx;
}
