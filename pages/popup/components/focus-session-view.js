/**
 * Format countdown seconds for the Focus timer.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatFocusCountdown(totalSeconds) {
  const remainingSeconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
