/**
 * Small site-list boundary for future list rendering extraction.
 * @param {HTMLElement | null} button
 * @param {() => void} handler
 */
export function bindAddWebsiteButton(button, handler) {
  button?.addEventListener("click", handler);
}
