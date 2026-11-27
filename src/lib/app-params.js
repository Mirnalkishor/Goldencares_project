// App params (sync, like original). appId = Firebase project id (was VITE_BASE44_APP_ID).
const isBrowser = typeof window !== "undefined";

const isClearAccessTokenRequested = () =>
  isBrowser && new URLSearchParams(window.location.search).get("clear_access_token") === "true";

const clearStoredAccessToken = () => {
  window.localStorage.removeItem("base44_access_token");
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("firebase_token");
};

const storedToken = () => {
  if (!isBrowser) return null;
  return window.localStorage.getItem("firebase_token") || window.localStorage.getItem("base44_access_token") || window.localStorage.getItem("token") || null;
};

export function getAppParams() {
  if (isClearAccessTokenRequested()) clearStoredAccessToken();
  return {
    appId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_BASE44_APP_ID || "golden-care-d4863",
    token: storedToken(),
    functionsVersion: (isBrowser && new URLSearchParams(window.location.search).get("functions_version")?.trim()) || import.meta.env.VITE_FUNCTIONS_VERSION || import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
    appBaseUrl: import.meta.env.VITE_APP_BASE_URL || import.meta.env.VITE_BASE44_APP_BASE_URL || "",
  };
}
