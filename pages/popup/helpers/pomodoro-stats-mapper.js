/**
 * Normalize the focus stats payload before rendering.
 * @param {object} stats
 * @returns {object}
 */
export function normalizePomodoroStats(stats = {}) {
  const selectedDay = stats.selectedDay || {};

  return {
    ...stats,
    selectedDay: {
      ...selectedDay,
      sessions: Array.isArray(selectedDay.sessions) ? selectedDay.sessions : []
    },
    last7Days: Array.isArray(stats.last7Days) ? stats.last7Days : []
  };
}
