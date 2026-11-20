export const VISIT_PRICES_INR = Object.freeze({
  1: 299,
  2: 399,
  3: 599,
});

const encoder = new TextEncoder();

export function getVisitPriceInr(durationHours) {
  return VISIT_PRICES_INR[Number(durationHours)] ?? null;
}

export function createPaymentToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha512(value) {
  const digest = await crypto.subtle.digest("SHA-512", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPaymentToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createPayuRequestHash(params, salt) {
  const udf = Array.from({ length: 5 }, (_, index) => params[`udf${index + 1}`] || "");
  const hashString = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    ...udf,
  ].join("|") + `||||||${salt}`;
  return sha512(hashString);
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyPayuResponseHash(params, salt) {
  if (!/^[\da-f]{128}$/i.test(params.hash || "")) return false;
  const hashString = [
    salt,
    params.status || "",
    "",
    "",
    "",
    "",
    "",
    params.udf5 || "",
    params.udf4 || "",
    params.udf3 || "",
    params.udf2 || "",
    params.udf1 || "",
    params.email || "",
    params.firstname || "",
    params.productinfo || "",
    params.amount || "",
    params.txnid || "",
    params.key || "",
  ].join("|");
  return constantTimeEqual(await sha512(hashString), params.hash.toLowerCase());
}

export function amountInPaise(amount) {
  if (typeof amount !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(amount)) return null;
  const [rupees, fraction = ""] = amount.split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}
