import { callFunction, getAuthClient } from "@/api/firebaseClient";

const ADMIN_SESSION_KEY = "goldencares-admin-session";

export function getAdminSession() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(session) {
  try {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // A private browser may block storage; the ID-token claim still carries the session.
  }
}

export function clearAdminSession() {
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function refreshAdminToken(force = true) {
  const user = getAuthClient().currentUser;
  if (!user) throw new Error("Your admin session expired. Please sign in again.");
  await user.getIdToken(force);
  return user.getIdTokenResult(force);
}

const RETRYABLE_CODES = new Set(["unauthenticated", "permission-denied"]);

/**
 * Calls an admin callable with the current single-session id. One forced token
 * refresh is attempted for stale-claim errors, matching the Flutter admin.
 */
export async function adminCall(name, data = {}, options = {}) {
  const sessionId = data.sessionId ?? getAdminSession()?.sessionId ?? undefined;
  const payload = { ...data };
  if (sessionId) payload.sessionId = sessionId;
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await callFunction(name, payload);
      return result.data;
    } catch (error) {
      lastError = error;
      if (options.skipRetry || attempt === 1 || !RETRYABLE_CODES.has(error?.code)) break;
      try {
        await refreshAdminToken(true);
      } catch {
        break;
      }
    }
  }

  throw lastError;
}

export function isSessionError(error) {
  const message = String(error?.message || "");
  return (
    message.includes("SESSION_EXPIRED") ||
    message.includes("SESSION_SUPERSEDED") ||
    error?.code === "unauthenticated"
  );
}

export function adminErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("SESSION_SUPERSEDED")) {
    return "Your account was signed in from another device. Please sign in again.";
  }
  if (message.includes("SESSION_EXPIRED")) {
    return "Your admin session expired. Please sign in again.";
  }
  if (error?.code === "unauthenticated") return "Session expired. Please sign in again.";
  if (error?.code === "permission-denied") return "You do not have permission for this action.";
  if (error?.code === "failed-precondition") return message || "This action is not available right now.";
  return message || "Something went wrong. Please try again.";
}
