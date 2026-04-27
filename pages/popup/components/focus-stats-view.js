import { formatDayLabel, formatShortWeekday } from "../../../shared/utils/dates.js";
import { formatDuration, formatDurationCompact, formatTimeRange } from "../../../shared/utils/format.js";
import { normalizePomodoroStats } from "../helpers/pomodoro-stats-mapper.js";

/**
 * Render the entire Focus statistics panel.
 * @param {object} options
 * @param {object} options.stats
 * @param {string} options.selectedDay
 * @param {object} options.elements
 * @param {(day: string) => void} options.onSelectDay
 */
export function renderFocusStats({ stats, selectedDay, elements, onSelectDay }) {
  const normalizedStats = normalizePomodoroStats(stats);
  const selected = normalizedStats.selectedDay || {};
  const sessions = selected.sessions;
  const last7Days = normalizedStats.last7Days;
  const weekTotalSeconds = last7Days.reduce((sum, day) => sum + Math.max(0, Number(day.totalSeconds) || 0), 0);

  if (elements.dateInput) {
    elements.dateInput.value = normalizedStats.date || selectedDay;
  }

  if (elements.subtitle) {
    elements.subtitle.textContent = formatDayLabel(normalizedStats.date);
  }

  if (elements.total) {
    elements.total.textContent = formatDuration(selected.totalSeconds || 0);
  }

  if (elements.sessions) {
    elements.sessions.textContent = String(selected.sessionCount || 0);
  }

  if (elements.completed) {
    elements.completed.textContent = `${selected.completionRate || 0}%`;
  }

  if (elements.streak) {
    elements.streak.textContent = `${normalizedStats.streakDays || 0}d`;
  }

  if (elements.weekTotal) {
    elements.weekTotal.textContent = formatDuration(weekTotalSeconds);
  }

  renderPomodoroWeekBars({
    container: elements.weekBars,
    days: last7Days,
    selectedDay,
    onSelectDay
  });
  renderPomodoroHistory({
    list: elements.historyList,
    count: elements.historyCount,
    empty: elements.historyEmpty,
    sessions
  });
}

/**
 * Render proportional Focus bars for the last seven days.
 * @param {object} options
 * @param {HTMLElement | null} options.container
 * @param {Array<object>} options.days
 * @param {string} options.selectedDay
 * @param {(day: string) => void} options.onSelectDay
 */
export function renderPomodoroWeekBars({ container, days, selectedDay, onSelectDay }) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  const normalizedDays = Array.isArray(days) ? days : [];
  const maxSeconds = Math.max(
    1,
    ...normalizedDays.map((day) => Math.max(0, Number(day.totalSeconds) || 0))
  );

  normalizedDays.forEach((day) => {
    const totalSeconds = Math.max(0, Number(day.totalSeconds) || 0);
    const button = document.createElement("button");
    const chart = document.createElement("div");
    const track = document.createElement("div");
    const fill = document.createElement("span");
    const label = document.createElement("small");
    const amount = document.createElement("strong");

    button.type = "button";
    button.className = "pomodoro-week-day";
    button.setAttribute("aria-pressed", String(day.date === selectedDay));
    button.title = `${formatDayLabel(day.date)}: ${formatDuration(totalSeconds)}`;
    button.addEventListener("click", () => {
      onSelectDay?.(day.date);
    });

    chart.className = "pomodoro-week-chart";
    track.className = "pomodoro-week-bar-track";
    fill.className = "pomodoro-week-bar-fill";

    const percent = totalSeconds <= 0
      ? 0
      : Math.max(8, Math.round(totalSeconds / maxSeconds * 100));

    fill.style.height = `${percent}%`;
    fill.dataset.zero = totalSeconds <= 0 ? "true" : "false";

    label.textContent = formatShortWeekday(day.date);
    amount.textContent = formatDurationCompact(totalSeconds);

    track.append(fill);
    chart.append(track);
    button.append(chart, label, amount);
    container.append(button);
  });
}

/**
 * Render selected-day Focus session history.
 * @param {object} options
 * @param {HTMLUListElement | null} options.list
 * @param {HTMLElement | null} options.count
 * @param {HTMLElement | null} options.empty
 * @param {Array<object>} options.sessions
 */
export function renderPomodoroHistory({ list, count, empty, sessions }) {
  if (!list || !count || !empty) {
    return;
  }

  list.replaceChildren();
  count.textContent = String(sessions.length);
  empty.hidden = sessions.length > 0;
  empty.textContent = "No focus sessions for this day yet.";

  if (sessions.length === 0) {
    return;
  }

  sessions.forEach((session) => {
    const item = document.createElement("li");
    const main = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const status = document.createElement("span");

    item.className = "pomodoro-history-item";
    main.className = "pomodoro-history-copy";
    title.textContent = `${session.mode === "strict" ? "Strict" : "Standard"} focus`;
    meta.textContent = `${formatTimeRange(session.startedAt, session.endedAt)} · ${formatDuration(session.elapsedSeconds)}`;

    status.className = session.completed ? "session-badge is-completed" : "session-badge is-stopped";
    status.textContent = session.completed ? "Completed" : "Stopped";

    main.append(title, meta);
    item.append(main, status);
    list.append(item);
  });
}
