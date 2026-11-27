import { RecaptchaVerifier, linkWithPhoneNumber } from "firebase/auth";
import { getAuthClient } from "@/api/firebaseClient";

let activeRecaptcha = null;

/** Legacy accounts have no activation map; those stay usable. */
export function isActivationComplete(user) {
  const state = user?.activation;
  return !state || state.complete === true;
}

export function normalizePhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("91")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

/**
 * Firebase delivers the real SMS OTP. After linking the phone credential the
 * ID token carries `phone_number`, which activationVerifyPhone validates.
 */
export async function beginPhoneLink(phoneNumber, containerId = "activation-recaptcha") {
  const auth = getAuthClient();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in before verifying your mobile number.");
  const element = typeof document !== "undefined" ? document.getElementById(containerId) : null;
  if (!element) throw new Error("Verification widget is not ready. Try again.");
  element.innerHTML = "";
  if (activeRecaptcha) {
    try { activeRecaptcha.clear(); } catch { /* already cleared */ }
  }
  activeRecaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return linkWithPhoneNumber(user, phoneNumber, activeRecaptcha);
}

export async function completePhoneLink(confirmationResult, code) {
  const credential = await confirmationResult.confirm(code);
  // Refresh the token so request.auth.token.phone_number is present server-side.
  await credential.user.getIdToken(true);
  return true;
}
