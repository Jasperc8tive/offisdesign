/**
 * Format minor units (e.g. kobo) as currency for display. Mirrors the PriceTag
 * component's logic so server-rendered totals match client.
 */
export function formatMoney(amount: number, currency = 'NGN', locale = 'en-NG'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
