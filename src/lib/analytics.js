// Analytics wiring: GA4 through the Firebase web SDK (already configured for this project) and
// Microsoft Clarity for session heatmaps/recordings. Both are client-only; SSR renders no trackers.
import { logEvent } from "firebase/analytics";
import { analytics } from "@/api/firebaseClient";

const env = (key, fallback) => {
  const value = import.meta.env?.[key];
  return value === undefined || value === null || value === "" ? fallback : value;
};

export const CLARITY_PROJECT_ID = env("VITE_CLARITY_PROJECT_ID", "zkgmc21gyu");

// Clarity's standard snippet, injected once in <head> so it captures the first page view.
export function claritySnippet() {
  return `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", ${JSON.stringify(CLARITY_PROJECT_ID)});`;
}

export async function trackEvent(name, params = {}) {
  if (typeof window === "undefined") return;
  try {
    const instance = await analytics();
    if (instance) logEvent(instance, name, params);
  } catch {
    // Analytics must never break the app.
  }
}

export function trackPageView(path) {
  return trackEvent("page_view", {
    page_path: path,
    page_location: typeof window === "undefined" ? undefined : window.location.href,
    page_title: typeof document === "undefined" ? undefined : document.title,
  });
}
