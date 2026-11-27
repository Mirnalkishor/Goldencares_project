// Temporary product switch. Set to true to bring cash on delivery back; every
// booking surface reads this constant so the wizard, summary and validation
// cannot disagree.
export const COD_ENABLED = false;

export function isPaymentMethodAvailable(method) {
  return method === "online" || (COD_ENABLED && method === "cod");
}
