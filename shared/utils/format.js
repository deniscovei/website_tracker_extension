/**
 * Format seconds into the compact duration used in the popup.
 * @param {number} value
 * @returns {string}
 */
export function formatDuration(value) {
  const seconds = Math.max(0, Math.round(Number(value) || 0));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

/**
 * Format seconds for very narrow chart labels.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDurationCompact(totalSeconds) {
  const minutes = Math.round((Number(totalSeconds) || 0) / 60);

  if (minutes <= 0) {
    return "0m";
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Format a start/end timestamp pair for session history.
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export function formatTimeRange(start, end) {
  const startDate = new Date(Number(start) || 0);
  const endDate = new Date(Number(end) || 0);

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    return "";
  }

  return `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
