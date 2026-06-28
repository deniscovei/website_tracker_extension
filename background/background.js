const REFRESH_ALARM = "refresh-block-rules";
const REFRESH_MINUTES = 0.5;
const BLOCKED_PAGE = "/pages/blocked/blocked.html";
const SCHEDULE_KEY = "scheduleBlockerSchedule";
const STATE_KEY = "scheduleBlockerState";
const USAGE_KEY = "scheduleBlockerUsage";
const USAGE_HISTORY_KEY = "scheduleBlockerUsageHistory";
const TRACKING_KEY = "scheduleBlockerTracking";
const SCREEN_TRACKING_KEY = "scheduleBlockerScreenTracking";
const SETTINGS_KEY = "websiteTrackerSettings";
const POMODORO_KEY = "scheduleBlockerPomodoro";
const POMODORO_HISTORY_KEY = "scheduleBlockerPomodoroHistory";
const POMODORO_ALARM = "schedule-blocker-pomodoro";
const BLOCK_STATE_UPDATED_MESSAGE = "focus-tracker-block-state-updated";
const MAX_POMODORO_HISTORY_DAYS = 90;
const MAX_POMODORO_HISTORY_ITEMS = 500;
const MAX_USAGE_HISTORY_DAYS = 30;
const MAX_TRACKING_GAP_SECONDS = 2 * 60;
const MAX_EXTRA_TIME_MINUTES = 240;
const LIMIT_WARNING_YELLOW_SECONDS = 5 * 60;
const LIMIT_WARNING_RED_SECONDS = 60;
const DEFAULT_LIMIT_WARNING_POSITION = "top-center";
const DEFAULT_LIMIT_WARNING_AUTO_DISMISS_SECONDS = 3;
const DEFAULT_NIGHT_LIGHT_INTENSITY = 55;
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
let extensionPopupOpenCount = 0;
let cachedSchedule = null;
let cachedSettings = null;
const tabsWithStatePreservingBlocks = new Set();
const tabsWithVisualEffects = new Set();
const tabsWithLimitWarnings = new Set();

const DAY_ALIASES = new Map([
  ["sun", 0],
  ["sunday", 0],
  ["mon", 1],
  ["monday", 1],
  ["tue", 2],
  ["tues", 2],
  ["tuesday", 2],
  ["wed", 3],
  ["wednesday", 3],
  ["thu", 4],
  ["thur", 4],
  ["thurs", 4],
  ["thursday", 4],
  ["fri", 5],
  ["friday", 5],
  ["sat", 6],
  ["saturday", 6]
]);

chrome.runtime.onInstalled.addListener(() => {
  void initialize();
});

chrome.runtime.onStartup.addListener(() => {
  void initialize();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) {
    void tick();
  } else if (alarm.name === POMODORO_ALARM) {
    void stopPomodoro({ completed: true });
  }
});

chrome.tabs.onActivated.addListener(() => {
  void tick({ requireCurrentMatch: false });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    void tick({ requireCurrentMatch: !tab?.active });
  }
});

chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
  const tabId = zoomChangeInfo?.tabId;

  if (typeof tabId === "number" && tabsWithLimitWarnings.has(tabId)) {
    void refreshTabLimitWarning(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabsWithStatePreservingBlocks.delete(tabId);
  tabsWithVisualEffects.delete(tabId);
  tabsWithLimitWarnings.delete(tabId);
});

chrome.windows.onFocusChanged.addListener(() => {
  void tick({ requireCurrentMatch: false });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port?.name !== "focus-tracker-popup") {
    return;
  }

  extensionPopupOpenCount += 1;
  void accrueActiveUsage({ trackCurrent: false, requireCurrentMatch: true });

  port.onDisconnect.addListener(() => {
    extensionPopupOpenCount = Math.max(0, extensionPopupOpenCount - 1);

    if (extensionPopupOpenCount === 0) {
      void tick();
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "get-schedule-data") {
    accrueScreenUsage()
      .then(() => refreshRules())
      .then(() => getScheduleData())
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "save-schedule") {
    accrueScreenUsage()
      .then(() => saveSchedule(message.schedule))
      .then(async (schedule) => {
        const [state, settings] = await Promise.all([
          refreshRulesAndNotify("schedule"),
          loadPublicSettings()
        ]);

        return { schedule, state, settings };
      })
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "save-settings") {
    saveSettings(message.settings)
      .then(async (settings) => {
        let state = null;

        try {
          state = await refreshRulesAndNotify("settings");
        } catch (_error) {
        }

        return { settings, state };
      })
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "refresh-rules") {
    accrueScreenUsage()
      .then(() => refreshRulesAndNotify("refresh"))
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "get-usage-data") {
    accrueScreenUsage()
      .then(() => getUsageData())
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "get-site-status") {
    getSiteStatus(message.domain)
      .then((status) => sendResponse({ ok: true, status }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "validate-pin") {
    loadSettings()
      .then(async (settings) => {
        return {
          configured: Boolean(settings.pinHash),
          valid: await verifyPin(message.pin, settings)
        };
      })
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "add-extra-time") {
    addExtraTime(message.domain, message.minutes, message.pin, _sender?.tab?.id)
      .then(() => refreshRulesAndNotify("extra-time"))
      .then(() => getSiteStatus(message.domain))
      .then((status) => {
        const targetUrl = getResumeTargetUrl(message.targetUrl, message.domain);

        if (status?.isBlocked) {
          throw new Error("Extra time was saved, but this website is still blocked.");
        }

        sendResponse({ ok: true, status, targetUrl });
      })
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "cut-off-site") {
    cutOffSite(message.domain)
      .then(async () => {
        const state = await refreshRulesAndNotify("extra-time");
        await enforceDomainTabsBlock(state, message.domain);
        return state;
      })
      .then(async (state) => {
        const status = await getSiteStatus(message.domain);
        return { state, status };
      })
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "get-pomodoro-state") {
    getPomodoroStateForResponse()
      .then((pomodoro) => sendResponse({ ok: true, pomodoro }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "get-pomodoro-stats") {
    getPomodoroStats(message.date)
      .then((stats) => sendResponse({ ok: true, stats }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "start-pomodoro") {
    startPomodoro(message)
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "stop-pomodoro") {
    stopPomodoro()
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  return false;
});

async function initialize() {
  await chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_MINUTES });
  await restorePomodoroAlarm();
  await cleanupStatePreservingBlocks();
  await refreshRules();
  await syncAllTabVisualEffects({ forceCleanup: true });
  await syncAllTabLimitWarnings({ forceCleanup: true });
}

async function tick({ requireCurrentMatch = true } = {}) {
  try {
    await accrueScreenUsage();
    await accrueActiveUsage({ requireCurrentMatch });
    const state = await refreshRules();
    await enforceActiveTabBlock(state);
  } catch {
  }
}

async function refreshRulesAndNotify(reason = "state") {
  const state = await refreshRules();

  try {
    await enforceActiveTabBlock(state);
  } catch (_error) {
  }

  try {
    await syncAllTabVisualEffects();
  } catch (_error) {
  }

  try {
    await syncAllTabLimitWarnings();
  } catch (_error) {
  }

  await broadcastBlockStateUpdated(reason);
  return state;
}

async function refreshRules() {
  try {
    const [schedule, usage, settings, pomodoro] = await Promise.all([
      loadSchedule(),
      getUsage(),
      loadSettings(),
      loadPomodoroState()
    ]);

    cachedSchedule = schedule;
    cachedSettings = settings;

    const now = getTimeParts(schedule.timezone);
    const activeSites = pomodoro.active && pomodoro.mode === "standard"
      ? getPomodoroStandardSites(schedule, settings)
      : pomodoro.active && pomodoro.mode === "strict"
        ? []
        : getActiveSites(schedule, now, usage, settings);
    const activeExceptionDomains = getExceptionDomains(activeSites);
    const rules = pomodoro.active && pomodoro.mode === "strict"
      ? [createStrictPomodoroRule(pomodoro)]
      : activeSites.map((site, index) => createRedirectRule(index + 1, site, activeExceptionDomains));

    await replaceDynamicRules(rules);

    const state = {
      activeSites,
      error: "",
      lastUpdated: Date.now(),
      pomodoro,
      siteUsage: getSiteUsageStates(schedule, now, usage, settings, pomodoro),
      timezone: schedule.timezone || "local"
    };

    await saveState(state);
    await updateBadge(pomodoro.active ? "F" : activeSites.length);
    return state;
  } catch (error) {
    cachedSchedule = null;
    cachedSettings = null;

    let fallbackPomodoro = normalizePomodoroState();

    try {
      fallbackPomodoro = await loadPomodoroState();
    } catch (_pomodoroError) {
    }

    await replaceDynamicRules([]);
    await saveState({
      activeSites: [],
      error: serializeError(error),
      lastUpdated: Date.now(),
      pomodoro: fallbackPomodoro,
      siteUsage: [],
      timezone: "local"
    });
    await updateBadge(null, true);
    throw error;
  }
}

async function loadSchedule() {
  const stored = await chrome.storage.local.get(SCHEDULE_KEY);

  if (stored[SCHEDULE_KEY]) {
    return stored[SCHEDULE_KEY];
  }

  return {
    timezone: "local",
    sites: []
  };
}

async function getScheduleData() {
  const [schedule, settings, pomodoro, stored] = await Promise.all([
    loadSchedule(),
    loadPublicSettings(),
    loadPomodoroState(),
    chrome.storage.local.get(STATE_KEY)
  ]);
  const state = stored[STATE_KEY] || await refreshRules();

  return {
    pomodoro,
    schedule: normalizeScheduleForStorage(schedule),
    settings,
    state
  };
}

async function saveSchedule(schedule) {
  const normalized = normalizeScheduleForStorage(schedule);
  await chrome.storage.local.set({ [SCHEDULE_KEY]: normalized });
  return normalized;
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettingsForStorage(stored[SETTINGS_KEY]);
}

async function loadPublicSettings() {
  const settings = await loadSettings();
  return publicSettings(settings);
}

async function saveSettings(value = {}) {
  const current = await loadSettings();
  let pinHash = current.pinHash;
  let pinValue = current.pinValue;

  if (value.clearPin) {
    pinHash = "";
    pinValue = "";
  } else if (value.pin) {
    const pin = String(value.pin);

    if (!/^\d{4}$/.test(pin)) {
      throw new Error("Use exactly 4 digits for the PIN.");
    }

    pinHash = await hashPin(pin);
    pinValue = pin;
  }

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(value, key);
  const requirePinForAllExtraTime = (hasOwn("requirePinForAllExtraTime")
    ? Boolean(value.requirePinForAllExtraTime)
    : Boolean(current.requirePinForAllExtraTime)) && Boolean(pinHash);
  const allowExtraTimeForAll = hasOwn("allowExtraTimeForAll")
    ? Boolean(value.allowExtraTimeForAll)
    : Boolean(current.allowExtraTimeForAll);
  const limitWarnings = hasOwn("limitWarnings")
    ? value.limitWarnings !== false
    : current.limitWarnings !== false;
  const limitWarningPosition = hasOwn("limitWarningPosition")
    ? normalizeLimitWarningPosition(value.limitWarningPosition)
    : normalizeLimitWarningPosition(current.limitWarningPosition);
  const limitWarningAutoDismiss = hasOwn("limitWarningAutoDismiss")
    ? Boolean(value.limitWarningAutoDismiss)
    : Boolean(current.limitWarningAutoDismiss);
  const limitWarningAutoDismissSeconds = hasOwn("limitWarningAutoDismissSeconds")
    ? normalizeLimitWarningAutoDismissSeconds(value.limitWarningAutoDismissSeconds)
    : normalizeLimitWarningAutoDismissSeconds(current.limitWarningAutoDismissSeconds);
  const blockAllForAll = hasOwn("blockAllForAll")
    ? Boolean(value.blockAllForAll)
    : Boolean(current.blockAllForAll);
  const grayscaleForAll = hasOwn("grayscaleForAll")
    ? Boolean(value.grayscaleForAll)
    : Boolean(current.grayscaleForAll);
  const grayscaleApplyToAllWebsites = hasOwn("grayscaleApplyToAllWebsites")
    ? Boolean(value.grayscaleApplyToAllWebsites)
    : Boolean(current.grayscaleApplyToAllWebsites);
  const grayscaleForAllMode = hasOwn("grayscaleForAllMode")
    ? normalizeEffectMode(value.grayscaleForAllMode)
    : normalizeEffectMode(current.grayscaleForAllMode);
  const grayscaleIntervalsForAll = hasOwn("grayscaleIntervalsForAll")
    ? normalizeIntervalsForStorage(value.grayscaleIntervalsForAll)
    : normalizeIntervalsForStorage(current.grayscaleIntervalsForAll || current.effectIntervalsForAll);
  const redLightForAll = hasOwn("redLightForAll")
    ? Boolean(value.redLightForAll)
    : Boolean(current.redLightForAll);
  const redLightApplyToAllWebsites = hasOwn("redLightApplyToAllWebsites")
    ? Boolean(value.redLightApplyToAllWebsites)
    : Boolean(current.redLightApplyToAllWebsites);
  const redLightIntensityForAll = hasOwn("redLightIntensityForAll")
    ? normalizeNightLightIntensity(value.redLightIntensityForAll)
    : normalizeNightLightIntensity(current.redLightIntensityForAll);
  const redLightForAllMode = hasOwn("redLightForAllMode")
    ? normalizeEffectMode(value.redLightForAllMode)
    : normalizeEffectMode(current.redLightForAllMode);
  const redLightIntervalsForAll = hasOwn("redLightIntervalsForAll")
    ? normalizeIntervalsForStorage(value.redLightIntervalsForAll)
    : normalizeIntervalsForStorage(current.redLightIntervalsForAll || current.effectIntervalsForAll);
  const effectIntervalsForAll = hasOwn("effectIntervalsForAll")
    ? normalizeIntervalsForStorage(value.effectIntervalsForAll)
    : normalizeIntervalsForStorage(current.effectIntervalsForAll);
  const next = normalizeSettingsForStorage({
    pinHash,
    pinValue,
    requirePinForAllExtraTime,
    allowExtraTimeForAll,
    limitWarnings,
    limitWarningPosition,
    limitWarningAutoDismiss,
    limitWarningAutoDismissSeconds,
    blockAllForAll,
    grayscaleForAll,
    grayscaleApplyToAllWebsites,
    grayscaleForAllMode,
    grayscaleIntervalsForAll,
    redLightForAll,
    redLightApplyToAllWebsites,
    redLightIntensityForAll,
    redLightForAllMode,
    redLightIntervalsForAll,
    effectIntervalsForAll
  });

  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return publicSettings(next);
}

async function loadPomodoroState() {
  const stored = await chrome.storage.local.get(POMODORO_KEY);
  const pomodoro = normalizePomodoroState(stored[POMODORO_KEY]);

  if (stored[POMODORO_KEY]?.active && !pomodoro.active) {
    await appendPomodoroHistory(normalizePomodoroHistorySource(stored[POMODORO_KEY]), { completed: true });
    await savePomodoroState(pomodoro);
    await chrome.alarms.clear(POMODORO_ALARM);
  }

  return pomodoro;
}

async function getPomodoroStateForResponse() {
  const stored = await chrome.storage.local.get(POMODORO_KEY);
  const wasActive = Boolean(stored[POMODORO_KEY]?.active);
  const pomodoro = await loadPomodoroState();

  if (wasActive && !pomodoro.active) {
    try {
      await refreshRules();
    } catch (_error) {
    }
  }

  return pomodoro;
}

async function savePomodoroState(value = {}) {
  const pomodoro = normalizePomodoroState(value);
  await chrome.storage.local.set({ [POMODORO_KEY]: pomodoro });
  return pomodoro;
}

async function restorePomodoroAlarm() {
  const pomodoro = await loadPomodoroState();

  await chrome.alarms.clear(POMODORO_ALARM);

  if (pomodoro.active) {
    await chrome.alarms.create(POMODORO_ALARM, { when: pomodoro.until });
  }
}

async function startPomodoro({ duration = 30, mode = "standard", whitelist = [] } = {}) {
  const durationInMinutes = Math.max(1, Math.min(120, Math.round(Number(duration) || 30)));
  const startedAt = Date.now();
  const until = startedAt + durationInMinutes * 60 * 1000;
  const pomodoro = await savePomodoroState({
    active: true,
    startedAt,
    until,
    durationMinutes: durationInMinutes,
    mode,
    whitelist
  });

  await chrome.alarms.clear(POMODORO_ALARM);
  await chrome.alarms.create(POMODORO_ALARM, { when: pomodoro.until });

  let state = createPomodoroFallbackState(pomodoro);

  try {
    state = await refreshRules();
    await enforceActiveTabBlock(state);
  } catch (error) {
    state = {
      ...state,
      error: serializeError(error),
      lastUpdated: Date.now()
    };
    await saveState(state);
  }

  await broadcastBlockStateUpdated("pomodoro");
  return { pomodoro, state };
}

async function stopPomodoro({ completed = false } = {}) {
  const stored = await chrome.storage.local.get(POMODORO_KEY);
  const previousPomodoro = normalizePomodoroHistorySource(stored[POMODORO_KEY]);

  await chrome.alarms.clear(POMODORO_ALARM);

  if (previousPomodoro.active) {
    await appendPomodoroHistory(previousPomodoro, { completed });
  }

  const pomodoro = await savePomodoroState();
  let state = createPomodoroFallbackState(pomodoro);

  try {
    state = await refreshRules();
  } catch (error) {
    state = {
      ...state,
      error: serializeError(error),
      lastUpdated: Date.now()
    };
    await saveState(state);
  }

  try {
    await enforceActiveTabBlock(state);
  } catch (_error) {
  }

  await broadcastBlockStateUpdated("pomodoro");
  return { pomodoro, state };
}

function normalizePomodoroHistorySource(value = {}) {
  const until = normalizeTimestamp(value?.until);
  const durationMinutes = Math.max(1, Math.min(120, Math.round(Number(value?.durationMinutes) || 0)));
  const startedAt = normalizeTimestamp(value?.startedAt) || Math.max(0, until - durationMinutes * 60 * 1000);
  const active = Boolean(value?.active) && until > 0 && startedAt > 0;

  return {
    active,
    startedAt,
    until,
    durationMinutes,
    mode: value?.mode === "strict" ? "strict" : "standard",
    whitelist: normalizeWhitelist(value?.whitelist)
  };
}

async function appendPomodoroHistory(source, { completed = false } = {}) {
  if (!source?.active || !source.startedAt || !source.until) {
    return;
  }

  const now = Date.now();
  const endedAt = completed ? source.until : Math.min(now, source.until);
  const elapsedSeconds = Math.max(0, Math.round((endedAt - source.startedAt) / 1000));

  if (elapsedSeconds < 1) {
    return;
  }

  const plannedSeconds = Math.max(60, Math.round(source.durationMinutes * 60));
  const wasCompleted = Boolean(completed || elapsedSeconds >= plannedSeconds - 2);
  const entry = normalizePomodoroHistoryEntry({
    id: `${source.startedAt}-${source.until}-${source.mode}`,
    date: dateKeyFromTimestamp(source.startedAt),
    startedAt: source.startedAt,
    endedAt,
    plannedSeconds,
    elapsedSeconds: Math.min(elapsedSeconds, plannedSeconds),
    completed: wasCompleted,
    mode: source.mode,
    whitelistCount: source.whitelist.length
  });

  const stored = await chrome.storage.local.get(POMODORO_HISTORY_KEY);
  const history = normalizePomodoroHistory(stored[POMODORO_HISTORY_KEY]);
  const withoutDuplicate = history.filter((item) => item.id !== entry.id);

  await chrome.storage.local.set({
    [POMODORO_HISTORY_KEY]: prunePomodoroHistory([entry, ...withoutDuplicate])
  });
}

async function getPomodoroStats(date = "") {
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? String(date) : getDateKey();
  const stored = await chrome.storage.local.get(POMODORO_HISTORY_KEY);
  const history = normalizePomodoroHistory(stored[POMODORO_HISTORY_KEY]);
  const selectedSessions = history
    .filter((entry) => entry.date === selectedDate)
    .sort((a, b) => b.startedAt - a.startedAt);

  const last7Days = Array.from({ length: 7 }, (_item, index) => {
    const dateObject = new Date();
    dateObject.setDate(dateObject.getDate() - (6 - index));
    const day = dateKeyFromDate(dateObject);
    const sessions = history.filter((entry) => entry.date === day);
    const totalSeconds = sessions.reduce((sum, entry) => sum + entry.elapsedSeconds, 0);
    const longestSessionSeconds = Math.max(0, ...sessions.map((entry) => entry.elapsedSeconds));

    return {
      date: day,
      totalSeconds,
      longestSessionSeconds,
      sessionCount: sessions.length,
      completedCount: sessions.filter((entry) => entry.completed).length
    };
  });

  const totalSeconds = selectedSessions.reduce((sum, entry) => sum + entry.elapsedSeconds, 0);
  const completedCount = selectedSessions.filter((entry) => entry.completed).length;
  const stoppedCount = selectedSessions.length - completedCount;

  return {
    date: selectedDate,
    selectedDay: {
      totalSeconds,
      sessionCount: selectedSessions.length,
      completedCount,
      stoppedCount,
      completionRate: selectedSessions.length > 0 ? Math.round((completedCount / selectedSessions.length) * 100) : 0,
      sessions: selectedSessions
    },
    today: {
      date: getDateKey(),
      totalSeconds: history
        .filter((entry) => entry.date === getDateKey())
        .reduce((sum, entry) => sum + entry.elapsedSeconds, 0)
    },
    last7Days,
    streakDays: getPomodoroStreakDays(history),
    totalSessions: history.length
  };
}

function normalizePomodoroHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizePomodoroHistoryEntry)
    .filter((entry) => entry.id && entry.startedAt > 0 && entry.endedAt >= entry.startedAt && entry.elapsedSeconds > 0)
    .sort((a, b) => b.startedAt - a.startedAt);
}

function normalizePomodoroHistoryEntry(value = {}) {
  const startedAt = normalizeTimestamp(value?.startedAt);
  const endedAt = normalizeTimestamp(value?.endedAt);
  const elapsedSeconds = Math.max(0, Math.round(Number(value?.elapsedSeconds) || 0));
  const plannedSeconds = Math.max(0, Math.round(Number(value?.plannedSeconds) || 0));

  return {
    id: typeof value?.id === "string" ? value.id : `${startedAt}-${endedAt}`,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(value?.date || "")) ? String(value.date) : dateKeyFromTimestamp(startedAt || Date.now()),
    startedAt,
    endedAt,
    plannedSeconds,
    elapsedSeconds,
    completed: Boolean(value?.completed),
    mode: value?.mode === "strict" ? "strict" : "standard",
    whitelistCount: Math.max(0, Math.round(Number(value?.whitelistCount) || 0))
  };
}

function prunePomodoroHistory(history) {
  const cutoff = Date.now() - MAX_POMODORO_HISTORY_DAYS * 24 * 60 * 60 * 1000;

  return normalizePomodoroHistory(history)
    .filter((entry) => entry.startedAt >= cutoff)
    .slice(0, MAX_POMODORO_HISTORY_ITEMS);
}

function getPomodoroStreakDays(history) {
  const activeDays = new Set(
    normalizePomodoroHistory(history)
      .filter((entry) => entry.elapsedSeconds > 0)
      .map((entry) => entry.date)
  );

  let streak = 0;
  const date = new Date();

  while (activeDays.has(dateKeyFromDate(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function dateKeyFromTimestamp(timestamp) {
  return dateKeyFromDate(new Date(timestamp));
}

function dateKeyFromDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function createPomodoroFallbackState(pomodoro) {
  return {
    activeSites: [],
    error: "",
    lastUpdated: Date.now(),
    pomodoro: normalizePomodoroState(pomodoro),
    siteUsage: [],
    timezone: "local"
  };
}

function normalizePomodoroState(value = {}) {
  const until = normalizeTimestamp(value?.until);
  const active = Boolean(value?.active) && until > Date.now();
  const durationMinutes = Math.max(0, Math.min(120, Math.round(Number(value?.durationMinutes) || 0)));
  const startedAt = normalizeTimestamp(value?.startedAt);
  const fallbackStartedAt = active && durationMinutes > 0
    ? Math.max(0, until - durationMinutes * 60 * 1000)
    : 0;

  return {
    active,
    until: active ? until : 0,
    startedAt: active ? startedAt || fallbackStartedAt || Date.now() : 0,
    durationMinutes: active ? durationMinutes || Math.max(1, Math.round((until - (startedAt || Date.now())) / 60000)) : 0,
    mode: value?.mode === "strict" ? "strict" : "standard",
    whitelist: normalizeWhitelist(value?.whitelist)
  };
}

function normalizeWhitelist(value) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,]+/)
      : [];

  return Array.from(new Set(items.map((item) => normalizeDomain(item)).filter(Boolean)));
}

function normalizeSettingsForStorage(value = {}) {
  const pinHash = typeof value.pinHash === "string" ? value.pinHash : "";
  const pinValue = typeof value.pinValue === "string" ? String(value.pinValue).replace(/\D+/g, "").slice(0, 4) : "";

  return {
    pinHash,
    pinValue: pinHash ? pinValue : "",
    requirePinForAllExtraTime: Boolean(value.requirePinForAllExtraTime),
    allowExtraTimeForAll: Boolean(value.allowExtraTimeForAll),
    limitWarnings: value.limitWarnings !== false,
    limitWarningPosition: normalizeLimitWarningPosition(value.limitWarningPosition),
    limitWarningAutoDismiss: Boolean(value.limitWarningAutoDismiss),
    limitWarningAutoDismissSeconds: normalizeLimitWarningAutoDismissSeconds(value.limitWarningAutoDismissSeconds),
    blockAllForAll: Boolean(value.blockAllForAll),
    grayscaleForAll: Boolean(value.grayscaleForAll),
    grayscaleApplyToAllWebsites: Boolean(value.grayscaleApplyToAllWebsites),
    grayscaleForAllMode: normalizeEffectMode(value.grayscaleForAllMode),
    grayscaleIntervalsForAll: normalizeIntervalsForStorage(value.grayscaleIntervalsForAll ?? value.effectIntervalsForAll),
    redLightForAll: Boolean(value.redLightForAll),
    redLightApplyToAllWebsites: Boolean(value.redLightApplyToAllWebsites),
    redLightIntensityForAll: normalizeNightLightIntensity(value.redLightIntensityForAll),
    redLightForAllMode: normalizeEffectMode(value.redLightForAllMode),
    redLightIntervalsForAll: normalizeIntervalsForStorage(value.redLightIntervalsForAll ?? value.effectIntervalsForAll),
    effectIntervalsForAll: normalizeIntervalsForStorage(value.effectIntervalsForAll)
  };
}

function publicSettings(settings) {
  return {
    hasPin: Boolean(settings.pinHash),
    requirePinForAllExtraTime: Boolean(settings.pinHash && settings.requirePinForAllExtraTime),
    allowExtraTimeForAll: Boolean(settings.allowExtraTimeForAll),
    limitWarnings: settings.limitWarnings !== false,
    limitWarningPosition: normalizeLimitWarningPosition(settings.limitWarningPosition),
    limitWarningAutoDismiss: Boolean(settings.limitWarningAutoDismiss),
    limitWarningAutoDismissSeconds: normalizeLimitWarningAutoDismissSeconds(settings.limitWarningAutoDismissSeconds),
    blockAllForAll: Boolean(settings.blockAllForAll),
    grayscaleForAll: Boolean(settings.grayscaleForAll),
    grayscaleApplyToAllWebsites: Boolean(settings.grayscaleApplyToAllWebsites),
    grayscaleForAllMode: normalizeEffectMode(settings.grayscaleForAllMode),
    grayscaleIntervalsForAll: normalizeIntervalsForStorage(settings.grayscaleIntervalsForAll || settings.effectIntervalsForAll),
    redLightForAll: Boolean(settings.redLightForAll),
    redLightApplyToAllWebsites: Boolean(settings.redLightApplyToAllWebsites),
    redLightIntensityForAll: normalizeNightLightIntensity(settings.redLightIntensityForAll),
    redLightForAllMode: normalizeEffectMode(settings.redLightForAllMode),
    redLightIntervalsForAll: normalizeIntervalsForStorage(settings.redLightIntervalsForAll || settings.effectIntervalsForAll),
    effectIntervalsForAll: normalizeIntervalsForStorage(settings.effectIntervalsForAll),
    pinValue: settings.pinHash ? settings.pinValue : ""
  };
}

async function hashPin(pin) {
  const shaHash = await createShaPinHash(pin);
  return shaHash || createFallbackPinHash(pin);
}

async function verifyPin(pin, settings) {
  const expectedHash = settings.pinHash;

  if (!expectedHash || !/^\d{4}$/.test(String(pin || ""))) {
    return false;
  }

  if (expectedHash.startsWith("fnv1a:")) {
    return createFallbackPinHash(pin) === expectedHash;
  }

  if (expectedHash.startsWith("sha256:")) {
    return await createShaPinHash(pin) === expectedHash;
  }

  return await createLegacyShaPinHash(pin) === expectedHash;
}

async function createShaPinHash(pin) {
  const hash = await createLegacyShaPinHash(pin);
  return hash ? `sha256:${hash}` : "";
}

async function createLegacyShaPinHash(pin) {
  if (!globalThis.crypto?.subtle) {
    return "";
  }

  try {
    const data = new TextEncoder().encode(`website-tracker:${pin}`);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch (_error) {
    return "";
  }
}

function createFallbackPinHash(pin) {
  const text = `website-tracker:${pin}`;
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizeScheduleForStorage(schedule) {
  const rawSites = Array.isArray(schedule?.sites)
    ? schedule.sites
    : Array.isArray(schedule?.websites)
      ? schedule.websites
      : [];

  return {
    timezone: normalizeTimezone(schedule?.timezone),
    sites: rawSites
      .map((site) => normalizeSiteForStorage(site))
      .filter(Boolean)
  };
}

function normalizeTimezone(timezone) {
  if (typeof timezone !== "string") {
    return "local";
  }

  const value = timezone.trim();
  return value || "local";
}

function normalizeSiteForStorage(site) {
  const domainValues = pickDomainValues(site);
  const domains = domainValues
    .map((value) => normalizeDomain(value))
    .filter(Boolean);
  const uniqueDomains = Array.from(new Set(domains));

  if (uniqueDomains.length === 0) {
    return null;
  }

  return {
    domain: uniqueDomains[0],
    enabled: site.enabled !== false && site.disabled !== true,
    blockMode: normalizeBlockMode(site.blockMode, site.intervals),
    exceptions: normalizeExceptionDomains(site.exceptions ?? site.allowlist ?? site.allowList ?? site.allowedDomains, uniqueDomains),
    intervals: normalizeIntervalsForStorage(site.intervals),
    dailyAllowanceMinutes: normalizeDailyAllowance(site.dailyAllowanceMinutes ?? site.allowanceMinutes),
    overrideGlobalSettings: Boolean(site.overrideGlobalSettings || site.limitWarningOverrideGlobal),
    limitWarnings: site.limitWarnings !== false,
    limitWarningPosition: normalizeLimitWarningPosition(site.limitWarningPosition),
    limitWarningAutoDismiss: Boolean(site.limitWarningAutoDismiss),
    limitWarningAutoDismissSeconds: normalizeLimitWarningAutoDismissSeconds(site.limitWarningAutoDismissSeconds),
    allowExtraTime: Boolean(site.allowExtraTime),
    grayscale: Boolean(site.grayscale),
    grayscaleMode: normalizeEffectMode(site.grayscaleMode),
    grayscaleIntervals: normalizeIntervalsForStorage(site.grayscaleIntervals ?? site.effectIntervals),
    redLight: Boolean(site.redLight),
    redLightIntensity: normalizeNightLightIntensity(site.redLightIntensity),
    redLightMode: normalizeEffectMode(site.redLightMode),
    redLightIntervals: normalizeIntervalsForStorage(site.redLightIntervals ?? site.effectIntervals),
    effectIntervals: normalizeIntervalsForStorage(site.effectIntervals),
    requirePinForExtraTime: Boolean(site.requirePinForExtraTime)
  };
}

function normalizeDailyAllowance(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  return Math.min(Math.round(minutes), 24 * 60);
}

function normalizeIntervalsForStorage(intervals) {
  if (!Array.isArray(intervals)) {
    return [];
  }

  return intervals
    .map((interval) => normalizeIntervalForStorage(interval))
    .filter(Boolean);
}

function normalizeIntervalForStorage(interval) {
  const parsed = parseInterval(interval);

  if (!parsed) {
    return null;
  }

  const normalized = {
    start: minutesToClock(parsed.start),
    end: minutesToClock(parsed.end)
  };

  if (parsed.days) {
    const days = DAY_NAMES.filter((_name, index) => parsed.days.has(index));

    if (days.length > 0 && days.length < DAY_NAMES.length) {
      normalized.days = days;
    }
  }

  return normalized;
}

function minutesToClock(totalMinutes) {
  const minutes = Math.max(0, Math.min(24 * 60, totalMinutes));

  if (minutes === 24 * 60) {
    return "24:00";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getActiveSites(schedule, now, usage, settings = {}) {
  return getNormalizedScheduleSites(schedule, settings)
    .filter((site) => shouldBlockSite(site, now, usage))
    .map((site) => toActiveSite(site, settings));
}

function getPomodoroStandardSites(schedule, settings = {}) {
  return getNormalizedScheduleSites(schedule, settings).map((site) => toActiveSite({
    ...site,
    allowExtraTime: false
  }));
}

function getNormalizedScheduleSites(schedule, settings = {}) {
  const sites = Array.isArray(schedule.sites)
    ? schedule.sites
    : Array.isArray(schedule.websites)
      ? schedule.websites
      : [];
  return sites
    .map((site) => normalizeSite(site))
    .map((site) => applyGlobalBlockOverride(site, settings))
    .filter((site) => site.enabled && site.domains.length > 0);
}

function toActiveSite(site, settings = {}) {
  return {
    name: site.name,
    domain: site.domain,
    allowExtraTime: isExtraTimeAllowed(site, settings),
    domains: site.domains,
    exceptions: site.exceptions
  };
}

function normalizeSite(site) {
  const intervals = Array.isArray(site.intervals) ? site.intervals : [];
  const domainValues = pickDomainValues(site);
  const domains = domainValues
    .map((value) => normalizeDomain(value))
    .filter(Boolean);

  return {
    name: site.name || domains[0] || "Unnamed site",
    domain: domains[0] || "",
    enabled: site.enabled !== false && site.disabled !== true,
    domains: Array.from(new Set(domains)),
    blockMode: normalizeBlockMode(site.blockMode, intervals),
    exceptions: normalizeExceptionDomains(site.exceptions ?? site.allowlist ?? site.allowList ?? site.allowedDomains, domains),
    intervals,
    dailyAllowanceMinutes: normalizeDailyAllowance(site.dailyAllowanceMinutes ?? site.allowanceMinutes),
    overrideGlobalSettings: Boolean(site.overrideGlobalSettings || site.limitWarningOverrideGlobal),
    limitWarnings: site.limitWarnings !== false,
    limitWarningPosition: normalizeLimitWarningPosition(site.limitWarningPosition),
    limitWarningAutoDismiss: Boolean(site.limitWarningAutoDismiss),
    limitWarningAutoDismissSeconds: normalizeLimitWarningAutoDismissSeconds(site.limitWarningAutoDismissSeconds),
    allowExtraTime: Boolean(site.allowExtraTime),
    grayscale: Boolean(site.grayscale),
    grayscaleMode: normalizeEffectMode(site.grayscaleMode),
    grayscaleIntervals: normalizeIntervalsForStorage(site.grayscaleIntervals ?? site.effectIntervals),
    redLight: Boolean(site.redLight),
    redLightIntensity: normalizeNightLightIntensity(site.redLightIntensity),
    redLightMode: normalizeEffectMode(site.redLightMode),
    redLightIntervals: normalizeIntervalsForStorage(site.redLightIntervals ?? site.effectIntervals),
    effectIntervals: normalizeIntervalsForStorage(site.effectIntervals),
    requirePinForExtraTime: Boolean(site.requirePinForExtraTime)
  };
}

function applyGlobalBlockOverride(site, settings = {}) {
  if (!settings?.blockAllForAll || site?.overrideGlobalSettings) {
    return site;
  }

  return {
    ...site,
    enabled: true,
    blockMode: "always"
  };
}

function normalizeBlockMode(mode, intervals = []) {
  if (mode === "always" || mode === "slots") {
    return mode;
  }

  return isLegacyAllDayIntervals(intervals) ? "always" : "slots";
}

function normalizeEffectMode(mode) {
  return mode === "slots" ? "slots" : "always";
}

function normalizeNightLightIntensity(value, fallback = DEFAULT_NIGHT_LIGHT_INTENSITY) {
  const number = Number(value);
  const fallbackNumber = Number(fallback);
  const safeFallback = Number.isFinite(fallbackNumber) ? fallbackNumber : DEFAULT_NIGHT_LIGHT_INTENSITY;

  if (!Number.isFinite(number)) {
    return Math.max(0, Math.min(100, Math.round(safeFallback)));
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function pickDomainValues(site) {
  const value = site.domains ?? site.domain ?? site.match ?? site.url ?? site.website ?? site.websites;

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function normalizeDomain(value) {
  if (typeof value !== "string") {
    return "";
  }

  let text = value.trim().toLowerCase();
  if (!text) {
    return "";
  }

  text = text
    .replace(/^\*:\/\/\*\./, "")
    .replace(/^\*:\/\/\*/, "")
    .replace(/^\*\./, "")
    .replace(/^www\./, "");

  try {
    const url = new URL(text.includes("://") ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "");
  } catch (_error) {
    return text.split("/")[0].replace(/^www\./, "");
  }
}

function normalizeExceptionDomains(value, baseDomains = []) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,]+/)
      : [];
  const normalizedBaseDomains = baseDomains
    .map((domain) => normalizeDomain(domain))
    .filter(Boolean);
  const domains = values
    .map((domain) => normalizeDomain(domain))
    .filter(Boolean)
    .filter((domain) => normalizedBaseDomains.length === 0 || normalizedBaseDomains.some((baseDomain) => {
      return domain !== baseDomain && domainMatches(domain, baseDomain);
    }));

  return Array.from(new Set(domains));
}

function getExceptionDomains(sites = []) {
  return Array.from(new Set(
    sites.flatMap((site) => Array.isArray(site.exceptions) ? site.exceptions : [])
      .map((domain) => normalizeDomain(domain))
      .filter(Boolean)
  ));
}

function hostMatchesException(host, exceptions = []) {
  const normalizedHost = normalizeDomain(host);

  return Boolean(normalizedHost && exceptions.some((domain) => domainMatches(normalizedHost, domain)));
}

function siteMatchesHost(site, host, { respectExceptions = true } = {}) {
  const normalizedHost = normalizeDomain(host);

  if (!normalizedHost) {
    return false;
  }

  if (!site.domains.some((domain) => domainMatches(normalizedHost, domain))) {
    return false;
  }

  return !respectExceptions || !hostMatchesException(normalizedHost, site.exceptions);
}

function shouldBlockSite(site, now, usage, host = "", currentTime = Date.now()) {
  if (!isSiteInBlockedSlot(site, now)) {
    return false;
  }

  if (host && hostMatchesException(host, site.exceptions)) {
    return false;
  }

  if (hasTemporaryUnblock(site, usage, currentTime)) {
    return false;
  }

  return getAllowanceRemainingSeconds(site, usage) <= 0;
}

function isSiteInBlockedSlot(site, now) {
  if (normalizeBlockMode(site.blockMode, site.intervals) === "always") {
    return true;
  }

  return site.intervals.some((interval) => isIntervalActive(interval, now));
}

function isIntervalActive(interval, now) {
  const parsed = parseInterval(interval);

  if (!parsed) {
    return false;
  }

  const { start, end, days } = parsed;

  if (start === end) {
    return dayMatches(days, now.day);
  }

  if (start < end) {
    return dayMatches(days, now.day) && now.minutes >= start && now.minutes < end;
  }

  const previousDay = (now.day + 6) % 7;
  return (
    (dayMatches(days, now.day) && now.minutes >= start) ||
    (dayMatches(days, previousDay) && now.minutes < end)
  );
}

function isLegacyAllDayIntervals(intervals) {
  const parsed = Array.isArray(intervals) && intervals.length === 1
    ? parseInterval(intervals[0])
    : null;

  return Boolean(parsed && parsed.start === parsed.end && (!parsed.days || parsed.days.size === DAY_NAMES.length));
}

function parseInterval(interval) {
  let start;
  let end;
  let days;

  if (typeof interval === "string") {
    const parts = interval.split("-");
    if (parts.length !== 2) {
      return null;
    }

    start = parts[0];
    end = parts[1];
  } else if (Array.isArray(interval)) {
    [start, end] = interval;
  } else if (interval && typeof interval === "object") {
    ({ start, end, days } = interval);
  } else {
    return null;
  }

  const startMinutes = parseClock(start);
  const endMinutes = parseClock(end);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  return {
    start: startMinutes,
    end: endMinutes,
    days: normalizeDays(days)
  };
}

function parseClock(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 0 && value <= 24 ? value * 60 : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  const match = /^(\d{1,2})(?::([0-5]\d))?$/.exec(text);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] || "0");

  if (hours === 24 && minutes === 0) {
    return 24 * 60;
  }

  if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function normalizeDays(days) {
  if (!days) {
    return null;
  }

  if (typeof days === "string") {
    const value = days.trim().toLowerCase();

    if (value === "weekday" || value === "weekdays") {
      return new Set([1, 2, 3, 4, 5]);
    }

    if (value === "weekend" || value === "weekends") {
      return new Set([0, 6]);
    }

    days = value.split(/[\s,]+/);
  }

  if (!Array.isArray(days)) {
    return null;
  }

  const normalized = days
    .map((day) => normalizeDay(day))
    .filter((day) => day !== null);

  return normalized.length > 0 ? new Set(normalized) : null;
}

function normalizeDay(day) {
  if (typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6) {
    return day;
  }

  const value = String(day).trim().toLowerCase();
  return DAY_ALIASES.has(value) ? DAY_ALIASES.get(value) : null;
}

function dayMatches(days, day) {
  return !days || days.has(day);
}

async function accrueActiveUsage({ trackCurrent = true, requireCurrentMatch = true } = {}) {
  const [schedule, usage, trackingResult, settings] = await Promise.all([
    loadSchedule(),
    getUsage(),
    chrome.storage.local.get(TRACKING_KEY),
    loadSettings()
  ]);
  const now = getTimeParts(schedule.timezone);
  const today = getDateKey();
  const currentTime = Date.now();
  const previous = trackingResult[TRACKING_KEY];
  let changedUsage = false;

  if (previous?.date === today && previous?.domain && Number.isFinite(previous.lastTick)) {
    const previousSite = findSiteForHost(schedule, previous.domain, settings);

    if (
      previousSite &&
      isSiteInBlockedSlot(previousSite, now) &&
      (!requireCurrentMatch || await isTrackedSiteCurrentlyActive(previousSite, previous))
    ) {
      const entry = ensureUsageEntry(usage, previousSite.domain);
      const elapsedSeconds = getTrackableElapsedSeconds(previous.lastTick, currentTime);
      const extraConsumedSeconds = getExtraElapsedSeconds(entry, previous.lastTick, currentTime);
      let changedEntry = false;
      const allowanceRemainingSeconds = Math.max(
        0,
        getAllowanceRemainingSeconds(previousSite, usage) - extraConsumedSeconds
      );
      const allowanceConsumedSeconds = Math.min(
        Math.max(0, elapsedSeconds - extraConsumedSeconds),
        allowanceRemainingSeconds
      );
      const consumedSeconds = extraConsumedSeconds + allowanceConsumedSeconds;

      if (extraConsumedSeconds > 0 && !entry.extraUntil) {
        entry.extraSeconds = Math.max(0, entry.extraSeconds - extraConsumedSeconds);

        if (entry.extraSeconds <= 0) {
          entry.extraUntil = 0;
        }
        changedEntry = true;
      } else if (entry.extraUntil && getExtraRemainingSeconds(entry, currentTime) <= 0) {
        entry.extraSeconds = 0;
        entry.extraUntil = 0;
        changedEntry = true;
      }

      addUsedSeconds(usage, previousSite.domain, consumedSeconds);
      changedUsage = consumedSeconds > 0 || changedEntry;
    }
  }

  if (changedUsage) {
    await saveUsage(usage);
  }

  if (!trackCurrent || extensionPopupOpenCount > 0) {
    await chrome.storage.local.remove(TRACKING_KEY);
    return;
  }

  const activeInfo = await getActiveTrackedInfo(schedule, now, usage, settings);

  if (!activeInfo) {
    await chrome.storage.local.remove(TRACKING_KEY);
    return;
  }

  await chrome.storage.local.set({
    [TRACKING_KEY]: {
      domain: activeInfo.site.domain,
      lastTick: currentTime,
      date: today,
      tabId: activeInfo.tab.id
    }
  });
}

async function accrueScreenUsage() {
  const today = getDateKey();
  const [usage, trackingResult] = await Promise.all([
    getUsage(),
    chrome.storage.local.get(SCREEN_TRACKING_KEY)
  ]);
  const currentTime = Date.now();
  const previous = trackingResult[SCREEN_TRACKING_KEY];
  let changedUsage = false;

  if (previous?.date === today && previous?.domain && Number.isFinite(previous.lastTick)) {
    const elapsedSeconds = getTrackableElapsedSeconds(previous.lastTick, currentTime);

    changedUsage = addScreenUsageSeconds(
      usage,
      previous.domain,
      currentTime - elapsedSeconds * 1000,
      currentTime
    ) || changedUsage;
  }

  if (changedUsage) {
    await saveUsage(usage);
  }

  const tab = await getActiveHttpTab();
  const domain = tab ? getHostname(tab.url) : "";

  if (!domain) {
    await chrome.storage.local.remove(SCREEN_TRACKING_KEY);
    return;
  }

  await chrome.storage.local.set({
    [SCREEN_TRACKING_KEY]: {
      domain,
      lastTick: currentTime,
      date: today,
      tabId: tab.id
    }
  });
}

async function getActiveTrackedInfo(schedule, now, usage, settings = {}) {
  const tab = await getActiveHttpTab();

  if (!tab) {
    return null;
  }

  const host = getHostname(tab.url);
  const site = findSiteForHost(schedule, host, settings);

  if (!site || !isSiteInBlockedSlot(site, now)) {
    return null;
  }

  if (!hasTemporaryUnblock(site, usage) && getAllowanceRemainingSeconds(site, usage) <= 0) {
    return null;
  }

  return { site, tab };
}

async function isTrackedSiteCurrentlyActive(site, tracking) {
  const tab = await getActiveHttpTab();

  if (!tab) {
    return false;
  }

  if (Number.isFinite(tracking?.tabId) && tab.id !== tracking.tabId) {
    return false;
  }

  const host = getHostname(tab.url);
  return siteMatchesHost(site, host);
}

async function enforceActiveTabBlock(state) {
  const tab = await getActiveHttpTab();

  if (!tab) {
    return;
  }

  await enforceTabBlock(tab, state);
}

async function enforceDomainTabsBlock(state, domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return;
  }

  let schedule = null;
  let settings = null;

  try {
    [schedule, settings] = await Promise.all([loadSchedule(), loadSettings()]);
  } catch (_error) {
  }

  const site = schedule && settings ? findSiteForHost(schedule, normalizedDomain, settings) : null;
  const targetDomains = Array.from(new Set(
    (Array.isArray(site?.domains) && site.domains.length > 0 ? site.domains : [normalizedDomain])
      .map((targetDomain) => normalizeDomain(targetDomain))
      .filter(Boolean)
  ));

  let tabs = [];

  try {
    tabs = await chrome.tabs.query({});
  } catch (_error) {
    return;
  }

  await Promise.all(tabs.map(async (tab) => {
    if (typeof tab?.id !== "number" || !/^https?:\/\//.test(tab.url || "")) {
      return;
    }

    const host = getHostname(tab.url);

    if (!targetDomains.some((targetDomain) => domainMatches(host, targetDomain))) {
      return;
    }

    await enforceTabBlock(tab, state);
  }));
}

async function enforceTabBlock(tab, state) {
  if (typeof tab?.id !== "number" || !/^https?:\/\//.test(tab.url || "")) {
    return;
  }

  const host = getHostname(tab.url);
  const tabReadyForPageInjection = isTabReadyForPageInjection(tab);

  if (state.pomodoro?.active && state.pomodoro.mode === "strict") {
    if (!isStrictPomodoroAllowed(host, state.pomodoro)) {
      if (tabReadyForPageInjection) {
        await hideTabLimitWarning(tab.id);
        await cleanupStatePreservingBlock(tab.id);
      }

      await chrome.tabs.update(tab.id, { url: getPomodoroBlockedPageUrl(tab.url) });
    } else {
      if (tabReadyForPageInjection) {
        await cleanupStatePreservingBlock(tab.id);
        await hideTabLimitWarning(tab.id);
        await syncTabVisualEffects(tab.id, host);
      }
    }

    return;
  }

  const blockedSite = (state.activeSites || []).find((site) => {
    return (site.domains || []).some((domain) => domainMatches(host, domain)) &&
      !hostMatchesException(host, getExceptionDomains(state.activeSites || []));
  });

  if (!blockedSite) {
    if (tabReadyForPageInjection) {
      await cleanupStatePreservingBlock(tab.id);
      await syncTabVisualEffects(tab.id, host);
      await syncTabLimitWarning(tab.id, host);
    }
    return;
  }

  const blockedDomain = blockedSite.domain || blockedSite.domains?.[0] || host;

  if (!tabReadyForPageInjection) {
    await chrome.tabs.update(tab.id, { url: getBlockedPageUrl(blockedDomain, tab.url) });
    return;
  }

  await hideTabLimitWarning(tab.id);
  const showedOverlay = await showStatePreservingBlock(tab.id, blockedDomain);

  if (!showedOverlay) {
    await cleanupStatePreservingBlock(tab.id);
    await chrome.tabs.update(tab.id, { url: getBlockedPageUrl(blockedDomain, tab.url) });
  }
}

function isTabReadyForPageInjection(tab) {
  return tab?.status === "complete";
}

async function showStatePreservingBlock(tabId, domain) {
  try {
    const status = await getSiteStatus(domain);

    await ensureStatePreservingContentScript(tabId);
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "focus-tracker-show-state-blocker",
      status
    });

    if (response?.ok) {
      tabsWithStatePreservingBlocks.add(tabId);
    }

    return Boolean(response?.ok);
  } catch (_error) {
    return false;
  }
}

async function ensureStatePreservingContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "focus-tracker-ping-state-blocker" });

    if (response?.ok) {
      return;
    }
  } catch (_error) {
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["shared/block-panel-ui.js", "content/state-preserving-block.js"]
  });
}

async function syncTabVisualEffects(tabId, host, { forceCleanup = false } = {}) {
  if (typeof tabId !== "number") {
    return;
  }

  const normalizedHost = normalizeDomain(host);

  let schedule = cachedSchedule;
  let settings = cachedSettings;

  if (!schedule) {
    try {
      schedule = await loadSchedule();
    } catch (_error) {
      schedule = null;
    }
  }

  if (!settings) {
    try {
      settings = await loadSettings();
    } catch (_error) {
      settings = null;
    }
  }

  if (!normalizedHost || !schedule || !settings) {
    await setTabVisualEffects(tabId, { grayscale: false, redLight: false }, { forceCleanup });
    return;
  }

  const site = findSiteForVisualEffects(schedule, normalizedHost);
  const siteUsesGlobalSettings = !site?.overrideGlobalSettings;
  const grayscaleGlobalApplies = Boolean(
    settings.grayscaleForAll && ((site && siteUsesGlobalSettings) || (!site && settings.grayscaleApplyToAllWebsites))
  );
  const redLightGlobalApplies = Boolean(
    settings.redLightForAll && ((site && siteUsesGlobalSettings) || (!site && settings.redLightApplyToAllWebsites))
  );

  if (!site && !grayscaleGlobalApplies && !redLightGlobalApplies) {
    await setTabVisualEffects(tabId, { grayscale: false, redLight: false }, { forceCleanup });
    return;
  }

  const now = getTimeParts(schedule.timezone);
  const effectSite = site || createVisualEffectFallbackSite(normalizedHost);
  const grayscale = isEffectActiveNow(effectSite, settings, now, {
    globalEnabled: grayscaleGlobalApplies,
    globalMode: settings.grayscaleForAllMode,
    globalIntervals: settings.grayscaleIntervalsForAll || settings.effectIntervalsForAll,
    siteEnabled: Boolean(site?.grayscale),
    siteMode: site?.grayscaleMode,
    siteIntervals: site?.grayscaleIntervals || site?.effectIntervals
  });
  const redLight = isEffectActiveNow(effectSite, settings, now, {
    globalEnabled: redLightGlobalApplies,
    globalMode: settings.redLightForAllMode,
    globalIntervals: settings.redLightIntervalsForAll || settings.effectIntervalsForAll,
    siteEnabled: Boolean(site?.redLight),
    siteMode: site?.redLightMode,
    siteIntervals: site?.redLightIntervals || site?.effectIntervals
  });
  const redLightIntensity = redLightGlobalApplies
    ? settings.redLightIntensityForAll
    : site?.redLightIntensity;

  await setTabVisualEffects(tabId, { grayscale, redLight, redLightIntensity }, { forceCleanup });
}

function createVisualEffectFallbackSite(host) {
  return {
    domain: host,
    domains: [host],
    exceptions: [],
    intervals: [],
    effectIntervals: []
  };
}

async function syncAllTabVisualEffects({ forceCleanup = false } = {}) {
  let tabs = [];

  try {
    tabs = await chrome.tabs.query({});
  } catch (_error) {
    return;
  }

  await Promise.all(tabs.map(async (tab) => {
    if (typeof tab?.id !== "number" || !/^https?:\/\//.test(tab.url || "")) {
      return;
    }

    if (!isTabReadyForPageInjection(tab)) {
      return;
    }

    await syncTabVisualEffects(tab.id, getHostname(tab.url), { forceCleanup });
  }));
}

function isEffectActiveNow(site, settings, now, {
  globalEnabled = false,
  globalMode = "always",
  globalIntervals = [],
  siteEnabled = false,
  siteMode = "always",
  siteIntervals = []
} = {}) {
  if (Boolean(globalEnabled)) {
    const mode = normalizeEffectMode(globalMode);
    return mode === "always" || (mode === "slots" && isEffectInSlot(globalIntervals, site, now));
  }

  if (!Boolean(siteEnabled)) {
    return false;
  }

  const mode = normalizeEffectMode(siteMode);
  return mode === "always" || (mode === "slots" && isEffectInSlot(siteIntervals, site, now));
}

function isEffectInSlot(intervals, site, now) {
  const customIntervals = normalizeIntervalsForStorage(intervals);
  const fallbackIntervals = normalizeIntervalsForStorage(site?.effectIntervals).length > 0
    ? normalizeIntervalsForStorage(site.effectIntervals)
    : normalizeIntervalsForStorage(site?.intervals);
  const activeIntervals = customIntervals.length > 0 ? customIntervals : fallbackIntervals;

  return activeIntervals.some((interval) => isIntervalActive(interval, now));
}

async function setTabVisualEffects(tabId, { grayscale = false, redLight = false, redLightIntensity = DEFAULT_NIGHT_LIGHT_INTENSITY } = {}, { forceCleanup = false } = {}) {
  if (typeof tabId !== "number") {
    return;
  }

  const hasVisualEffects = Boolean(grayscale || redLight);

  if (!hasVisualEffects && !forceCleanup && !tabsWithVisualEffects.has(tabId)) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: setFocusTrackerVisualEffects,
      args: [Boolean(grayscale), Boolean(redLight), normalizeNightLightIntensity(redLightIntensity)]
    });

    if (hasVisualEffects) {
      tabsWithVisualEffects.add(tabId);
    } else {
      tabsWithVisualEffects.delete(tabId);
    }
  } catch (_error) {
  }
}

function setFocusTrackerVisualEffects(grayscaleEnabled, redLightEnabled, redLightIntensity) {
  const styleId = "focus-tracker-visual-effects";
  const existing = document.getElementById(styleId);

  const filters = [];
  if (grayscaleEnabled) {
    filters.push("grayscale(1)");
  }
  if (redLightEnabled) {
    const intensity = Math.max(0, Math.min(100, Math.round(Number(redLightIntensity) || 0))) / 100;
    const sepia = (0.85 * intensity).toFixed(3);
    const saturate = (1 + 1.6 * intensity).toFixed(3);
    const hueRotate = (-32 * intensity).toFixed(1);
    const brightness = (1 - 0.1 * intensity).toFixed(3);
    const contrast = (1 + 0.04 * intensity).toFixed(3);

    filters.push(`sepia(${sepia}) saturate(${saturate}) hue-rotate(${hueRotate}deg) brightness(${brightness}) contrast(${contrast})`);
  }

  const filter = filters.join(" ").trim();

  if (!filter) {
    existing?.remove();
    return;
  }

  const css = `html{filter:${filter}!important;-webkit-filter:${filter}!important;}`;

  if (existing) {
    existing.textContent = css;
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

async function syncTabLimitWarning(tabId, host, { forceCleanup = false } = {}) {
  if (typeof tabId !== "number") {
    return;
  }

  try {
    const warning = await getLimitWarningForHost(host);
    await setTabLimitWarning(tabId, warning, { forceCleanup });
  } catch (_error) {
    await hideTabLimitWarning(tabId, { forceCleanup });
  }
}

async function syncAllTabLimitWarnings({ forceCleanup = false } = {}) {
  let tabs = [];

  try {
    tabs = await chrome.tabs.query({});
  } catch (_error) {
    return;
  }

  await Promise.all(tabs.map(async (tab) => {
    if (typeof tab?.id !== "number" || !/^https?:\/\//.test(tab.url || "")) {
      return;
    }

    if (!isTabReadyForPageInjection(tab)) {
      return;
    }

    await syncTabLimitWarning(tab.id, getHostname(tab.url), { forceCleanup });
  }));
}

async function refreshTabLimitWarning(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);

    if (!/^https?:\/\//.test(tab?.url || "") || !isTabReadyForPageInjection(tab)) {
      return;
    }

    await syncTabLimitWarning(tabId, getHostname(tab.url));
  } catch (_error) {
  }
}

async function getLimitWarningForHost(host) {
  const normalizedHost = normalizeDomain(host);

  if (!normalizedHost) {
    return null;
  }

  const [schedule, usage, settings, pomodoro] = await Promise.all([
    cachedSchedule || loadSchedule(),
    getUsage(),
    cachedSettings || loadSettings(),
    loadPomodoroState()
  ]);

  if (pomodoro.active) {
    return null;
  }

  const now = getTimeParts(schedule.timezone);
  const site = findSiteForHost(schedule, normalizedHost, settings);

  if (!site || !isLimitWarningAllowed(site, settings) || !isSiteInBlockedSlot(site, now)) {
    return null;
  }

  const currentTime = Date.now();

  if (shouldBlockSite(site, now, usage, normalizedHost, currentTime)) {
    return null;
  }

  const remainingSeconds = getRemainingSeconds(site, usage, currentTime);

  if (remainingSeconds <= 0) {
    return null;
  }

  return {
    domain: site.domain,
    remainingSeconds,
    position: getEffectiveLimitWarningPosition(site, settings),
    autoDismissSeconds: getEffectiveLimitWarningAutoDismissSeconds(site, settings),
    severity: remainingSeconds <= LIMIT_WARNING_RED_SECONDS ? "danger" : "warning"
  };
}

async function hideTabLimitWarning(tabId, options = {}) {
  await setTabLimitWarning(tabId, null, options);
}

async function setTabLimitWarning(tabId, warning, { forceCleanup = false } = {}) {
  if (typeof tabId !== "number") {
    return;
  }

  const hasLimitWarning = Boolean(warning && Number.isFinite(Number(warning.remainingSeconds)));

  if (!hasLimitWarning && !forceCleanup && !tabsWithLimitWarnings.has(tabId)) {
    return;
  }

  try {
    const warningPayload = hasLimitWarning
      ? { ...warning, zoomFactor: await getTabZoomFactor(tabId) }
      : warning;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: setFocusTrackerLimitWarning,
      args: [warningPayload]
    });

    if (hasLimitWarning) {
      tabsWithLimitWarnings.add(tabId);
    } else {
      tabsWithLimitWarnings.delete(tabId);
    }
  } catch (_error) {
  }
}

async function getTabZoomFactor(tabId) {
  try {
    return normalizeTabZoomFactor(await chrome.tabs.getZoom(tabId));
  } catch (_error) {
    return 1;
  }
}

function normalizeTabZoomFactor(zoomFactor) {
  const factor = Number(zoomFactor);

  if (!Number.isFinite(factor) || factor <= 0) {
    return 1;
  }

  return Math.max(0.25, Math.min(5, factor));
}

function setFocusTrackerLimitWarning(warning) {
  const hostId = "focus-tracker-limit-warning";
  const stateKey = "__focusTrackerLimitWarningState";
  const yellowThresholdSeconds = 5 * 60;
  const redThresholdSeconds = 60;
  const baseWidthPx = 420;
  const baseEdgePx = 22;
  const baseGutterPx = 32;
  const baseFontSizePx = 16;
  const existingState = globalThis[stateKey];
  // Keep one mutable state object because timers and close handlers outlive each injection refresh.
  const state = existingState && typeof existingState === "object" ? existingState : {};

  state.host = state.host || null;
  state.shadow = state.shadow || null;
  state.timer = state.timer || 0;
  state.autoTimer = state.autoTimer || 0;
  state.showTimer = state.showTimer || 0;
  state.expiresAt = state.expiresAt || 0;
  state.domain = state.domain || "";
  state.position = state.position || "top-center";
  state.zoomFactor = normalizeZoomFactor(state.zoomFactor || 1);
  state.autoDismissSeconds = state.autoDismissSeconds || 0;
  state.dismissedDomain = state.dismissedDomain || "";
  state.dismissedSeverity = state.dismissedSeverity || "";
  globalThis[stateKey] = state;

  function clearTimer(name, clearFn) {
    if (state[name]) {
      clearFn(state[name]);
      state[name] = 0;
    }
  }

  function removeHost({ resetWarning = true } = {}) {
    clearTimer("timer", clearInterval);
    clearTimer("autoTimer", clearTimeout);

    state.host?.remove();
    state.host = null;
    state.shadow = null;

    if (resetWarning) {
      clearTimer("showTimer", clearTimeout);
      state.expiresAt = 0;
      state.domain = "";
      state.autoDismissSeconds = 0;
    }

    globalThis[stateKey] = state;
  }

  function hide() {
    state.dismissedDomain = "";
    state.dismissedSeverity = "";
    removeHost();
  }

  function removeVisibleWarning() {
    if (state.timer) {
      clearInterval(state.timer);
    }

    if (state.autoTimer) {
      clearTimeout(state.autoTimer);
    }

    state.timer = 0;
    state.autoTimer = 0;
    state.host?.remove();
    state.host = null;
    state.shadow = null;
    globalThis[stateKey] = state;
  }

  if (!warning || !Number.isFinite(Number(warning.remainingSeconds))) {
    hide();
    return;
  }

  const remainingSeconds = Math.max(0, Number(warning.remainingSeconds));

  if (remainingSeconds <= 0) {
    hide();
    return;
  }

  const nextDomain = String(warning.domain || "").trim();
  const nextPosition = normalizePosition(warning.position);
  const nextZoomFactor = normalizeZoomFactor(warning.zoomFactor);
  const autoDismissSeconds = Math.max(0, Math.min(60, Math.round(Number(warning.autoDismissSeconds) || 0)));

  if (state.dismissedDomain && state.dismissedDomain !== nextDomain) {
    state.dismissedDomain = "";
    state.dismissedSeverity = "";
  }

  state.expiresAt = Date.now() + remainingSeconds * 1000;
  state.domain = nextDomain;
  state.position = nextPosition;
  state.zoomFactor = nextZoomFactor;
  state.autoDismissSeconds = autoDismissSeconds;

  const nextShowAtSeconds = getNextShowAtSeconds(remainingSeconds);

  if (nextShowAtSeconds <= 0) {
    removeHost({ resetWarning: false });
    return;
  }

  const nextSeverity = getSeverity(nextShowAtSeconds);

  if (state.dismissedDomain === nextDomain && state.dismissedSeverity === nextSeverity) {
    removeHost({ resetWarning: false });
    return;
  }

  const showDelayMs = Math.max(0, (remainingSeconds - nextShowAtSeconds) * 1000);

  if (showDelayMs > 0) {
    scheduleWarning(showDelayMs);
    globalThis[stateKey] = state;
    return;
  }

  if (nextSeverity === "danger" && state.dismissedSeverity === "warning") {
    state.dismissedDomain = "";
    state.dismissedSeverity = "";
  }

  showWarning();

  globalThis[stateKey] = state;

  function scheduleWarning(delayMs) {
    removeVisibleWarning();
    clearTimer("showTimer", clearTimeout);

    state.showTimer = setTimeout(() => {
      state.showTimer = 0;

      if (document.visibilityState === "hidden") {
        globalThis[stateKey] = state;
        return;
      }

      showWarning();
    }, delayMs);
  }

  function showWarning() {
    clearTimer("showTimer", clearTimeout);
    ensureHost();
    render();
    clearTimer("timer", clearInterval);
    state.timer = setInterval(render, 1000);
    scheduleAutoDismiss();
    globalThis[stateKey] = state;
  }

  function scheduleAutoDismiss() {
    clearTimer("autoTimer", clearTimeout);

    if (state.autoDismissSeconds > 0) {
      state.autoTimer = setTimeout(() => {
        dismissCurrentWarning();
      }, state.autoDismissSeconds * 1000);
    }
  }

  function ensureHost() {
    if (state.host?.isConnected && state.shadow) {
      applyHostPosition();
      return;
    }

    const stale = document.getElementById(hostId);

    if (stale) {
      stale.remove();
    }

    const host = document.createElement("div");
    host.id = hostId;
    const root = host.attachShadow({ mode: "open" });

    (document.body || document.documentElement).appendChild(host);
    state.host = host;
    state.shadow = root;
    applyHostPosition();
  }

  function applyHostPosition() {
    if (!state.host) {
      return;
    }

    state.host.style.cssText = getHostStyle(state.position);
  }

  function getHostStyle(position) {
    const scale = getVisualScale();
    const edge = formatPx(baseEdgePx * scale);
    const gutter = formatPx(baseGutterPx * scale);
    const width = formatPx(baseWidthPx * scale);
    const fontSize = formatPx(baseFontSizePx * scale);
    const styles = [
      "all:initial!important",
      "position:fixed!important",
      "display:block!important",
      "box-sizing:border-box!important",
      "margin:0!important",
      "min-width:0!important",
      "max-width:none!important",
      "height:auto!important",
      "max-height:none!important",
      "z-index:2147483646!important",
      `width:min(${width},calc(100vw - ${gutter}))!important`,
      `font-size:${fontSize}!important`,
      "font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important",
      "line-height:normal!important",
      "color-scheme:light!important",
      "contain:layout style paint!important",
      "pointer-events:none!important"
    ];

    if (position.startsWith("top")) {
      styles.push(`top:${edge}!important`);
    } else if (position.startsWith("bottom")) {
      styles.push(`bottom:${edge}!important`);
    } else {
      styles.push("top:50%!important");
    }

    if (position.endsWith("left")) {
      styles.push(`left:${edge}!important`);
    } else if (position.endsWith("right")) {
      styles.push(`right:${edge}!important`);
    } else {
      styles.push("left:50%!important");
    }

    if (position === "center") {
      styles.push("transform:translate(-50%,-50%)!important");
    } else if (position.startsWith("center")) {
      styles.push("transform:translateY(-50%)!important");
    } else if (position.endsWith("center")) {
      styles.push("transform:translateX(-50%)!important");
    }

    return styles.join(";");
  }

  function getVisualScale() {
    return 1 / normalizeZoomFactor(state.zoomFactor);
  }

  function normalizeZoomFactor(zoomFactor) {
    const factor = Number(zoomFactor);

    if (!Number.isFinite(factor) || factor <= 0) {
      return 1;
    }

    return Math.max(0.25, Math.min(5, factor));
  }

  function formatPx(value) {
    const rounded = Math.round(Number(value) * 1000) / 1000;
    return `${rounded}px`;
  }

  function render() {
    const secondsLeft = Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000));

    if (secondsLeft <= 0) {
      hide();
      return;
    }

    ensureHost();

    const severity = getSeverity(secondsLeft);
    const label = severity === "danger" ? "Under 1 minute left" : "Under 5 minutes left";
    ensureWarningShell();

    const warningElement = state.shadow.querySelector(".warning");
    const titleElement = state.shadow.querySelector("[data-warning-title]");
    const remainingElement = state.shadow.querySelector("[data-warning-remaining]");
    const domainElement = state.shadow.querySelector("[data-warning-domain]");

    if (warningElement) {
      warningElement.className = severity === "danger" ? "warning danger" : "warning";
    }

    if (titleElement) {
      titleElement.textContent = label;
    }

    if (remainingElement) {
      remainingElement.textContent = `${formatRemaining(secondsLeft)} before blocking`;
    }

    if (domainElement) {
      domainElement.textContent = state.domain;
      domainElement.hidden = !state.domain;
    }
  }

  function ensureWarningShell() {
    if (!state.shadow || state.shadow.querySelector(".warning")) {
      return;
    }

    state.shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          color-scheme: light;
          font-size: inherit;
          font-family: inherit;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        .warning {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.5em 0.75em;
          align-items: center;
          width: 100%;
          border: 1px solid rgba(120, 53, 15, 0.22);
          border-radius: 0.875em;
          background: rgba(254, 243, 199, 0.96);
          box-shadow: 0 1.125em 2.625em rgba(15, 23, 42, 0.22);
          color: #78350f;
          font: inherit;
          min-height: 3.625em;
          padding: 0.875em 0.875em 0.875em 1em;
          pointer-events: auto;
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
        }

        .warning.danger {
          border-color: rgba(127, 29, 29, 0.28);
          background: rgba(220, 38, 38, 0.96);
          color: #ffffff;
        }

        .dot {
          width: 0.75em;
          height: 0.75em;
          border-radius: 999px;
          background: #f59e0b;
          box-shadow: 0 0 0 0.375em rgba(245, 158, 11, 0.2);
        }

        .danger .dot {
          background: #ffffff;
          box-shadow: 0 0 0 0.375em rgba(255, 255, 255, 0.2);
        }

        .copy {
          display: grid;
          gap: 0.1875em;
          min-width: 0;
        }

        strong {
          font-size: 1em;
          font-weight: 950;
          letter-spacing: 0;
          line-height: 1.15;
        }

        .copy > span {
          font-size: 0.82em;
          font-weight: 800;
          line-height: 1.2;
        }

        .domain {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          opacity: 0.82;
        }

        .close {
          display: grid;
          width: 1.75em;
          height: 1.75em;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: rgba(120, 53, 15, 0.12);
          color: currentColor;
          cursor: pointer;
          font: inherit;
          font-size: 1em;
          font-weight: 950;
          line-height: 1;
          opacity: 0.82;
          padding: 0;
        }

        .close:hover {
          opacity: 1;
          background: rgba(120, 53, 15, 0.18);
        }

        .danger .close {
          background: rgba(255, 255, 255, 0.16);
        }

        .danger .close:hover {
          background: rgba(255, 255, 255, 0.24);
        }
      </style>
      <section class="warning" role="status" aria-live="polite">
        <span class="dot" aria-hidden="true"></span>
        <span class="copy">
          <strong data-warning-title></strong>
          <span data-warning-remaining></span>
          <span class="domain" data-warning-domain hidden></span>
        </span>
        <button class="close" type="button" aria-label="Dismiss limit warning" title="Dismiss limit warning">&times;</button>
      </section>
    `;

    const closeButton = state.shadow.querySelector(".close");
    let closeHandled = false;
    const handleClose = (event) => {
      if (event.type === "pointerdown" && event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (closeHandled) {
        return;
      }

      closeHandled = true;
      dismissCurrentWarning();
    };

    closeButton?.addEventListener("pointerdown", handleClose);
    closeButton?.addEventListener("click", handleClose);
  }

  function dismissCurrentWarning() {
    const secondsLeft = Math.max(0, (state.expiresAt - Date.now()) / 1000);

    state.dismissedDomain = state.domain;
    state.dismissedSeverity = getSeverity(secondsLeft);
    removeVisibleWarning();

    const nextShowAtSeconds = getNextShowAtSeconds(secondsLeft);

    if (nextShowAtSeconds > 0) {
      const delayMs = Math.max(0, (secondsLeft - nextShowAtSeconds) * 1000);

      if (delayMs > 0) {
        scheduleWarning(delayMs);
      } else {
        showWarning();
      }
    }
  }

  function getNextShowAtSeconds(secondsLeft) {
    const wasCurrentDomainDismissed = state.dismissedDomain === state.domain;

    if (secondsLeft > yellowThresholdSeconds) {
      return yellowThresholdSeconds;
    }

    if (secondsLeft > redThresholdSeconds) {
      return wasCurrentDomainDismissed && state.dismissedSeverity === "warning"
        ? redThresholdSeconds
        : secondsLeft;
    }

    return wasCurrentDomainDismissed && state.dismissedSeverity === "danger"
      ? 0
      : secondsLeft;
  }

  function getSeverity(secondsLeft) {
    return secondsLeft <= redThresholdSeconds ? "danger" : "warning";
  }

  function normalizePosition(value) {
    const position = String(value || "").trim();
    const allowed = new Set([
      "top-left",
      "top-center",
      "top-right",
      "center-left",
      "center",
      "center-right",
      "bottom-left",
      "bottom-center",
      "bottom-right"
    ]);

    return allowed.has(position) ? position : "top-center";
  }

  function formatRemaining(seconds) {
    const safeSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));

    if (safeSeconds >= 60) {
      const minutes = Math.floor(safeSeconds / 60);
      const remainder = safeSeconds % 60;
      return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
    }

    return `${safeSeconds}s`;
  }

}

async function broadcastBlockStateUpdated(reason = "state") {
  const message = {
    type: BLOCK_STATE_UPDATED_MESSAGE,
    reason,
    updatedAt: Date.now()
  };

  try {
    await chrome.runtime.sendMessage(message);
  } catch (_error) {
  }

  let tabs = [];

  try {
    tabs = await chrome.tabs.query({});
  } catch (_error) {
    return;
  }

  await Promise.all(tabs.map(async (tab) => {
    if (typeof tab?.id !== "number") {
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (_error) {
    }
  }));
}

async function cleanupStatePreservingBlocks() {
  let tabs = [];

  try {
    tabs = await chrome.tabs.query({});
  } catch (_error) {
    return;
  }

  await Promise.all(tabs.map(async (tab) => {
    if (typeof tab?.id !== "number" || !/^https?:\/\//.test(tab.url || "")) {
      return;
    }

    if (!isTabReadyForPageInjection(tab)) {
      return;
    }

    await cleanupStatePreservingBlock(tab.id, { forceMessage: true });
  }));
}

async function cleanupStatePreservingBlock(tabId, { forceMessage = false } = {}) {
  if (typeof tabId !== "number") {
    return;
  }

  const mayHaveBlock = tabsWithStatePreservingBlocks.has(tabId);

  if (!forceMessage && !mayHaveBlock) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, { type: "focus-tracker-hide-state-blocker" });
  } catch (_error) {
  }

  if (forceMessage || mayHaveBlock) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: removeStatePreservingBlockArtifacts
      });
    } catch (_error) {
    }
  }

  tabsWithStatePreservingBlocks.delete(tabId);
}

function removeStatePreservingBlockArtifacts() {
  const overlayId = "focus-tracker-state-preserving-block";
  const overlayMarker = "focus-tracker-state-preserving-block";
  const overlay = document.getElementById(overlayId);

  if (overlay) {
    overlay.remove();
  }

  document.querySelectorAll(`[data-focus-tracker-overlay="${overlayMarker}"]`).forEach((element) => {
    element.remove();
  });
}

async function getActiveHttpTab() {
  const focusedWindow = await chrome.windows.getLastFocused();

  if (!focusedWindow?.focused || typeof focusedWindow.id !== "number") {
    return null;
  }

  const [tab] = await chrome.tabs.query({ active: true, windowId: focusedWindow.id });

  if (typeof tab?.id !== "number" || !/^https?:\/\//.test(tab.url || "")) {
    return null;
  }

  return tab;
}

function findSiteForHost(schedule, host, settings = {}) {
  if (!host) {
    return null;
  }

  const sites = Array.isArray(schedule.sites) ? schedule.sites : [];
  return sites
    .map((site) => normalizeSite(site))
    .map((site) => applyGlobalBlockOverride(site, settings))
    .find((site) => site.enabled && siteMatchesHost(site, host)) || null;
}

function findSiteForVisualEffects(schedule, host) {
  if (!host) {
    return null;
  }

  const sites = Array.isArray(schedule.sites) ? schedule.sites : [];

  return sites
    .map((site) => normalizeSite(site))
    .find((site) => site.enabled && siteMatchesHost(site, host)) || null;
}

function domainMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch (_error) {
    return "";
  }
}

async function getSiteStatus(domain) {
  const normalizedDomain = normalizeDomain(domain);
  const [schedule, usage, settings, pomodoro] = await Promise.all([loadSchedule(), getUsage(), loadSettings(), loadPomodoroState()]);
  const now = getTimeParts(schedule.timezone);
  const site = findSiteForHost(schedule, normalizedDomain, settings);

  if (!site) {
    return {
      found: false,
      domain: normalizedDomain,
      pomodoro
    };
  }

  return buildSiteUsageState(site, now, usage, settings, pomodoro);
}

async function addExtraTime(domain, minutes, pin = "", tabId = null) {
  const normalizedDomain = normalizeDomain(domain);
  const [schedule, usage, settings, pomodoro] = await Promise.all([loadSchedule(), getUsage(), loadSettings(), loadPomodoroState()]);
  const site = findSiteForHost(schedule, normalizedDomain, settings);

  if (pomodoro.active) {
    throw new Error("Focus session active.");
  }

  if (!site) {
    throw new Error("This website is not in the schedule.");
  }

  if (!isExtraTimeAllowed(site, settings)) {
    throw new Error("Extra time is disabled for this website.");
  }

  if (isExtraTimePinRequired(site, settings)) {
    if (!String(pin || "").trim()) {
      throw new Error("PIN required.");
    }

    if (!await verifyPin(pin, settings)) {
      throw new Error("PIN verification failed.");
    }
  }

  const extraMinutes = Number(minutes);

  if (!Number.isFinite(extraMinutes) || extraMinutes <= 0) {
    throw new Error("Choose how many minutes to add.");
  }

  grantExtraTime(usage, site, Math.min(Math.round(extraMinutes), MAX_EXTRA_TIME_MINUTES) * 60);
  await saveUsage(usage);
  await startActiveUsageTracking(site, tabId);
}

async function cutOffSite(domain) {
  const normalizedDomain = normalizeDomain(domain);
  const [schedule, usage, settings] = await Promise.all([loadSchedule(), getUsage(), loadSettings()]);
  const site = findSiteForHost(schedule, normalizedDomain, settings);

  if (!site) {
    return;
  }

  resetExtraTimeState(usage, site);
  await saveUsage(usage);
  await chrome.storage.local.remove(TRACKING_KEY);
}

async function getUsage() {
  const today = getDateKey();
  const stored = await chrome.storage.local.get([USAGE_KEY, USAGE_HISTORY_KEY]);
  const usage = normalizeUsageSnapshot(stored[USAGE_KEY], today);

  if (usage.date === today) {
    const migratedExtraTime = migrateLegacyExtraTimeCounters(usage);

    if (migratedExtraTime) {
      await saveUsage(usage);
    }

    return usage;
  }

  const history = normalizeUsageHistory(stored[USAGE_HISTORY_KEY]);

  if (Object.keys(usage.sites).length > 0) {
    history[usage.date] = usage;
  }

  await chrome.storage.local.set({
    [USAGE_KEY]: {
      date: today,
      sites: {}
    },
    [USAGE_HISTORY_KEY]: pruneUsageHistory(history)
  });

  return {
    date: today,
    sites: {}
  };
}

async function getUsageData() {
  const usage = await getUsage();
  const stored = await chrome.storage.local.get(USAGE_HISTORY_KEY);
  const history = normalizeUsageHistory(stored[USAGE_HISTORY_KEY]);
  const usageByDay = {
    ...history,
    [usage.date]: usage
  };

  return {
    days: Object.keys(usageByDay).sort().reverse(),
    usageByDay
  };
}

async function saveUsage(usage) {
  await chrome.storage.local.set({ [USAGE_KEY]: normalizeUsageSnapshot(usage, getDateKey()) });
}

function getDateKey() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function ensureUsageEntry(usage, domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return normalizeUsageEntry();
  }

  usage.sites ||= {};
  usage.sites[normalizedDomain] = normalizeUsageEntry(usage.sites[normalizedDomain]);
  return usage.sites[normalizedDomain];
}

function addUsedSeconds(usage, domain, seconds) {
  if (seconds <= 0) {
    return;
  }

  const entry = ensureUsageEntry(usage, domain);
  entry.usedSeconds += seconds;
}

async function startActiveUsageTracking(site, tabId = null) {
  const tracking = {
    domain: site.domain,
    lastTick: Date.now(),
    date: getDateKey()
  };

  if (Number.isFinite(tabId)) {
    tracking.tabId = tabId;
  }

  await chrome.storage.local.set({ [TRACKING_KEY]: tracking });
}

function resetExtraTimeState(usage, site) {
  const entry = ensureUsageEntry(usage, site.domain);

  entry.extraSeconds = 0;
  entry.extraUntil = 0;
  entry.usedSeconds = Math.max(0, entry.usedSeconds);
}

function migrateLegacyExtraTimeCounters(usage, now = Date.now()) {
  let changed = false;

  Object.values(usage?.sites || {}).forEach((entry) => {
    if (!entry || entry.extraUntil || entry.extraSeconds <= 0) {
      return;
    }

    entry.extraSeconds = Math.ceil(entry.extraSeconds);
    entry.extraUntil = now + entry.extraSeconds * 1000;
    changed = true;
  });

  return changed;
}

function grantExtraTime(usage, site, seconds, now = Date.now()) {
  const addedSeconds = Math.max(0, Math.round(Number(seconds) || 0));

  if (addedSeconds <= 0) {
    return;
  }

  const entry = ensureUsageEntry(usage, site.domain);
  const allowanceSeconds = normalizeDailyAllowance(site.dailyAllowanceMinutes) * 60;
  const currentExtraSeconds = Math.ceil(getExtraRemainingSeconds(entry, now));
  const totalExtraSeconds = currentExtraSeconds + addedSeconds;

  entry.usedSeconds = Math.max(entry.usedSeconds, allowanceSeconds);
  entry.extraSeconds = totalExtraSeconds;
  entry.extraUntil = now + totalExtraSeconds * 1000;
}

function getTrackableElapsedSeconds(startTime, endTime) {
  const elapsedSeconds = Math.max(0, (Number(endTime) - Number(startTime)) / 1000);

  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return 0;
  }

  if (elapsedSeconds > MAX_TRACKING_GAP_SECONDS) {
    return 0;
  }

  return elapsedSeconds;
}

function addScreenUsageSeconds(usage, domain, startTime, endTime) {
  const start = Number(startTime);
  const end = Number(endTime);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return false;
  }

  const entry = ensureUsageEntry(usage, domain);
  let cursor = start;

  while (cursor < end) {
    const cursorDate = new Date(cursor);
    const hour = cursorDate.getHours();
    const nextHour = new Date(cursorDate);
    nextHour.setHours(hour + 1, 0, 0, 0);

    const segmentEnd = Math.min(end, nextHour.getTime());
    const seconds = Math.max(0, (segmentEnd - cursor) / 1000);
    entry.screenSeconds += seconds;
    entry.hourlySeconds[hour] += seconds;
    cursor = segmentEnd;
  }

  return true;
}

function getSiteUsageEntry(usage, domain) {
  const normalizedDomain = normalizeDomain(domain);
  const entry = normalizedDomain ? usage.sites?.[normalizedDomain] : {};

  return {
    usedSeconds: Math.max(0, Number(entry?.usedSeconds) || 0),
    extraSeconds: Math.max(0, Number(entry?.extraSeconds) || 0),
    extraUntil: normalizeTimestamp(entry?.extraUntil),
    screenSeconds: Math.max(0, Number(entry?.screenSeconds) || 0),
    hourlySeconds: normalizeHourlySeconds(entry?.hourlySeconds)
  };
}

function normalizeUsageSnapshot(value, fallbackDate = getDateKey()) {
  const date = typeof value?.date === "string" && value.date
    ? value.date
    : fallbackDate;
  const sites = {};

  if (value?.sites && typeof value.sites === "object") {
    Object.entries(value.sites).forEach(([domain, entry]) => {
      const normalizedDomain = normalizeDomain(domain);

      if (normalizedDomain) {
        sites[normalizedDomain] = normalizeUsageEntry(entry);
      }
    });
  }

  return { date, sites };
}

function normalizeUsageEntry(entry = {}) {
  return {
    usedSeconds: Math.max(0, Number(entry.usedSeconds) || 0),
    extraSeconds: Math.max(0, Number(entry.extraSeconds) || 0),
    extraUntil: normalizeTimestamp(entry.extraUntil),
    screenSeconds: Math.max(0, Number(entry.screenSeconds) || 0),
    hourlySeconds: normalizeHourlySeconds(entry.hourlySeconds)
  };
}

function normalizeTimestamp(value) {
  const timestamp = Number(value);

  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function normalizeHourlySeconds(value) {
  return Array.from({ length: 24 }, (_unused, index) => {
    return Math.max(0, Number(Array.isArray(value) ? value[index] : 0) || 0);
  });
}

function normalizeUsageHistory(value) {
  const history = {};

  if (!value || typeof value !== "object") {
    return history;
  }

  Object.entries(value).forEach(([date, snapshot]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      history[date] = normalizeUsageSnapshot(snapshot, date);
    }
  });

  return history;
}

function pruneUsageHistory(history) {
  return Object.fromEntries(
    Object.entries(history)
      .sort(([left], [right]) => right.localeCompare(left))
      .slice(0, MAX_USAGE_HISTORY_DAYS)
  );
}

function getRemainingSeconds(site, usage, now = Date.now()) {
  const extraRemaining = getExtraRemainingSeconds(getSiteUsageEntry(usage, site.domain), now);

  if (extraRemaining > 0) {
    return extraRemaining;
  }

  return getAllowanceRemainingSeconds(site, usage);
}

function getAllowanceRemainingSeconds(site, usage) {
  const entry = getSiteUsageEntry(usage, site.domain);
  const allowanceSeconds = site.dailyAllowanceMinutes * 60;

  return Math.max(0, allowanceSeconds - entry.usedSeconds);
}

function hasTemporaryUnblock(site, usage, now = Date.now()) {
  return getExtraRemainingSeconds(getSiteUsageEntry(usage, site.domain), now) > 0;
}

function getExtraElapsedSeconds(entry, startTime, endTime) {
  const start = Number(startTime);
  const end = Number(endTime);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  const elapsedSeconds = getTrackableElapsedSeconds(start, end);

  if (elapsedSeconds <= 0) {
    return 0;
  }

  return Math.min(elapsedSeconds, getExtraRemainingSeconds(entry, start));
}

function getExtraRemainingSeconds(entry, now = Date.now()) {
  const extraSeconds = Math.max(0, Number(entry?.extraSeconds) || 0);
  const extraUntil = normalizeTimestamp(entry?.extraUntil);

  if (extraUntil <= 0) {
    return extraSeconds;
  }

  const clockRemainingSeconds = Math.max(0, (extraUntil - Number(now)) / 1000);

  return extraSeconds > 0
    ? Math.min(extraSeconds, clockRemainingSeconds)
    : clockRemainingSeconds;
}

function getSiteUsageStates(schedule, now, usage, settings, pomodoro = normalizePomodoroState()) {
  const sites = Array.isArray(schedule.sites) ? schedule.sites : [];
  return sites
    .map((site) => normalizeSite(site))
    .map((site) => applyGlobalBlockOverride(site, settings))
    .filter((site) => site.enabled && site.domain)
    .map((site) => buildSiteUsageState(site, now, usage, settings, pomodoro));
}

function buildSiteUsageState(site, now, usage, settings = {}, pomodoro = normalizePomodoroState()) {
  const entry = getSiteUsageEntry(usage, site.domain);
  const currentTime = Date.now();
  const pomodoroBlocking = isPomodoroBlockingSite(site, pomodoro);

  return {
    found: true,
    domain: site.domain,
    allowExtraTime: pomodoroBlocking ? false : isExtraTimeAllowed(site, settings),
    dailyAllowanceMinutes: site.dailyAllowanceMinutes,
    exceptions: site.exceptions,
    extraSeconds: entry.extraSeconds,
    extraUntil: entry.extraUntil,
    extraRemainingSeconds: getExtraRemainingSeconds(entry, currentTime),
    inBlockedSlot: pomodoroBlocking || isSiteInBlockedSlot(site, now),
    isBlocked: pomodoroBlocking || shouldBlockSite(site, now, usage),
    pinConfigured: Boolean(settings.pinHash),
    pomodoro,
    remainingSeconds: pomodoroBlocking ? 0 : getRemainingSeconds(site, usage, currentTime),
    requiresPinForExtraTime: !pomodoroBlocking && isExtraTimePinRequired(site, settings),
    usedSeconds: entry.usedSeconds
  };
}

function isPomodoroBlockingSite(site, pomodoro = normalizePomodoroState()) {
  return Boolean(pomodoro.active && pomodoro.mode === "standard" && site.domain);
}

function isExtraTimePinRequired(site, settings = {}) {
  if (site?.overrideGlobalSettings) {
    return Boolean(settings.pinHash && site.requirePinForExtraTime);
  }

  return Boolean(settings.pinHash && (settings.requirePinForAllExtraTime || site.requirePinForExtraTime));
}

function isExtraTimeAllowed(site, settings = {}) {
  if (site?.overrideGlobalSettings) {
    return Boolean(site.allowExtraTime);
  }

  return Boolean(settings.allowExtraTimeForAll || site.allowExtraTime);
}

function isLimitWarningAllowed(site, settings = {}) {
  if (site?.overrideGlobalSettings) {
    return site.limitWarnings !== false;
  }

  return Boolean(settings.limitWarnings !== false || site.limitWarnings !== false);
}

function getEffectiveLimitWarningPosition(site, settings = {}) {
  return settings.limitWarnings !== false && !site?.overrideGlobalSettings
    ? normalizeLimitWarningPosition(settings.limitWarningPosition)
    : normalizeLimitWarningPosition(site?.limitWarningPosition);
}

function getEffectiveLimitWarningAutoDismissSeconds(site, settings = {}) {
  const useGlobal = settings.limitWarnings !== false && !site?.overrideGlobalSettings;
  const autoDismissEnabled = useGlobal
    ? Boolean(settings.limitWarningAutoDismiss)
    : Boolean(site?.limitWarningAutoDismiss);

  if (!autoDismissEnabled) {
    return 0;
  }

  return useGlobal
    ? normalizeLimitWarningAutoDismissSeconds(settings.limitWarningAutoDismissSeconds)
    : normalizeLimitWarningAutoDismissSeconds(site?.limitWarningAutoDismissSeconds);
}

function normalizeLimitWarningPosition(value) {
  const position = String(value || "").trim();
  const allowed = new Set([
    "top-left",
    "top-center",
    "top-right",
    "center-left",
    "center",
    "center-right",
    "bottom-left",
    "bottom-center",
    "bottom-right"
  ]);

  return allowed.has(position) ? position : DEFAULT_LIMIT_WARNING_POSITION;
}

function normalizeLimitWarningAutoDismissSeconds(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return DEFAULT_LIMIT_WARNING_AUTO_DISMISS_SECONDS;
  }

  return Math.max(1, Math.min(60, Math.round(seconds)));
}

function getTimeParts(timezone = "local") {
  if (!timezone || timezone === "local") {
    const now = new Date();
    return {
      day: now.getDay(),
      minutes: now.getHours() * 60 + now.getMinutes()
    };
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase();
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);

    return {
      day: DAY_ALIASES.get(weekday) ?? new Date().getDay(),
      minutes: hour * 60 + minute
    };
  } catch {
    return getTimeParts("local");
  }
}

function createRedirectRule(id, site, exceptionDomains = []) {
  const condition = {
    requestDomains: site.domains,
    resourceTypes: ["main_frame"]
  };
  const excludedRequestDomains = getExceptionDomains([
    { exceptions: exceptionDomains },
    site
  ]);

  if (excludedRequestDomains.length > 0) {
    condition.excludedRequestDomains = excludedRequestDomains;
  }

  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: getBlockedPageUrl(site.domain || site.domains[0])
      }
    },
    condition
  };
}

function createStrictPomodoroRule(pomodoro) {
  const excludedRequestDomains = getStrictPomodoroExcludedDomains(pomodoro);
  const condition = {
    regexFilter: "^https?://",
    resourceTypes: ["main_frame"]
  };

  if (excludedRequestDomains.length > 0) {
    condition.excludedRequestDomains = excludedRequestDomains;
  }

  return {
    id: 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: getPomodoroBlockedPageUrl()
      }
    },
    condition
  };
}

function getStrictPomodoroExcludedDomains(pomodoro) {
  return Array.from(new Set([
    ...normalizeWhitelist(pomodoro?.whitelist),
    chrome.runtime.id
  ].filter(Boolean)));
}

function isStrictPomodoroAllowed(host, pomodoro) {
  const normalizedHost = normalizeDomain(host);
  return normalizeWhitelist(pomodoro?.whitelist).some((domain) => domainMatches(normalizedHost, domain));
}

function getBlockedPageUrl(domain, targetUrl = "") {
  const params = new URLSearchParams({ site: domain || "" });
  const target = normalizeHttpUrl(targetUrl);

  if (target) {
    params.set("target", target);
  }

  return chrome.runtime.getURL(`${BLOCKED_PAGE.slice(1)}?${params.toString()}`);
}

function getPomodoroBlockedPageUrl(targetUrl = "") {
  const params = new URLSearchParams({ pomodoro: "1" });
  const target = normalizeHttpUrl(targetUrl);

  if (target) {
    params.set("target", target);
  }

  return chrome.runtime.getURL(`${BLOCKED_PAGE.slice(1)}?${params.toString()}`);
}

function getResumeTargetUrl(targetUrl, fallbackDomain) {
  const directUrl = normalizeHttpUrl(targetUrl);

  if (directUrl) {
    return directUrl;
  }

  const normalizedDomain = normalizeDomain(fallbackDomain);
  return normalizedDomain ? `https://${normalizedDomain}/` : "";
}

function normalizeHttpUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  const text = value.trim();

  if (!/^https?:\/\//i.test(text)) {
    return "";
  }

  try {
    return new URL(text).toString();
  } catch (_error) {
    return "";
  }
}

async function replaceDynamicRules(rules) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((rule) => rule.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: rules
  });
}

async function saveState(state) {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

async function updateBadge(activeCount, hasError = false) {
  const text = hasError ? "!" : typeof activeCount === "string" ? activeCount : activeCount > 0 ? String(activeCount) : "";
  const color = hasError ? "#b42318" : "#2563eb";

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}

function serializeError(error) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message || "Something went wrong.").replace(/^Error:\s*/, "");
  }

  return String(error || "Something went wrong.").replace(/^Error:\s*/, "");
}
