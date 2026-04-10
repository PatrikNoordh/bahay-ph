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
 * Build a tel: deep-link for the native phone dialler.
 * Normalises PH numbers: strips spaces/dashes, removes leading 0, prefixes +63.
 * Handles numbers already prefixed with +63 or 63 to avoid double-prefixing.
 */
export function buildPhoneUrl(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // Remove leading country code if already present (63...), then strip leading 0
  const local = digits.replace(/^63/, "").replace(/^0/, "");
  return `tel:+63${local}`;
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
