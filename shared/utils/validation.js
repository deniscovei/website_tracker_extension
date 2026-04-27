/**
 * Keep only the first four digits from a PIN-like value.
 * @param {string} value
 * @returns {string}
 */
export function sanitizePinValue(value) {
  return String(value || "").replace(/\D+/g, "").slice(0, 4);
}

/**
 * Basic website domain validation used by editor helpers and docs demos.
 * @param {string} domain
 * @returns {boolean}
 */
export function isValidWebsiteDomain(domain) {
  return domain === "localhost" || /^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/i.test(domain);
}
