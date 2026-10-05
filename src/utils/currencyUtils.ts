export function formatINR(amountInr: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountInr);
}

export function formatINRShort(amountInr: number): string {
  if (amountInr >= 100000) return `₹${(amountInr / 100000).toFixed(1)}L`;
  if (amountInr >= 1000) return `₹${(amountInr / 1000).toFixed(1)}k`;
  return `₹${amountInr}`;
}

/**
 * Cheapest amount a learner has to pay up front.
 *
 * Installment plans carry a null `installmentAmountInr` until the backend
 * computes it, and a course may have no plans at all - neither case may
 * render as NaN or Infinity to a user.
 */
export function lowestEntryAmount(plans: { priceInr: number; installmentAmountInr: number | null }[]): number {
  const candidates = plans.flatMap((p) => [p.installmentAmountInr, p.priceInr]).filter(
    (amount): amount is number => typeof amount === 'number' && amount > 0,
  );
  return candidates.length ? Math.min(...candidates) : 0;
}
