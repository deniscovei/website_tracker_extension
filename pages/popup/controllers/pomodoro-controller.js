/**
 * Test whether a Pomodoro state is actively running.
 * @param {object} pomodoro
 * @returns {boolean}
 */
export function isPomodoroActive(pomodoro) {
  return Boolean(pomodoro?.active && Number(pomodoro.until) > Date.now());
}
