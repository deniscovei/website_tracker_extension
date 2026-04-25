const REFRESH_ALARM = "refresh-block-rules";
const REFRESH_MINUTES = 0.5;
const BLOCKED_PAGE = "/blocked.html";
const SCHEDULE_KEY = "scheduleBlockerSchedule";
const STATE_KEY = "scheduleBlockerState";
const USAGE_KEY = "scheduleBlockerUsage";
const USAGE_HISTORY_KEY = "scheduleBlockerUsageHistory";
const TRACKING_KEY = "scheduleBlockerTracking";
const SCREEN_TRACKING_KEY = "scheduleBlockerScreenTracking";
const SETTINGS_KEY = "websiteTrackerSettings";
const MAX_USAGE_HISTORY_DAYS = 30;
const MAX_TRACKING_GAP_SECONDS = 2 * 60;
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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
  }
});

chrome.tabs.onActivated.addListener(() => {
  void tick();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    void tick();
  }
});

chrome.windows.onFocusChanged.addListener(() => {
  void tick();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "get-schedule-data") {
    accrueScreenUsage()
      .then(() => accrueActiveUsage())
      .then(() => refreshRules())
      .then(() => getScheduleData())
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "save-schedule") {
    saveSchedule(message.schedule)
      .then((schedule) => Promise.all([refreshRules(), loadPublicSettings()]).then(([state, settings]) => ({ schedule, state, settings })))
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "save-settings") {
    saveSettings(message.settings)
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  if (message?.type === "refresh-rules") {
    accrueScreenUsage()
      .then(() => accrueActiveUsage())
      .then(() => refreshRules())
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

  if (message?.type === "add-extra-time") {
    addExtraTime(message.domain, message.minutes, message.pin)
      .then(() => refreshRules())
      .then(() => getSiteStatus(message.domain))
      .then((status) => sendResponse({ ok: true, status }))
      .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

    return true;
  }

  return false;
});

async function initialize() {
  await chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_MINUTES });
  await refreshRules();
}

async function tick() {
  try {
    await accrueScreenUsage();
    await accrueActiveUsage();
    const state = await refreshRules();
    await enforceActiveTabBlock(state);
  } catch (error) {
    console.error("Could not update scheduled blocking state.", error);
  }
}

async function refreshRules() {
  try {
    const [schedule, usage, settings] = await Promise.all([
      loadSchedule(),
      getUsage(),
      loadSettings()
    ]);
    const now = getTimeParts(schedule.timezone);
    const activeSites = getActiveSites(schedule, now, usage);
    const rules = activeSites.map((site, index) => createRedirectRule(index + 1, site));

    await replaceDynamicRules(rules);

    const state = {
      activeSites,
      error: "",
      lastUpdated: Date.now(),
      siteUsage: getSiteUsageStates(schedule, now, usage, settings),
      timezone: schedule.timezone || "local"
    };

    await saveState(state);
    await updateBadge(activeSites.length);
    return state;
  } catch (error) {
    console.error("Could not refresh scheduled blocking rules.", error);
    await replaceDynamicRules([]);
    await saveState({
      activeSites: [],
      error: serializeError(error),
      lastUpdated: Date.now(),
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
  const [schedule, settings, stored] = await Promise.all([
    loadSchedule(),
    loadPublicSettings(),
    chrome.storage.local.get(STATE_KEY)
  ]);
  const state = stored[STATE_KEY] || await refreshRules();

  return {
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

  if (value.clearPin) {
    pinHash = "";
  } else if (value.pin) {
    const pin = String(value.pin);

    if (!/^\d{4}$/.test(pin)) {
      throw new Error("Use exactly 4 digits for the PIN.");
    }

    pinHash = await hashPin(pin);
  }

  const requirePinForAllExtraTime = Boolean(value.requirePinForAllExtraTime) && Boolean(pinHash);
  const next = normalizeSettingsForStorage({
    pinHash,
    requirePinForAllExtraTime
  });

  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return publicSettings(next);
}

function normalizeSettingsForStorage(value = {}) {
  return {
    pinHash: typeof value.pinHash === "string" ? value.pinHash : "",
    requirePinForAllExtraTime: Boolean(value.requirePinForAllExtraTime)
  };
}

function publicSettings(settings) {
  return {
    hasPin: Boolean(settings.pinHash),
    requirePinForAllExtraTime: Boolean(settings.pinHash && settings.requirePinForAllExtraTime)
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
    intervals: normalizeIntervalsForStorage(site.intervals),
    dailyAllowanceMinutes: normalizeDailyAllowance(site.dailyAllowanceMinutes ?? site.allowanceMinutes),
    allowExtraTime: Boolean(site.allowExtraTime),
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

function getActiveSites(schedule, now, usage) {
  const sites = Array.isArray(schedule.sites)
    ? schedule.sites
    : Array.isArray(schedule.websites)
      ? schedule.websites
      : [];

  return sites
    .map((site) => normalizeSite(site))
    .filter((site) => site.domains.length > 0)
    .filter((site) => shouldBlockSite(site, now, usage))
    .map((site) => ({
      name: site.name,
      domain: site.domain,
      allowExtraTime: site.allowExtraTime,
      domains: site.domains
    }));
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
    domains: Array.from(new Set(domains)),
    intervals,
    dailyAllowanceMinutes: normalizeDailyAllowance(site.dailyAllowanceMinutes ?? site.allowanceMinutes),
    allowExtraTime: Boolean(site.allowExtraTime),
    requirePinForExtraTime: Boolean(site.requirePinForExtraTime)
  };
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

function shouldBlockSite(site, now, usage) {
  if (!isSiteInBlockedSlot(site, now)) {
    return false;
  }

  return getRemainingSeconds(site, usage) <= 0;
}

function isSiteInBlockedSlot(site, now) {
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

async function accrueActiveUsage() {
  const [schedule, usage, trackingResult] = await Promise.all([
    loadSchedule(),
    getUsage(),
    chrome.storage.local.get(TRACKING_KEY)
  ]);
  const now = getTimeParts(schedule.timezone);
  const today = getDateKey();
  const currentTime = Date.now();
  const previous = trackingResult[TRACKING_KEY];
  let changedUsage = false;

  if (previous?.date === today && previous?.domain && Number.isFinite(previous.lastTick)) {
    const previousSite = findSiteForHost(schedule, previous.domain);

    if (previousSite && isSiteInBlockedSlot(previousSite, now)) {
      const remainingSeconds = getRemainingSeconds(previousSite, usage);
      const elapsedSeconds = getTrackableElapsedSeconds(previous.lastTick, currentTime);
      addUsedSeconds(usage, previousSite.domain, Math.min(elapsedSeconds, remainingSeconds));
      changedUsage = elapsedSeconds > 0;
    }
  }

  if (changedUsage) {
    await saveUsage(usage);
  }

  const activeInfo = await getActiveTrackedInfo(schedule, now, usage);

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

async function getActiveTrackedInfo(schedule, now, usage) {
  const tab = await getActiveHttpTab();

  if (!tab) {
    return null;
  }

  const host = getHostname(tab.url);
  const site = findSiteForHost(schedule, host);

  if (!site || !isSiteInBlockedSlot(site, now) || getRemainingSeconds(site, usage) <= 0) {
    return null;
  }

  return { site, tab };
}

async function enforceActiveTabBlock(state) {
  const tab = await getActiveHttpTab();

  if (!tab) {
    return;
  }

  const host = getHostname(tab.url);
  const blockedSite = (state.activeSites || []).find((site) => {
    return (site.domains || []).some((domain) => domainMatches(host, domain));
  });

  if (!blockedSite) {
    return;
  }

  await chrome.tabs.update(tab.id, { url: getBlockedPageUrl(blockedSite.domain || blockedSite.domains[0]) });
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

function findSiteForHost(schedule, host) {
  if (!host) {
    return null;
  }

  const sites = Array.isArray(schedule.sites) ? schedule.sites : [];

  return sites
    .map((site) => normalizeSite(site))
    .find((site) => site.domains.some((domain) => domainMatches(host, domain))) || null;
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
  const [schedule, usage, settings] = await Promise.all([loadSchedule(), getUsage(), loadSettings()]);
  const now = getTimeParts(schedule.timezone);
  const site = findSiteForHost(schedule, normalizedDomain);

  if (!site) {
    return {
      found: false,
      domain: normalizedDomain
    };
  }

  return buildSiteUsageState(site, now, usage, settings);
}

async function addExtraTime(domain, minutes, pin = "") {
  const normalizedDomain = normalizeDomain(domain);
  const [schedule, usage, settings] = await Promise.all([loadSchedule(), getUsage(), loadSettings()]);
  const site = findSiteForHost(schedule, normalizedDomain);

  if (!site) {
    throw new Error("This website is not in the schedule.");
  }

  if (!site.allowExtraTime) {
    throw new Error("Extra time is disabled for this website.");
  }

  if (isExtraTimePinRequired(site, settings) && !await verifyPin(pin, settings)) {
    throw new Error("Incorrect PIN.");
  }

  const extraMinutes = Number(minutes);

  if (!Number.isFinite(extraMinutes) || extraMinutes <= 0) {
    throw new Error("Choose how many minutes to add.");
  }

  addExtraSeconds(usage, site.domain, Math.min(Math.round(extraMinutes), 240) * 60);
  await saveUsage(usage);
  await chrome.storage.local.remove(TRACKING_KEY);
}

async function getUsage() {
  const today = getDateKey();
  const stored = await chrome.storage.local.get([USAGE_KEY, USAGE_HISTORY_KEY]);
  const usage = normalizeUsageSnapshot(stored[USAGE_KEY], today);

  if (usage.date === today) {
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

function addExtraSeconds(usage, domain, seconds) {
  const entry = ensureUsageEntry(usage, domain);
  entry.extraSeconds += Math.max(0, seconds);
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
    screenSeconds: Math.max(0, Number(entry.screenSeconds) || 0),
    hourlySeconds: normalizeHourlySeconds(entry.hourlySeconds)
  };
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

function getRemainingSeconds(site, usage) {
  const entry = getSiteUsageEntry(usage, site.domain);
  const totalSeconds = site.dailyAllowanceMinutes * 60 + entry.extraSeconds;

  return Math.max(0, totalSeconds - entry.usedSeconds);
}

function getSiteUsageStates(schedule, now, usage, settings) {
  const sites = Array.isArray(schedule.sites) ? schedule.sites : [];

  return sites
    .map((site) => normalizeSite(site))
    .filter((site) => site.domain)
    .map((site) => buildSiteUsageState(site, now, usage, settings));
}

function buildSiteUsageState(site, now, usage, settings = {}) {
  const entry = getSiteUsageEntry(usage, site.domain);

  return {
    found: true,
    domain: site.domain,
    allowExtraTime: site.allowExtraTime,
    dailyAllowanceMinutes: site.dailyAllowanceMinutes,
    extraSeconds: entry.extraSeconds,
    inBlockedSlot: isSiteInBlockedSlot(site, now),
    isBlocked: shouldBlockSite(site, now, usage),
    pinConfigured: Boolean(settings.pinHash),
    remainingSeconds: getRemainingSeconds(site, usage),
    requiresPinForExtraTime: isExtraTimePinRequired(site, settings),
    usedSeconds: entry.usedSeconds
  };
}

function isExtraTimePinRequired(site, settings = {}) {
  return Boolean(settings.pinHash && (settings.requirePinForAllExtraTime || site.requirePinForExtraTime));
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
  } catch (error) {
    console.warn(`Invalid timezone "${timezone}", using browser local time.`, error);
    return getTimeParts("local");
  }
}

function createRedirectRule(id, site) {
  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: getBlockedPageUrl(site.domain || site.domains[0])
      }
    },
    condition: {
      requestDomains: site.domains,
      resourceTypes: ["main_frame"]
    }
  };
}

function getBlockedPageUrl(domain) {
  return chrome.runtime.getURL(`${BLOCKED_PAGE.slice(1)}?site=${encodeURIComponent(domain)}`);
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
  const text = hasError ? "!" : activeCount > 0 ? String(activeCount) : "";
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
