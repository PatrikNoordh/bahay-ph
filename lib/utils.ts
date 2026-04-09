/**
 * Format a price in Philippine Peso.
 * Uses en-PH locale — always ₱ with comma separators.
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
}

/**
 * Build a WhatsApp deep-link for an agent contact CTA.
 * Strips leading 0 from the phone number and prefixes with 63 (PH country code).
 */
export function buildWhatsAppUrl(phone: string, propertyTitle: string): string {
  const normalized = phone.replace(/^\+?0?/, "");
  const message = encodeURIComponent(
    `Hi, I'm interested in ${propertyTitle} on Bahay.ph`
  );
  return `https://wa.me/63${normalized}?text=${message}`;
}

/**
 * Return a short display label for a city in Metro Cebu.
 */
export function shortCity(city: string): string {
  const map: Record<string, string> = {
    "Cebu City": "Cebu City",
    "Lapu-Lapu City": "Lapu-Lapu",
    "Mandaue City": "Mandaue",
    "Cordova": "Cordova",
    "Mactan Island": "Mactan",
    "Talisay City": "Talisay",
  };
  return map[city] ?? city;
}
