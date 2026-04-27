/**
 * Convert a local Date object into the extension day-key format.
 * @param {Date} date
 * @returns {string}
 */
export function dateToDayKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

/**
 * Parse a YYYY-MM-DD day key into a local Date.
 * @param {string} day
 * @returns {Date | null}
 */
export function parseDayKey(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Format a day key for compact UI labels.
 * @param {string} day
 * @returns {string}
 */
export function formatDayLabel(day) {
  const todayKey = dateToDayKey(new Date());
  const date = parseDayKey(day);

  if (day === todayKey) {
    return "Today";
  }

  if (!date) {
    return day || "Unknown";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

/**
 * Format only the weekday segment for dense charts.
 * @param {string} day
 * @returns {string}
 */
export function formatShortWeekday(day) {
  const date = parseDayKey(day);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
}

/**
 * Return a new Date offset by whole days.
 * @param {Date} date
 * @param {number} amount
 * @returns {Date}
 */
export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
