import { addDays, dateToDayKey } from "./utils/dates.js";

const DEMO_DOMAINS = ["instagram.com", "youtube.com", "reddit.com", "x.com"];

/**
 * Create a read-only demo dataset for screenshots and store assets.
 * @returns {object}
 */
export function createDemoPopupData() {
  const today = new Date();
  const todayKey = dateToDayKey(today);
  const last7Days = createDemoLast7Days(today);

  return {
    schedule: {
      timezone: "local",
      sites: [
        {
          domain: "instagram.com",
          blockMode: "always",
          dailyAllowanceMinutes: 0,
          allowExtraTime: true,
          requirePinForExtraTime: false,
          intervals: [{ start: "00:00", end: "00:00" }]
        },
        {
          domain: "youtube.com",
          blockMode: "slots",
          dailyAllowanceMinutes: 20,
          allowExtraTime: true,
          requirePinForExtraTime: true,
          intervals: [
            { start: "08:30", end: "11:30", days: ["mon", "tue", "wed", "thu", "fri"] },
            { start: "14:00", end: "17:00", days: ["mon", "tue", "wed", "thu", "fri"] },
            { start: "21:30", end: "23:30", days: ["sun", "mon", "tue", "wed", "thu"] }
          ]
        },
        {
          domain: "reddit.com",
          blockMode: "always",
          dailyAllowanceMinutes: 0,
          allowExtraTime: false,
          requirePinForExtraTime: false,
          intervals: [{ start: "00:00", end: "00:00" }]
        },
        {
          domain: "x.com",
          blockMode: "slots",
          dailyAllowanceMinutes: 10,
          allowExtraTime: true,
          requirePinForExtraTime: false,
          intervals: [
            { start: "09:00", end: "12:00", days: ["mon", "tue", "wed", "thu", "fri"] },
            { start: "15:00", end: "18:00", days: ["mon", "tue", "wed", "thu", "fri"] }
          ]
        }
      ]
    },
    settings: {
      hasPin: true,
      requirePinForAllExtraTime: true,
      allowExtraTimeForAll: true,
      pinValue: "1234"
    },
    state: {
      activeSites: [
        { domains: ["instagram.com"] },
        { domains: ["reddit.com"] }
      ],
      siteUsage: [
        { domain: "instagram.com", extraRemainingSeconds: 11 * 60 },
        { domain: "youtube.com", extraRemainingSeconds: 0 },
        { domain: "reddit.com", extraRemainingSeconds: 0 },
        { domain: "x.com", extraRemainingSeconds: 5 * 60 }
      ],
      pomodoro: {
        active: false,
        until: 0,
        mode: "standard",
        whitelist: []
      },
      lastUpdated: Date.now()
    },
    usage: createDemoUsage(today),
    pomodoro: {
      active: false,
      until: 0,
      mode: "standard",
      whitelist: ["docs.google.com", "github.com"]
    },
    pomodoroStats: createDemoPomodoroStats(todayKey, last7Days)
  };
}

/**
 * Return demo Focus stats for the selected date.
 * @param {string} date
 * @returns {object}
 */
export function getDemoPomodoroStats(date = dateToDayKey(new Date())) {
  const today = new Date();
  const last7Days = createDemoLast7Days(today);
  return createDemoPomodoroStats(date, last7Days);
}

function createDemoLast7Days(today) {
  const minutes = [16, 42, 0, 25, 64, 38, 12];

  return minutes.map((minute, index) => {
    const date = dateToDayKey(addDays(today, index - 6));

    return {
      date,
      totalSeconds: minute * 60,
      sessionCount: minute > 0 ? Math.max(1, Math.round(minute / 24)) : 0,
      completedCount: minute > 20 ? 1 : 0
    };
  });
}

function createDemoPomodoroStats(selectedDate, last7Days) {
  const todayKey = dateToDayKey(new Date());
  const selected = last7Days.find((day) => day.date === selectedDate);
  const selectedSeconds = selected ? selected.totalSeconds : 0;
  const isToday = selectedDate === todayKey;
  const sessions = isToday
    ? createDemoSessions(selectedDate)
    : createSyntheticSessions(selectedDate, selectedSeconds);
  const completedCount = sessions.filter((session) => session.completed).length;

  return {
    date: selectedDate,
    selectedDay: {
      totalSeconds: sessions.reduce((sum, session) => sum + session.elapsedSeconds, 0),
      sessionCount: sessions.length,
      completedCount,
      stoppedCount: sessions.length - completedCount,
      completionRate: sessions.length > 0 ? Math.round(completedCount / sessions.length * 100) : 0,
      sessions
    },
    today: {
      date: todayKey,
      totalSeconds: 52 * 60
    },
    last7Days,
    streakDays: 4,
    totalSessions: 23
  };
}

function createDemoSessions(date) {
  const base = new Date(`${date}T00:00:00`);

  return [
    createSession(base, 8, 30, 25, true, "standard"),
    createSession(base, 12, 10, 11, false, "strict"),
    createSession(base, 16, 0, 25, true, "standard")
  ];
}

function createSyntheticSessions(date, totalSeconds) {
  if (totalSeconds <= 0) {
    return [];
  }

  const base = new Date(`${date}T00:00:00`);
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return [createSession(base, 10, 0, minutes, minutes >= 20, "standard")];
}

function createSession(base, hour, minute, durationMinutes, completed, mode) {
  const startedAt = new Date(base);
  startedAt.setHours(hour, minute, 0, 0);
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  return {
    id: `${startedAt.getTime()}-${endedAt.getTime()}-${mode}`,
    date: dateToDayKey(startedAt),
    startedAt: startedAt.getTime(),
    endedAt: endedAt.getTime(),
    plannedSeconds: 25 * 60,
    elapsedSeconds: durationMinutes * 60,
    completed,
    mode,
    whitelistCount: mode === "strict" ? 2 : 0
  };
}

function createDemoUsage(today) {
  const days = Array.from({ length: 14 }, (_item, index) => dateToDayKey(addDays(today, index - 13))).reverse();
  const usageByDay = {};

  days.forEach((day, dayIndex) => {
    usageByDay[day] = {
      date: day,
      sites: Object.fromEntries(DEMO_DOMAINS.map((domain, domainIndex) => {
        const baseMinutes = [34, 48, 21, 16][domainIndex];
        const screenSeconds = Math.max(0, (baseMinutes + (dayIndex % 5 - 2) * 4) * 60);
        const hourlySeconds = Array.from({ length: 24 }, (_unused, hour) => {
          if (hour < 8 || hour > 22) {
            return 0;
          }

          const weight = hour === 12 || hour === 16 ? 0.18 : 0.05;
          return Math.round(screenSeconds * weight / 2);
        });

        return [domain, { screenSeconds, hourlySeconds }];
      }))
    };
  });

  return {
    days,
    usageByDay
  };
}
