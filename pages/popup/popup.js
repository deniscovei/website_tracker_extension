const DAYS = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
  { id: "sun", label: "S" }
];

let popupUsagePausePort = null;

try {
  popupUsagePausePort = chrome.runtime.connect({ name: "focus-tracker-popup" });
} catch (_error) {
  popupUsagePausePort = null;
}

const DEFAULT_INTERVAL = {
  start: "09:00",
  end: "17:00"
};

const summary = document.getElementById("summary");
const activeSites = document.getElementById("active-sites");
const updated = document.getElementById("updated");
const statusPanel = document.querySelector(".status");
const back = document.getElementById("back");
const scheduleTab = document.getElementById("schedule-tab");
const usageTab = document.getElementById("usage-tab");
const focusTab = document.getElementById("focus-tab");
const listView = document.getElementById("list-view");
const editorView = document.getElementById("editor-view");
const usageView = document.getElementById("usage-view");
const focusView = document.getElementById("focus-view");
const siteList = document.getElementById("site-list");
const newSite = document.getElementById("new-site");
const siteForm = document.getElementById("site-form");
const siteDomain = document.getElementById("site-domain");
const exceptionInput = document.getElementById("exception-input");
const addException = document.getElementById("add-exception");
const exceptionWarning = document.getElementById("exception-warning");
const exceptionList = document.getElementById("exception-list");
const blockModeRadios = Array.from(document.querySelectorAll('input[name="block-mode"]'));
const blockEnabled = document.getElementById("block-enabled");
const blockDetails = document.getElementById("block-details");
const blockExpander = document.getElementById("block-expander");
const blockModeOptions = document.getElementById("block-mode-options");
const blockGlobalNote = document.getElementById("block-global-note");
const dailyAllowance = document.getElementById("daily-allowance");
const allowExtraTime = document.getElementById("allow-extra-time");
const grayscaleSite = document.getElementById("grayscale-site");
const grayscaleDetails = document.getElementById("grayscale-details");
const grayscaleExpander = document.getElementById("grayscale-expander");
const grayscaleSiteOptions = document.getElementById("grayscale-site-options");
const grayscaleModeRadios = Array.from(document.querySelectorAll('input[name="grayscale-mode"]'));
const grayscaleSlotHeading = document.getElementById("grayscale-slot-heading");
const grayscaleIntervalList = document.getElementById("grayscale-interval-list");
const addGrayscaleInterval = document.getElementById("add-grayscale-interval");
const redLightSite = document.getElementById("red-light-site");
const redLightDetails = document.getElementById("red-light-details");
const redLightExpander = document.getElementById("red-light-expander");
const redLightSiteOptions = document.getElementById("red-light-site-options");
const redLightModeRadios = Array.from(document.querySelectorAll('input[name="red-light-mode"]'));
const redLightSlotHeading = document.getElementById("red-light-slot-heading");
const redLightIntervalList = document.getElementById("red-light-interval-list");
const addRedLightInterval = document.getElementById("add-red-light-interval");
const requirePinExtra = document.getElementById("require-pin-extra");
const requirePinExtraRow = document.getElementById("require-pin-extra-row");
const slotHeading = document.getElementById("slot-heading");
const intervalList = document.getElementById("interval-list");
const addInterval = document.getElementById("add-interval");
const deleteSite = document.getElementById("delete-site");
const saveSite = document.getElementById("save-site");
const editorBack = document.getElementById("editor-back");
const formError = document.getElementById("form-error");
const blockAll = document.getElementById("block-all");
const blockAllRow = document.getElementById("block-all-global-row");
const pinGlobal = document.getElementById("pin-global");
const pinGlobalRow = document.getElementById("pin-global-row");
const globalExtraTime = document.getElementById("global-extra-time");
const globalExtraTimeRow = document.getElementById("extra-time-global-row");
const globalGrayscale = document.getElementById("global-grayscale");
const globalGrayscaleDetails = document.getElementById("global-grayscale-details");
const globalGrayscaleExpander = document.getElementById("global-grayscale-expander");
const globalGrayscaleRow = document.getElementById("grayscale-global-row");
const globalGrayscaleOptions = document.getElementById("global-grayscale-options");
const globalGrayscaleModeRadios = Array.from(document.querySelectorAll('input[name="global-grayscale-mode"]'));
const globalGrayscaleAllWebsites = document.getElementById("global-grayscale-all-websites");
const globalGrayscaleAllWebsitesRow = document.getElementById("global-grayscale-all-websites-row");
const globalGrayscaleSlotHeading = document.getElementById("global-grayscale-slot-heading");
const globalGrayscaleIntervalList = document.getElementById("global-grayscale-interval-list");
const addGlobalGrayscaleInterval = document.getElementById("add-global-grayscale-interval");
const globalRedLight = document.getElementById("global-red-light");
const globalRedLightDetails = document.getElementById("global-red-light-details");
const globalRedLightExpander = document.getElementById("global-red-light-expander");
const globalRedLightRow = document.getElementById("red-light-global-row");
const globalRedLightOptions = document.getElementById("global-red-light-options");
const globalRedLightModeRadios = Array.from(document.querySelectorAll('input[name="global-red-light-mode"]'));
const globalRedLightAllWebsites = document.getElementById("global-red-light-all-websites");
const globalRedLightAllWebsitesRow = document.getElementById("global-red-light-all-websites-row");
const globalRedLightSlotHeading = document.getElementById("global-red-light-slot-heading");
const globalRedLightIntervalList = document.getElementById("global-red-light-interval-list");
const addGlobalRedLightInterval = document.getElementById("add-global-red-light-interval");
const globalSettingsStatus = document.getElementById("global-settings-status");
const extraTimeGlobalNote = document.getElementById("extra-time-global-note");
const pinGlobalNote = document.getElementById("pin-global-note");
const grayscaleGlobalNote = document.getElementById("grayscale-global-note");
const redLightGlobalNote = document.getElementById("red-light-global-note");
const createPin = document.getElementById("create-pin");
const changePin = document.getElementById("change-pin");
const pinEditor = document.getElementById("pin-editor");
const pinCode = document.getElementById("pin-code");
const pinStatus = document.getElementById("pin-status");
const togglePinVisibility = document.getElementById("toggle-pin-visibility");
const savePin = document.getElementById("save-pin");
const analyticsSummary = document.getElementById("analytics-summary");
const prevWeek = document.getElementById("prev-week");
const nextWeek = document.getElementById("next-week");
const usageTotal = document.getElementById("usage-total");
const weekRange = document.getElementById("week-range");
const weekTrend = document.getElementById("week-trend");
const weekSelectedLabel = document.getElementById("week-selected-label");
const weekSelectedTotal = document.getElementById("week-selected-total");
const weekAverageTotal = document.getElementById("week-average-total");
const weekChart = document.getElementById("week-chart");
const prevHour = document.getElementById("prev-hour");
const nextHour = document.getElementById("next-hour");
const usagePeak = document.getElementById("usage-peak");
const usageCount = document.getElementById("usage-count");
const hourChart = document.getElementById("hour-chart");
const categoryLegend = document.getElementById("category-legend");
const categoryDetail = document.getElementById("category-detail");
const categoryDetailTitle = document.getElementById("category-detail-title");
const categoryDetailMeta = document.getElementById("category-detail-meta");
const categoryDetailChart = document.getElementById("category-detail-chart");
const categoryDetailSites = document.getElementById("category-detail-sites");
const usagePie = document.getElementById("usage-pie");
const usagePieTooltip = document.getElementById("usage-pie-tooltip");
const usagePieLegend = document.getElementById("usage-pie-legend");
const shareCompact = document.getElementById("share-compact");
const shareAll = document.getElementById("share-all");
const usageSites = document.getElementById("usage-sites");
const usageShowMore = document.getElementById("usage-show-more");
const pomodoroPanel = document.getElementById("pomodoro-panel");
const pomodoroInactive = document.getElementById("pomodoro-inactive");
const pomodoroActive = document.getElementById("pomodoro-active");
const pomodoroModeRadios = Array.from(document.querySelectorAll('input[name="pomodoro-mode"]'));
const pomodoroWhitelistField = document.getElementById("pomodoro-whitelist-field");
const pomodoroWhitelist = document.getElementById("pomodoro-whitelist");
const pomodoroDial = document.getElementById("pomodoro-dial");
const pomodoroDurationValue = document.getElementById("pomodoro-duration-value");
const pomodoroStart = document.getElementById("pomodoro-start");
const pomodoroStop = document.getElementById("pomodoro-stop");
const pomodoroTimer = document.getElementById("pomodoro-timer");
const pomodoroActiveMode = document.getElementById("pomodoro-active-mode");
const pomodoroStatsToggle = document.getElementById("pomodoro-stats-toggle");
const pomodoroStatsPanel = document.getElementById("pomodoro-stats-panel");
const pomodoroStatsDate = document.getElementById("pomodoro-stats-date");
const pomodoroStatsSubtitle = document.getElementById("pomodoro-stats-subtitle");
const pomodoroStatsTotal = document.getElementById("pomodoro-stats-total");
const pomodoroStatsSessions = document.getElementById("pomodoro-stats-sessions");
const pomodoroStatsCompleted = document.getElementById("pomodoro-stats-completed");
const pomodoroStatsStreak = document.getElementById("pomodoro-stats-streak");
const pomodoroWeekTotal = document.getElementById("pomodoro-week-total");
const pomodoroWeekBars = document.getElementById("pomodoro-week-bars");
const pomodoroHistoryCount = document.getElementById("pomodoro-history-count");
const pomodoroHistoryList = document.getElementById("pomodoro-history-list");
const pomodoroHistoryEmpty = document.getElementById("pomodoro-history-empty");

const ALL_DAY_INTERVAL = {
  start: "00:00",
  end: "00:00"
};

const COMPACT_SITE_LIMIT = 8;
const WEBSITE_LIST_LIMIT = 8;
const OTHER_WEBSITES_LABEL = "Other websites";
const SETTINGS_KEY = "websiteTrackerSettings";
const POMODORO_DRAFT_KEY = "scheduleBlockerPomodoroWhitelistDraft";
const PREFERRED_POMODORO_MINUTES_KEY = "preferredPomodoroMinutes";
const DEFAULT_POMODORO_MINUTES = 30;
const MAX_POMODORO_MINUTES = 120;

const PIE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#f59e0b",
  "#0ea5e9",
  "#6366f1",
  "#ef4444",
  "#64748b"
];

const CATEGORY_COLORS = {
  social: "#2563eb",
  video: "#7c3aed",
  work: "#0ea5e9",
  shopping: "#f59e0b",
  news: "#ef4444",
  learning: "#16a34a",
  games: "#db2777",
  other: "#64748b"
};

const CATEGORY_LABELS = {
  social: "Social",
  video: "Video",
  work: "Work",
  shopping: "Shopping",
  news: "News",
  learning: "Learning",
  games: "Games",
  other: "Other"
};

const CATEGORY_MATCHERS = [
  { id: "social", patterns: ["facebook", "instagram", "tiktok", "twitter", "x.com", "snapchat", "reddit", "pinterest", "threads", "linkedin", "discord", "whatsapp", "telegram"] },
  { id: "video", patterns: ["youtube", "netflix", "twitch", "hulu", "disney", "primevideo", "max.com", "vimeo", "crunchyroll"] },
  { id: "work", patterns: ["github", "gitlab", "notion", "slack", "teams.microsoft", "atlassian", "jira", "trello", "asana", "figma", "linear", "docs.google", "drive.google", "calendar.google", "mail.google", "outlook", "office", "zoom"] },
  { id: "shopping", patterns: ["amazon", "ebay", "etsy", "aliexpress", "walmart", "target", "shopify", "temu", "shein"] },
  { id: "news", patterns: ["news", "nytimes", "washingtonpost", "bbc", "cnn", "reuters", "apnews", "theguardian", "bloomberg", "wsj", "medium", "substack"] },
  { id: "learning", patterns: ["wikipedia", "coursera", "udemy", "khanacademy", "stackoverflow", "stackexchange", "mdn", "freecodecamp", "duolingo", "openai", "docs."] },
  { id: "games", patterns: ["steam", "epicgames", "roblox", "minecraft", "chess", "lichess", "tetr", "pokemon"] }
];

let schedule = {
  timezone: "local",
  sites: []
};
let state = null;
let settings = {
  hasPin: false,
  blockAllForAll: false,
  requirePinForAllExtraTime: false,
  allowExtraTimeForAll: false,
  grayscaleForAll: false,
  grayscaleApplyToAllWebsites: false,
  grayscaleForAllMode: "always",
  grayscaleIntervalsForAll: [],
  redLightForAll: false,
  redLightApplyToAllWebsites: false,
  redLightForAllMode: "always",
  redLightIntervalsForAll: [],
  effectIntervalsForAll: [],
  pinValue: ""
};
let pomodoro = {
  active: false,
  until: 0,
  mode: "standard",
  whitelist: []
};
let editingIndex = null;
let usageData = {
  days: [],
  usageByDay: {}
};
let selectedPieDomain = "";
let highlightedPieDomain = "";
let selectedCategory = "";
let highlightedCategory = "";
let selectedHour = null;
let highlightedHour = null;
let shareMode = "compact";
let websitesExpanded = false;
let selectedWeekDay = "";
let popupPinVisible = false;
let pinEditorOpen = false;
let pinSaveInFlight = false;
let globalSettingsSaveInFlight = false;
let globalSettingsSaveQueued = false;
let editorAutosaveTimer = 0;
let editorAutosaveInFlight = false;
let editorAutosaveQueued = false;
let pomodoroTickTimer = 0;
let extraTimeTickTimer = 0;
let pomodoroMutationStartedAt = 0;
let pomodoroStatsVisible = false;
let blockDetailsExpanded = false;
let grayscaleDetailsExpanded = false;
let redLightDetailsExpanded = false;
let globalGrayscaleDetailsExpanded = false;
let globalRedLightDetailsExpanded = false;
let selectedPomodoroStatsDay = dateToDayKey(new Date());
let pomodoroStatsData = null;
let selectedUsageDay = dateToDayKey(new Date());
let visibleWeekDay = selectedUsageDay;
let currentDaySites = [];
let currentHourlyTotals = [];
let currentHourlyCategories = [];
let currentContext = {
  days: [],
  sites: [],
  totalSeconds: 0
};

scheduleTab?.addEventListener("click", () => {
  showScheduleView();
});

usageTab?.addEventListener("click", () => {
  void showUsageView();
});

focusTab?.addEventListener("click", () => {
  showFocusView();
});

blockModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    syncBlockingModeView();
    queueEditorAutosave({ immediate: true });
  });
});

blockEnabled?.addEventListener("change", () => {
  if (blockEnabled.checked) {
    blockDetailsExpanded = true;
  }
  syncBlockingModeView();
  clearFormError();
  queueEditorAutosave({ immediate: true });
});

grayscaleModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    clearFormError();
    syncSiteVisualEffectMenus();
    queueEditorAutosave({ immediate: true });
  });
});

redLightModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    clearFormError();
    syncSiteVisualEffectMenus();
    queueEditorAutosave({ immediate: true });
  });
});

prevWeek?.addEventListener("click", () => {
  shiftUsageWeek(-1);
});

nextWeek?.addEventListener("click", () => {
  shiftUsageWeek(1);
});

prevHour?.addEventListener("click", () => {
  shiftSelectedHour(-1);
});

nextHour?.addEventListener("click", () => {
  shiftSelectedHour(1);
});

pinGlobal?.addEventListener("change", () => {
  void saveGlobalSettingsToggle();
});

blockAll?.addEventListener("change", () => {
  void saveGlobalSettingsToggle();
});

globalExtraTime?.addEventListener("change", () => {
  void saveGlobalSettingsToggle();
});

globalGrayscale?.addEventListener("change", () => {
  if (globalGrayscale.checked) {
    globalGrayscaleDetailsExpanded = true;
  }
  syncGlobalVisualEffectMenus();
  void saveGlobalSettingsToggle();
});

globalGrayscaleModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    syncGlobalVisualEffectMenus();
    void saveGlobalSettingsToggle();
  });
});

globalGrayscaleAllWebsites?.addEventListener("change", () => {
  void saveGlobalSettingsToggle();
});

globalRedLight?.addEventListener("change", () => {
  if (globalRedLight.checked) {
    globalRedLightDetailsExpanded = true;
  }
  syncGlobalVisualEffectMenus();
  void saveGlobalSettingsToggle();
});

globalRedLightModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    syncGlobalVisualEffectMenus();
    void saveGlobalSettingsToggle();
  });
});

globalRedLightAllWebsites?.addEventListener("change", () => {
  void saveGlobalSettingsToggle();
});

pinCode?.addEventListener("input", () => {
  pinCode.value = sanitizePinValue(pinCode.value);
  pinCode.setCustomValidity("");
  updatePinDraftStatus();
});

pinCode?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void savePinValue();
  }
});

createPin?.addEventListener("click", () => {
  openPinEditor();
});

changePin?.addEventListener("click", () => {
  openPinEditor({
    value: settings.pinValue || "",
    visible: Boolean(settings.pinValue)
  });
});

togglePinVisibility?.addEventListener("click", () => {
  popupPinVisible = !popupPinVisible;
  setPinVisibility(pinCode, togglePinVisibility, popupPinVisible);
  updatePinDraftStatus();
});

savePin?.addEventListener("click", () => {
  void savePinValue();
});

siteDomain?.addEventListener("input", () => {
  clearFormError();
  clearExceptionWarning();
  queueEditorAutosave();
});

exceptionInput?.addEventListener("input", () => {
  clearFormError();
  clearExceptionWarning();
});

exceptionInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  addExceptionFromInput();
});

addException?.addEventListener("click", addExceptionFromInput);

exceptionList?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const removeButton = target.closest("[data-remove-exception]");

  if (!removeButton) {
    return;
  }

  removeButton.closest("[data-exception]")?.remove();
  clearFormError();
  clearExceptionWarning();
  queueEditorAutosave({ immediate: true });
});

dailyAllowance?.addEventListener("input", () => {
  clearFormError();
  queueEditorAutosave();
});

allowExtraTime?.addEventListener("change", () => {
  clearFormError();
  queueEditorAutosave({ immediate: true });
});

grayscaleSite?.addEventListener("change", () => {
  if (grayscaleSite.checked) {
    grayscaleDetailsExpanded = true;
  }
  clearFormError();
  syncSiteVisualEffectMenus();
  queueEditorAutosave({ immediate: true });
});

redLightSite?.addEventListener("change", () => {
  if (redLightSite.checked) {
    redLightDetailsExpanded = true;
  }
  clearFormError();
  syncSiteVisualEffectMenus();
  queueEditorAutosave({ immediate: true });
});

requirePinExtra?.addEventListener("change", () => {
  clearFormError();
  queueEditorAutosave({ immediate: true });
});

shareCompact?.addEventListener("click", () => {
  shareMode = "compact";
  clearUsageSelections();
  renderUsageForDay(selectedUsageDay, { weekDay: visibleWeekDay });
});

shareAll?.addEventListener("click", () => {
  shareMode = "all";
  clearUsageSelections();
  renderUsageForDay(selectedUsageDay, { weekDay: visibleWeekDay });
});

usageShowMore?.addEventListener("click", () => {
  websitesExpanded = !websitesExpanded;
  clearUsageSelections();
  renderUsageForDay(selectedUsageDay, { weekDay: visibleWeekDay });
});

pomodoroModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    syncPomodoroModeView();
  });
});

pomodoroWhitelist?.addEventListener("input", () => {
  void chrome.storage.local.set({ [POMODORO_DRAFT_KEY]: pomodoroWhitelist.value });
});

pomodoroStart?.addEventListener("click", (event) => {
  event.preventDefault();
  void startPomodoroSession();
});

pomodoroStop?.addEventListener("click", () => {
  void stopPomodoroSession();
});

pomodoroStatsToggle?.addEventListener("click", () => {
  pomodoroStatsVisible = !pomodoroStatsVisible;
  syncPomodoroStatsVisibility();

  if (pomodoroStatsVisible) {
    void loadPomodoroStats();
  }
});

pomodoroStatsDate?.addEventListener("change", () => {
  selectedPomodoroStatsDay = pomodoroStatsDate.value || dateToDayKey(new Date());
  void loadPomodoroStats();
});

pomodoroDial?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  pomodoroDial.setPointerCapture(event.pointerId);
  setPomodoroDurationFromPointer(event);
});

pomodoroDial?.addEventListener("pointermove", (event) => {
  if (pomodoroDial.hasPointerCapture(event.pointerId)) {
    setPomodoroDurationFromPointer(event);
  }
});

pomodoroDial?.addEventListener("keydown", (event) => {
  const step = getPomodoroKeyboardStep(event);

  if (step === 0) {
    return;
  }

  event.preventDefault();
  setPomodoroDuration(getPreferredPomodoroMinutes() + step);
});

weekChart?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.closest(".week-day, .time-nav")) {
    return;
  }

  if (!usageView.hidden && selectedUsageDay) {
    clearUsageSelections({ keepWeek: true });
    renderUsageForDay(null, { weekDay: visibleWeekDay });
  }
});

document.addEventListener("mousedown", (event) => {
  const target = event.target;

  if (!(target instanceof Node)) {
    return;
  }

  if (weekChart.contains(target)) {
    return;
  }

  if (target instanceof HTMLElement && target.closest("[data-pie-domain], [data-site-domain], [data-category], [data-hour], .mini-toggle, #usage-show-more, .time-nav")) {
    return;
  }

  clearUsageSelections();
});

newSite?.addEventListener("click", () => {
  editingIndex = null;
  openEditor({
    domain: "",
    enabled: true,
    blockMode: "slots",
    exceptions: [],
    dailyAllowanceMinutes: 0,
    allowExtraTime: false,
    grayscale: false,
    grayscaleMode: "always",
    grayscaleIntervals: [],
    redLight: false,
    redLightMode: "always",
    redLightIntervals: [],
    requirePinForExtraTime: false,
    intervals: [{ ...DEFAULT_INTERVAL }]
  });
});

back?.addEventListener("click", showList);
editorBack?.addEventListener("click", showList);

addInterval?.addEventListener("click", () => {
  appendInterval(intervalList, { ...DEFAULT_INTERVAL }, { expanded: true, onChange: queueEditorAutosave });
  queueEditorAutosave({ immediate: true });
});

addGrayscaleInterval?.addEventListener("click", () => {
  appendInterval(grayscaleIntervalList, { ...DEFAULT_INTERVAL }, { expanded: true, onChange: queueEditorAutosave });
  queueEditorAutosave({ immediate: true });
});

addRedLightInterval?.addEventListener("click", () => {
  appendInterval(redLightIntervalList, { ...DEFAULT_INTERVAL }, { expanded: true, onChange: queueEditorAutosave });
  queueEditorAutosave({ immediate: true });
});

addGlobalGrayscaleInterval?.addEventListener("click", () => {
  appendInterval(globalGrayscaleIntervalList, { ...DEFAULT_INTERVAL }, { expanded: true, onChange: queueGlobalEffectAutosave });
  queueGlobalEffectAutosave({ immediate: true });
});

addGlobalRedLightInterval?.addEventListener("click", () => {
  appendInterval(globalRedLightIntervalList, { ...DEFAULT_INTERVAL }, { expanded: true, onChange: queueGlobalEffectAutosave });
  queueGlobalEffectAutosave({ immediate: true });
});

deleteSite?.addEventListener("click", async () => {
  clearTimeout(editorAutosaveTimer);

  if (editingIndex === null) {
    showList();
    return;
  }

  const removedIndex = editingIndex;
  const [removedSite] = schedule.sites.splice(removedIndex, 1);
  editingIndex = null;

  try {
    await persistSchedule();
    showList();
  } catch (error) {
    schedule.sites.splice(removedIndex, 0, removedSite);
    editingIndex = removedIndex;
    setFormError(cleanError(error));
  }
});

siteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  void autosaveEditor({ fromSubmit: true });
});

intervalList?.addEventListener("click", (event) => {
  handleIntervalListClick(event, { onChange: queueEditorAutosave });
});

grayscaleIntervalList?.addEventListener("click", (event) => {
  handleIntervalListClick(event, { onChange: queueEditorAutosave });
});

redLightIntervalList?.addEventListener("click", (event) => {
  handleIntervalListClick(event, { onChange: queueEditorAutosave });
});

globalGrayscaleIntervalList?.addEventListener("click", (event) => {
  handleIntervalListClick(event, { onChange: queueGlobalEffectAutosave });
});

globalRedLightIntervalList?.addEventListener("click", (event) => {
  handleIntervalListClick(event, { onChange: queueGlobalEffectAutosave });
});

blockExpander?.addEventListener("click", () => {
  blockDetailsExpanded = !blockDetailsExpanded;
  syncBlockingModeView();
});

grayscaleExpander?.addEventListener("click", () => {
  grayscaleDetailsExpanded = !grayscaleDetailsExpanded;
  syncSiteVisualEffectMenus();
});

redLightExpander?.addEventListener("click", () => {
  redLightDetailsExpanded = !redLightDetailsExpanded;
  syncSiteVisualEffectMenus();
});

globalGrayscaleExpander?.addEventListener("click", () => {
  globalGrayscaleDetailsExpanded = !globalGrayscaleDetailsExpanded;
  syncGlobalVisualEffectMenus();
});

globalRedLightExpander?.addEventListener("click", () => {
  globalRedLightDetailsExpanded = !globalRedLightDetailsExpanded;
  syncGlobalVisualEffectMenus();
});

void loadData();

async function loadData() {
  const loadStartedAt = Date.now();
  const [response, pomodoroResponse, storedSettings] = await Promise.all([
    chrome.runtime.sendMessage({ type: "get-schedule-data" }),
    chrome.runtime.sendMessage({ type: "get-pomodoro-state" }).catch(() => null),
    chrome.storage.local.get(SETTINGS_KEY).catch(() => ({})),
    loadPomodoroPreferences()
  ]);

  if (!response?.ok) {
    renderError(response?.error || "Could not load schedule.");
    return;
  }

  schedule = normalizeSchedule(response.schedule);
  state = response.state;
  settings = normalizeSettings(response.settings);
  applyStoredGlobalSettings(storedSettings);
  const loadedPomodoro = normalizePomodoro(pomodoroResponse?.ok ? pomodoroResponse.pomodoro : response.pomodoro || state?.pomodoro);

  if (loadStartedAt >= pomodoroMutationStartedAt) {
    pomodoro = loadedPomodoro;
  }
  renderPinSettings();
  renderPomodoro();
  renderStatus();
  renderSiteList();
}

async function persistSchedule() {
  const response = await chrome.runtime.sendMessage({
    type: "save-schedule",
    schedule
  });

  if (!response?.ok) {
    throw new Error(cleanError(response?.error || "Could not save schedule."));
  }

  schedule = normalizeSchedule(response.schedule);
  state = response.state;
  settings = normalizeSettings(response.settings || settings);
  pomodoro = normalizePomodoro(state?.pomodoro || pomodoro);
  renderPinSettings();
  renderPomodoro();
  renderStatus();
  renderSiteList();
}

async function savePinValue() {
  const nextPin = sanitizePinValue(pinCode.value);

  if (!pinEditorOpen) {
    return;
  }

  pinCode.value = nextPin;
  pinCode.setCustomValidity("");

  if (nextPin.length !== 4) {
    pinCode.setCustomValidity("PIN must be 4 digits.");
    updatePinDraftStatus();
    pinCode.focus();
    return;
  }

  await persistPinSettings({
    pin: nextPin,
    successMessage: settings.hasPin ? "PIN updated." : "PIN created."
  });
}

async function saveGlobalSettingsToggle() {
  if (!globalExtraTime || !globalGrayscale) {
    return;
  }

  if (globalSettingsSaveInFlight) {
    globalSettingsSaveQueued = true;
    return;
  }

  const previousSettings = { ...settings };
  const nextRequirePin = Boolean(settings.hasPin && pinGlobal?.checked);
  const nextAllowExtraTime = Boolean(globalExtraTime.checked);
  const nextBlockAll = Boolean(blockAll?.checked);
  const nextGrayscale = Boolean(globalGrayscale.checked);
  const nextGrayscaleApplyToAllWebsites = Boolean(globalGrayscaleAllWebsites?.checked);
  const nextGrayscaleMode = getModeFromRadios(globalGrayscaleModeRadios, previousSettings.grayscaleForAllMode);
  const nextRedLight = Boolean(globalRedLight?.checked);
  const nextRedLightApplyToAllWebsites = Boolean(globalRedLightAllWebsites?.checked);
  const nextRedLightMode = getModeFromRadios(globalRedLightModeRadios, previousSettings.redLightForAllMode);
  let nextGrayscaleIntervalsForAll = cloneIntervals(previousSettings.grayscaleIntervalsForAll || previousSettings.effectIntervalsForAll);
  let nextRedLightIntervalsForAll = cloneIntervals(previousSettings.redLightIntervalsForAll || previousSettings.effectIntervalsForAll);

  try {
    nextGrayscaleIntervalsForAll = readEffectIntervalsForSave(globalGrayscaleIntervalList, {
      enabled: nextGrayscale,
      mode: nextGrayscaleMode,
      fallback: previousSettings.grayscaleIntervalsForAll || previousSettings.effectIntervalsForAll,
      label: "grayscale"
    });
    nextRedLightIntervalsForAll = readEffectIntervalsForSave(globalRedLightIntervalList, {
      enabled: nextRedLight,
      mode: nextRedLightMode,
      fallback: previousSettings.redLightIntervalsForAll || previousSettings.effectIntervalsForAll,
      label: "red light"
    });
  } catch (error) {
    setSettingsStatus("global", cleanError(error), { error: true });
    syncGlobalSettingsView();
    return;
  }

  globalSettingsSaveInFlight = true;
  settings = {
    ...settings,
    blockAllForAll: nextBlockAll,
    requirePinForAllExtraTime: nextRequirePin,
    allowExtraTimeForAll: nextAllowExtraTime,
    grayscaleForAll: nextGrayscale,
    grayscaleApplyToAllWebsites: nextGrayscaleApplyToAllWebsites,
    grayscaleForAllMode: nextGrayscaleMode,
    grayscaleIntervalsForAll: nextGrayscaleIntervalsForAll,
    redLightForAll: nextRedLight,
    redLightApplyToAllWebsites: nextRedLightApplyToAllWebsites,
    redLightForAllMode: nextRedLightMode,
    redLightIntervalsForAll: nextRedLightIntervalsForAll,
    effectIntervalsForAll: nextGrayscaleIntervalsForAll
  };
  if (pinGlobal) {
    pinGlobal.checked = nextRequirePin;
  }
  if (blockAll) {
    blockAll.checked = nextBlockAll;
  }
  globalExtraTime.checked = nextAllowExtraTime;
  globalGrayscale.checked = nextGrayscale;
  if (globalGrayscaleAllWebsites) {
    globalGrayscaleAllWebsites.checked = nextGrayscaleApplyToAllWebsites;
  }
  if (globalRedLight) {
    globalRedLight.checked = nextRedLight;
  }
  if (globalRedLightAllWebsites) {
    globalRedLightAllWebsites.checked = nextRedLightApplyToAllWebsites;
  }
  setModeRadios(globalGrayscaleModeRadios, nextGrayscaleMode);
  setModeRadios(globalRedLightModeRadios, nextRedLightMode);

  setSettingsStatus("global", "Saving...");
  syncGlobalSettingsView();
  syncEditorGlobalOverrideView();
  updatePinDraftStatus();
  renderSiteList();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "save-settings",
      settings: {
        blockAllForAll: nextBlockAll,
        requirePinForAllExtraTime: nextRequirePin,
        allowExtraTimeForAll: nextAllowExtraTime,
        grayscaleForAll: nextGrayscale,
        grayscaleApplyToAllWebsites: nextGrayscaleApplyToAllWebsites,
        grayscaleForAllMode: nextGrayscaleMode,
        grayscaleIntervalsForAll: nextGrayscaleIntervalsForAll,
        redLightForAll: nextRedLight,
        redLightApplyToAllWebsites: nextRedLightApplyToAllWebsites,
        redLightForAllMode: nextRedLightMode,
        redLightIntervalsForAll: nextRedLightIntervalsForAll,
        effectIntervalsForAll: nextGrayscaleIntervalsForAll
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save global settings.");
    }

    settings = normalizeSettings(response.settings || settings);
    state = response.state || state;

    if (!globalSettingsSaveQueued && !globalEffectAutosaveQueued && !globalEffectAutosaveTimer) {
      renderGlobalSettings("Global settings saved.");
      updatePinDraftStatus();
      syncEditorGlobalOverrideView();
    }

    if (!response.state) {
      try {
        const refreshResponse = await chrome.runtime.sendMessage({ type: "refresh-rules" });

        if (refreshResponse?.ok) {
          state = refreshResponse.state || state;
        }
      } catch (_error) {
        // Settings are already saved. The next background tick can refresh rules.
      }
    }

    renderStatus();
    renderSiteList();
  } catch (error) {
    settings = previousSettings;
    if (pinGlobal) {
      pinGlobal.checked = Boolean(previousSettings.requirePinForAllExtraTime);
    }
    if (blockAll) {
      blockAll.checked = Boolean(previousSettings.blockAllForAll);
    }
    globalExtraTime.checked = Boolean(previousSettings.allowExtraTimeForAll);
    globalGrayscale.checked = Boolean(previousSettings.grayscaleForAll);
    if (globalGrayscaleAllWebsites) {
      globalGrayscaleAllWebsites.checked = Boolean(previousSettings.grayscaleApplyToAllWebsites);
    }
    if (globalRedLight) {
      globalRedLight.checked = Boolean(previousSettings.redLightForAll);
    }
    if (globalRedLightAllWebsites) {
      globalRedLightAllWebsites.checked = Boolean(previousSettings.redLightApplyToAllWebsites);
    }
    setModeRadios(globalGrayscaleModeRadios, previousSettings.grayscaleForAllMode);
    setModeRadios(globalRedLightModeRadios, previousSettings.redLightForAllMode);
    renderGlobalEffectIntervals();
    setSettingsStatus("global", cleanError(error), { error: true });
    updatePinDraftStatus();
    syncEditorGlobalOverrideView();
    renderSiteList();
  } finally {
    globalSettingsSaveInFlight = false;
    syncGlobalSettingsView();

    if (globalSettingsSaveQueued) {
      globalSettingsSaveQueued = false;
      void saveGlobalSettingsToggle();
    } else if (globalEffectAutosaveQueued) {
      globalEffectAutosaveQueued = false;
      queueGlobalEffectAutosave({ immediate: true });
    }
  }
}

async function persistPinSettings({
  pin,
  statusTarget = "pin",
  successMessage = "PIN settings saved."
} = {}) {
  if (pinSaveInFlight) {
    return false;
  }

  pinSaveInFlight = true;
  setSettingsStatus(statusTarget, "Saving...");

  if (createPin) {
    createPin.disabled = true;
  }

  if (changePin) {
    changePin.disabled = true;
  }

  pinGlobal.disabled = true;
  if (blockAll) {
    blockAll.disabled = true;
  }
  if (globalExtraTime) {
    globalExtraTime.disabled = true;
  }
  if (globalGrayscale) {
    globalGrayscale.disabled = true;
  }
  if (globalGrayscaleAllWebsites) {
    globalGrayscaleAllWebsites.disabled = true;
  }
  globalGrayscaleModeRadios.forEach((radio) => {
    radio.disabled = true;
  });
  if (globalRedLight) {
    globalRedLight.disabled = true;
  }
  if (globalRedLightAllWebsites) {
    globalRedLightAllWebsites.disabled = true;
  }
  globalRedLightModeRadios.forEach((radio) => {
    radio.disabled = true;
  });
  pinCode.disabled = true;
  togglePinVisibility.disabled = true;
  if (savePin) {
    savePin.disabled = true;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "save-settings",
      settings: {
        ...(pin ? { pin } : {}),
        requirePinForAllExtraTime: Boolean(pinGlobal.checked),
        blockAllForAll: Boolean(blockAll?.checked),
        allowExtraTimeForAll: Boolean(globalExtraTime?.checked),
        grayscaleForAll: Boolean(globalGrayscale?.checked),
        grayscaleApplyToAllWebsites: Boolean(globalGrayscaleAllWebsites?.checked),
        grayscaleForAllMode: getModeFromRadios(globalGrayscaleModeRadios, settings.grayscaleForAllMode),
        grayscaleIntervalsForAll: cloneIntervals(settings.grayscaleIntervalsForAll || settings.effectIntervalsForAll),
        redLightForAll: Boolean(globalRedLight?.checked),
        redLightApplyToAllWebsites: Boolean(globalRedLightAllWebsites?.checked),
        redLightForAllMode: getModeFromRadios(globalRedLightModeRadios, settings.redLightForAllMode),
        redLightIntervalsForAll: cloneIntervals(settings.redLightIntervalsForAll || settings.effectIntervalsForAll)
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save PIN settings.");
    }

    settings = normalizeSettings(response.settings || settings);
    state = response.state || state;

    if (pin) {
      pinEditorOpen = false;
      pinCode.value = "";
      popupPinVisible = false;
      setPinVisibility(pinCode, togglePinVisibility, false);
    }

    renderPinSettings(statusTarget === "pin" ? successMessage : "");
    renderGlobalSettings(statusTarget === "global" ? successMessage : "");
    syncEditorGlobalOverrideView();

    if (!response.state) {
      try {
        const refreshResponse = await chrome.runtime.sendMessage({ type: "refresh-rules" });

        if (refreshResponse?.ok) {
          state = refreshResponse.state || state;
        }
      } catch (_error) {
        // Saving the PIN already succeeded; refreshing status can wait for the next tick.
      }
    }

    renderStatus();
    renderSiteList();
    return true;
  } catch (error) {
    setSettingsStatus(statusTarget, cleanError(error), { error: true });
    return false;
  } finally {
    pinSaveInFlight = false;
    if (createPin) {
      createPin.disabled = false;
    }
    if (changePin) {
      changePin.disabled = false;
    }
    syncPinSetupView();
    syncGlobalSettingsView();
  }
}

function renderPinSettings(message = "") {
  pinCode.setCustomValidity("");
  renderGlobalSettings();

  if (!pinEditorOpen) {
    pinCode.value = "";
    popupPinVisible = false;
  }

  setPinVisibility(pinCode, togglePinVisibility, popupPinVisible);
  syncPinSetupView();

  if (message) {
    pinStatus.textContent = message;
    pinStatus.classList.remove("error");
    return;
  }

  updatePinDraftStatus();
}

function renderGlobalSettings(message = "") {
  if (pinGlobal) {
    pinGlobal.checked = Boolean(settings.requirePinForAllExtraTime);
  }

  if (blockAll) {
    blockAll.checked = Boolean(settings.blockAllForAll);
  }

  if (globalExtraTime) {
    globalExtraTime.checked = Boolean(settings.allowExtraTimeForAll);
  }

  if (globalGrayscale) {
    globalGrayscale.checked = Boolean(settings.grayscaleForAll);
  }

  if (globalGrayscaleAllWebsites) {
    globalGrayscaleAllWebsites.checked = Boolean(settings.grayscaleApplyToAllWebsites);
  }

  setModeRadios(globalGrayscaleModeRadios, settings.grayscaleForAllMode);

  if (globalRedLight) {
    globalRedLight.checked = Boolean(settings.redLightForAll);
  }

  if (globalRedLightAllWebsites) {
    globalRedLightAllWebsites.checked = Boolean(settings.redLightApplyToAllWebsites);
  }

  setModeRadios(globalRedLightModeRadios, settings.redLightForAllMode);

  renderGlobalEffectIntervals();
  syncGlobalVisualEffectMenus();

  syncGlobalSettingsView();

  if (message) {
    setSettingsStatus("global", message);
    return;
  }

  updateGlobalSettingsStatus();
}

function renderGlobalEffectIntervals() {
  renderIntervalList(globalGrayscaleIntervalList, settings.grayscaleIntervalsForAll || settings.effectIntervalsForAll, queueGlobalEffectAutosave);
  renderIntervalList(globalRedLightIntervalList, settings.redLightIntervalsForAll || settings.effectIntervalsForAll, queueGlobalEffectAutosave);
}

function syncPinSetupView() {
  const hasPin = Boolean(settings.hasPin);

  if (!hasPin) {
    pinGlobal.checked = false;
  }

  if (pinEditor) {
    pinEditor.hidden = !pinEditorOpen;
  }

  if (createPin) {
    createPin.hidden = hasPin || pinEditorOpen;
    createPin.disabled = pinSaveInFlight;
  }

  if (changePin) {
    changePin.hidden = !hasPin || pinEditorOpen;
    changePin.disabled = pinSaveInFlight;
  }

  if (savePin) {
    savePin.hidden = !pinEditorOpen;
    savePin.disabled = !pinEditorOpen || sanitizePinValue(pinCode.value).length !== 4 || pinSaveInFlight;
  }

  pinCode.disabled = !pinEditorOpen || pinSaveInFlight;
  togglePinVisibility.disabled = !pinEditorOpen || pinCode.value.length === 0 || pinSaveInFlight;

  syncGlobalSettingsView();
  syncEditorGlobalOverrideView();
}

function syncGlobalSettingsView() {
  const hasPin = Boolean(settings.hasPin);
  const controlsBusy = pinSaveInFlight || globalSettingsSaveInFlight;

  if (!hasPin && pinGlobal) {
    pinGlobal.checked = false;
  }

  if (pinGlobal) {
    pinGlobal.disabled = !hasPin || controlsBusy;
  }

  if (globalExtraTime) {
    globalExtraTime.disabled = controlsBusy;
  }

  if (blockAll) {
    blockAll.disabled = controlsBusy;
  }

  if (globalGrayscale) {
    globalGrayscale.disabled = controlsBusy;
  }

  if (globalGrayscaleAllWebsites) {
    globalGrayscaleAllWebsites.disabled = controlsBusy;
  }

  globalGrayscaleModeRadios.forEach((radio) => {
    radio.disabled = controlsBusy;
  });

  if (globalRedLight) {
    globalRedLight.disabled = controlsBusy;
  }

  if (globalRedLightAllWebsites) {
    globalRedLightAllWebsites.disabled = controlsBusy;
  }

  globalRedLightModeRadios.forEach((radio) => {
    radio.disabled = controlsBusy;
  });

  pinGlobalRow?.classList.toggle("is-disabled", !hasPin || controlsBusy);
  globalExtraTimeRow?.classList.toggle("is-disabled", controlsBusy);
  blockAllRow?.classList.toggle("is-disabled", controlsBusy);
  globalGrayscaleRow?.classList.toggle("is-disabled", controlsBusy);
  globalGrayscaleAllWebsitesRow?.classList.toggle("is-disabled", controlsBusy);
  globalRedLightRow?.classList.toggle("is-disabled", controlsBusy);
  globalRedLightAllWebsitesRow?.classList.toggle("is-disabled", controlsBusy);

  syncGlobalVisualEffectMenus();
}

function syncEditorGlobalOverrideView(siteOverride = null) {
  const blockEnforced = Boolean(settings.blockAllForAll);
  const extraTimeEnforced = Boolean(settings.allowExtraTimeForAll);
  const grayscaleEnforced = Boolean(settings.grayscaleForAll);
  const redLightEnforced = Boolean(settings.redLightForAll);
  const pinEnforced = Boolean(settings.hasPin && settings.requirePinForAllExtraTime);
  const pinControlDisabled = !settings.hasPin;

  // Global settings still control the effective behavior, but they must not
  // lock the per-website checkboxes. Users can save a website's individual
  // preference now, and it becomes effective when the global override is off.
  if (allowExtraTime) {
    allowExtraTime.disabled = false;
    allowExtraTime.closest(".toggle-field")?.classList.remove("is-disabled");
  }

  if (extraTimeGlobalNote) {
    extraTimeGlobalNote.hidden = !extraTimeEnforced;
    extraTimeGlobalNote.textContent = "Global Allow extra time is on. You can still toggle this website setting, but websites will follow the global setting until it is turned off.";
  }

  if (blockGlobalNote) {
    blockGlobalNote.hidden = !blockEnforced;
    blockGlobalNote.textContent = "Global Block all websites in list is on. You can still toggle this website setting, but websites will follow the global setting until it is turned off.";
  }

  if (grayscaleGlobalNote) {
    grayscaleGlobalNote.hidden = !grayscaleEnforced;
    grayscaleGlobalNote.textContent = settings.grayscaleApplyToAllWebsites
      ? "Global Grayscale is on for all websites. You can still toggle this website setting, but the global setting controls the current effect until it is turned off."
      : "Global Grayscale websites is on. You can still toggle this website setting, but websites will follow the global setting until it is turned off.";
  }

  if (redLightGlobalNote) {
    redLightGlobalNote.hidden = !redLightEnforced;
    redLightGlobalNote.textContent = settings.redLightApplyToAllWebsites
      ? "Global Red light is on for all websites. You can still toggle this website setting, but the global setting controls the current effect until it is turned off."
      : "Global Red light is on. You can still toggle this website setting, but websites will follow the global setting until it is turned off.";
  }

  requirePinExtraRow?.classList.toggle("is-disabled", pinControlDisabled);

  if (requirePinExtra) {
    requirePinExtra.disabled = pinControlDisabled;

    if (!settings.hasPin) {
      requirePinExtra.checked = false;
    }
  }

  if (pinGlobalNote) {
    pinGlobalNote.hidden = !pinEnforced;
    pinGlobalNote.textContent = "Global PIN requirement is on. You can still toggle this website setting, but websites will follow the global setting until it is turned off.";
  }

  syncBlockingModeView();
}

function setSettingsStatus(target, message, { error = false } = {}) {
  const element = target === "global" ? globalSettingsStatus : pinStatus;

  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("error", error);
}

function updateGlobalSettingsStatus() {
  if (!globalSettingsStatus) {
    return;
  }

  const enabled = [
    settings.requirePinForAllExtraTime ? "PIN" : "",
    settings.blockAllForAll ? "block" : "",
    settings.allowExtraTimeForAll ? "extra time" : "",
    settings.grayscaleForAll ? `grayscale${settings.grayscaleApplyToAllWebsites ? " everywhere" : ""}` : "",
    settings.redLightForAll ? `red light${settings.redLightApplyToAllWebsites ? " everywhere" : ""}` : ""
  ].filter(Boolean);

  globalSettingsStatus.classList.remove("error");
  globalSettingsStatus.textContent = enabled.length > 0
    ? `Global ${enabled.join(" and ")} override${enabled.length === 1 ? " is" : "s are"} on.`
    : "Website overrides are off.";
}

function updatePinDraftStatus() {
  const nextPin = sanitizePinValue(pinCode.value);
  togglePinVisibility.disabled = !pinEditorOpen || nextPin.length === 0;
  if (savePin) {
    savePin.disabled = !pinEditorOpen || nextPin.length !== 4 || pinSaveInFlight;
  }

  if (!pinEditorOpen) {
    pinStatus.classList.remove("error");
    pinStatus.textContent = settings.hasPin
      ? pinGlobal.checked
        ? "PIN is active and required for all websites."
        : "PIN is active."
      : "No PIN set yet.";
    return;
  }

  if (nextPin.length === 0) {
    pinStatus.classList.remove("error");
    if (settings.hasPin && pinEditorOpen && !settings.pinValue) {
      pinStatus.textContent = "This PIN was saved before prefilling was available. Type it once to enable prefilling.";
      return;
    }

    pinStatus.textContent = settings.hasPin
      ? "Edit the 4-digit PIN and save it."
      : "Create a 4-digit PIN and save it.";
    return;
  }

  if (nextPin.length === 4) {
    pinStatus.classList.remove("error");
    pinStatus.textContent = settings.hasPin && nextPin === settings.pinValue
      ? "Current PIN loaded. Save after you change it."
      : "PIN ready to save.";
  } else {
    pinStatus.classList.add("error");
    pinStatus.textContent = "PIN must be 4 digits.";
  }
}

function openPinEditor({ value = "", visible = false } = {}) {
  pinEditorOpen = true;
  pinCode.value = sanitizePinValue(value);
  popupPinVisible = Boolean(visible && pinCode.value);
  pinCode.setCustomValidity("");
  setPinVisibility(pinCode, togglePinVisibility, popupPinVisible);
  syncPinSetupView();
  updatePinDraftStatus();
  pinCode.focus();
  pinCode.select();
}

function renderStatus() {
  activeSites.replaceChildren();
  summary.classList.remove("error");

  if (!state) {
    summary.textContent = "No schedule status yet.";
    updated.textContent = "";
    return;
  }

  if (state.error) {
    summary.textContent = "Schedule error. Blocking rules were cleared.";
    summary.classList.add("error");
    updated.textContent = state.error;
    return;
  }

  const activePomodoro = normalizePomodoro(state.pomodoro || pomodoro);

  if (activePomodoro.active) {
    summary.textContent = activePomodoro.mode === "strict"
      ? "Strict focus session active. Internet is blocked except your whitelist."
      : "Standard focus session active. Scheduled websites are blocked.";
    updated.textContent = `Ends ${new Date(activePomodoro.until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    if (activePomodoro.mode === "strict" && activePomodoro.whitelist.length > 0) {
      activeSites.append(
        ...activePomodoro.whitelist.map((domain) => {
          const item = document.createElement("li");
          item.textContent = `Allowed: ${domain}`;
          return item;
        })
      );
    }

    return;
  }

  const sites = Array.isArray(state.activeSites) ? state.activeSites : [];

  if (sites.length === 0) {
    summary.textContent = "No websites are blocked right now.";
  } else {
    summary.textContent = `${sites.length} blocked right now.`;
    activeSites.append(
      ...sites.map((site) => {
        const item = document.createElement("li");
        const siteIndex = findSiteIndex(site.domains);

        if (siteIndex === -1) {
          item.textContent = site.domains.join(", ");
          return item;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "active-site-button";
        button.textContent = site.domains.join(", ");
        button.addEventListener("click", () => {
          editingIndex = siteIndex;
          openEditor(schedule.sites[siteIndex]);
        });

        item.append(button);
        return item;
      })
    );
  }

  updated.textContent = state.lastUpdated
    ? `Updated ${new Date(state.lastUpdated).toLocaleString()}`
    : "";
}

async function loadPomodoroPreferences() {
  const stored = await chrome.storage.local.get([POMODORO_DRAFT_KEY, PREFERRED_POMODORO_MINUTES_KEY]);
  const draft = typeof stored[POMODORO_DRAFT_KEY] === "string" ? stored[POMODORO_DRAFT_KEY] : "";
  const minutes = normalizePomodoroMinutes(stored[PREFERRED_POMODORO_MINUTES_KEY]);

  if (pomodoroWhitelist && !pomodoroWhitelist.value) {
    pomodoroWhitelist.value = draft;
  }

  setPomodoroDuration(minutes, { persist: false });
}

function renderPomodoro() {
  const active = normalizePomodoro(pomodoro);

  pomodoro = active;

  if (active.active) {
    setPomodoroMode(active.mode);
  }

  syncPomodoroModeView();

  if (!pomodoroPanel || !pomodoroInactive || !pomodoroActive || !pomodoroTimer || !pomodoroActiveMode) {
    return;
  }

  pomodoroInactive.hidden = active.active;
  pomodoroActive.hidden = !active.active;
  pomodoroTimer.hidden = !active.active;

  if (active.active) {
    pomodoroActiveMode.textContent = active.mode === "strict"
      ? `Strict focus active${active.whitelist.length > 0 ? ` · ${active.whitelist.length} allowed` : ""}`
      : "Standard focus active";
    updatePomodoroCountdown();
    startPomodoroTicker();
  } else {
    stopPomodoroTicker();
    updatePomodoroDial();
    pomodoroTimer.textContent = `${String(getPreferredPomodoroMinutes()).padStart(2, "0")}:00`;
  }
}

function syncPomodoroModeView() {
  const mode = getSelectedPomodoroMode();
  const isStrict = mode === "strict";

  pomodoroModeRadios.forEach((radio) => {
    radio.closest(".pomodoro-mode")?.classList.toggle("is-selected", radio.checked);
  });

  if (pomodoroWhitelistField) {
    pomodoroWhitelistField.hidden = !isStrict;
  }
}

function getSelectedPomodoroMode() {
  return pomodoroModeRadios.find((radio) => radio.checked)?.value === "strict" ? "strict" : "standard";
}

function setPomodoroMode(mode) {
  const normalizedMode = mode === "strict" ? "strict" : "standard";

  pomodoroModeRadios.forEach((radio) => {
    radio.checked = radio.value === normalizedMode;
  });
}

function getPreferredPomodoroMinutes() {
  return normalizePomodoroMinutes(pomodoroDial?.dataset.minutes);
}

function normalizePomodoroMinutes(value) {
  const minutes = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(minutes)) {
    return DEFAULT_POMODORO_MINUTES;
  }

  return Math.max(1, Math.min(MAX_POMODORO_MINUTES, minutes));
}

function setPomodoroDuration(minutes, { persist = true } = {}) {
  const normalized = normalizePomodoroMinutes(minutes);

  if (pomodoroDial) {
    pomodoroDial.dataset.minutes = String(normalized);
  }

  updatePomodoroDial();

  if (persist) {
    void chrome.storage.local.set({ [PREFERRED_POMODORO_MINUTES_KEY]: normalized });
  }
}

function updatePomodoroDial() {
  const minutes = getPreferredPomodoroMinutes();
  const rotation = minutes / MAX_POMODORO_MINUTES * 360;

  if (pomodoroDurationValue) {
    pomodoroDurationValue.textContent = String(minutes);
  }

  if (pomodoroDial) {
    pomodoroDial.style.setProperty("--rotation", `${rotation}deg`);
    pomodoroDial.setAttribute("aria-valuenow", String(minutes));
    pomodoroDial.setAttribute("aria-valuetext", `${minutes} minute${minutes === 1 ? "" : "s"}`);
  }
}

function setPomodoroDurationFromPointer(event) {
  if (!pomodoroDial) {
    return;
  }

  const rect = pomodoroDial.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  let angle = Math.atan2(y, x) * 180 / Math.PI + 90;

  if (angle < 0) {
    angle += 360;
  }

  const rawMinutes = Math.round(angle / 360 * MAX_POMODORO_MINUTES);
  setPomodoroDuration(rawMinutes <= 0 ? MAX_POMODORO_MINUTES : rawMinutes);
}

function getPomodoroKeyboardStep(event) {
  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
    return 5;
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
    return -5;
  }

  if (event.key === "Home") {
    return 1 - getPreferredPomodoroMinutes();
  }

  if (event.key === "End") {
    return MAX_POMODORO_MINUTES - getPreferredPomodoroMinutes();
  }

  return 0;
}

async function startPomodoroSession() {
  if (!pomodoroStart) {
    return;
  }

  const mode = getSelectedPomodoroMode();
  const whitelistText = pomodoroWhitelist?.value || "";
  const whitelist = parsePomodoroWhitelist(whitelistText);
  const duration = getPreferredPomodoroMinutes();
  const mutationStartedAt = Date.now();
  const optimisticPomodoro = normalizePomodoro({
    active: true,
    until: mutationStartedAt + duration * 60 * 1000,
    mode,
    whitelist
  });

  pomodoroMutationStartedAt = mutationStartedAt;

  pomodoroStart.disabled = true;
  pomodoro = optimisticPomodoro;
  renderPomodoro();

  try {
    await chrome.storage.local.set({
      [POMODORO_DRAFT_KEY]: whitelistText,
      [PREFERRED_POMODORO_MINUTES_KEY]: duration
    });
    const response = await chrome.runtime.sendMessage({
      type: "start-pomodoro",
      duration,
      mode,
      whitelist
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not start focus session.");
    }

    state = response.state || state;
    const confirmedPomodoro = normalizePomodoro(response.pomodoro || state?.pomodoro);
    pomodoro = confirmedPomodoro.active ? confirmedPomodoro : optimisticPomodoro;

    if (state) {
      state = {
        ...state,
        pomodoro
      };
    }

    renderPomodoro();
    renderStatus();
    renderSiteList();

    if (pomodoroStatsVisible) {
      void loadPomodoroStats();
    }
  } catch (error) {
    const recoveredPomodoro = await fetchPomodoroState();

    if (recoveredPomodoro.active) {
      pomodoro = recoveredPomodoro;
      renderPomodoro();
      renderStatus();
      renderSiteList();
    } else {
      pomodoro = normalizePomodoro();
      renderPomodoro();
      renderError(cleanError(error));
    }
  } finally {
    pomodoroStart.disabled = false;
  }
}

async function fetchPomodoroState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "get-pomodoro-state" });

    if (response?.ok) {
      return normalizePomodoro(response.pomodoro);
    }
  } catch (_error) {
    return normalizePomodoro();
  }

  return normalizePomodoro();
}

async function stopPomodoroSession() {
  if (!pomodoroStop) {
    return;
  }

  const previousPomodoro = pomodoro;

  pomodoroMutationStartedAt = Date.now();
  pomodoroStop.disabled = true;
  pomodoro = normalizePomodoro();
  renderPomodoro();

  try {
    const response = await chrome.runtime.sendMessage({ type: "stop-pomodoro" });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not stop focus session.");
    }

    state = response.state || state;
    pomodoro = normalizePomodoro(response.pomodoro || state?.pomodoro);
    renderPomodoro();
    renderStatus();
    renderSiteList();

    if (pomodoroStatsVisible) {
      void loadPomodoroStats();
    }
  } catch (error) {
    pomodoro = previousPomodoro;
    renderPomodoro();
    renderError(cleanError(error));
  } finally {
    pomodoroStop.disabled = false;
  }
}

function startPomodoroTicker() {
  stopPomodoroTicker();
  pomodoroTickTimer = window.setInterval(() => {
    updatePomodoroCountdown();
  }, 1000);
}

function stopPomodoroTicker() {
  if (pomodoroTickTimer) {
    window.clearInterval(pomodoroTickTimer);
    pomodoroTickTimer = 0;
  }
}

function updatePomodoroCountdown() {
  if (!pomodoroTimer) {
    return;
  }

  const remainingSeconds = Math.max(0, Math.ceil((pomodoro.until - Date.now()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  pomodoroTimer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (remainingSeconds <= 0 && pomodoro.active) {
    pomodoro = normalizePomodoro();
    renderPomodoro();
    void loadData()
      .catch(() => {})
      .finally(() => {
        if (pomodoroStatsVisible) {
          void loadPomodoroStats();
        }
      });
  }
}

function syncPomodoroStatsVisibility() {
  if (!pomodoroStatsToggle || !pomodoroStatsPanel) {
    return;
  }

  pomodoroStatsPanel.hidden = !pomodoroStatsVisible;
  const label = pomodoroStatsToggle.querySelector("[data-stats-toggle-label]");
  const arrow = pomodoroStatsToggle.querySelector(".stats-toggle-arrow");

  if (label) {
    label.textContent = pomodoroStatsVisible ? "Hide statistics" : "Show statistics";
  } else {
    pomodoroStatsToggle.textContent = pomodoroStatsVisible ? "Hide statistics" : "Show statistics";
  }

  if (arrow) {
    arrow.textContent = pomodoroStatsVisible ? "▴" : "▾";
  }

  pomodoroStatsToggle.setAttribute("aria-expanded", String(pomodoroStatsVisible));

  if (pomodoroStatsDate && !pomodoroStatsDate.value) {
    pomodoroStatsDate.value = selectedPomodoroStatsDay;
  }
}

async function loadPomodoroStats() {
  if (!pomodoroStatsPanel) {
    return;
  }

  syncPomodoroStatsVisibility();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "get-pomodoro-stats",
      date: selectedPomodoroStatsDay
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load focus statistics.");
    }

    pomodoroStatsData = response.stats;
    renderPomodoroStats();
  } catch (error) {
    if (pomodoroHistoryEmpty) {
      pomodoroHistoryEmpty.hidden = false;
      pomodoroHistoryEmpty.textContent = cleanError(error);
    }
  }
}

function renderPomodoroStats() {
  const stats = pomodoroStatsData;

  if (!stats) {
    return;
  }

  const selected = stats.selectedDay || {};
  const sessions = Array.isArray(selected.sessions) ? selected.sessions : [];
  const last7Days = Array.isArray(stats.last7Days) ? stats.last7Days : [];
  const weekTotalSeconds = last7Days.reduce((sum, day) => sum + Math.max(0, Number(day.totalSeconds) || 0), 0);

  if (pomodoroStatsDate) {
    pomodoroStatsDate.value = stats.date || selectedPomodoroStatsDay;
  }

  if (pomodoroStatsSubtitle) {
    pomodoroStatsSubtitle.textContent = formatDayLabel(stats.date);
  }

  if (pomodoroStatsTotal) {
    pomodoroStatsTotal.textContent = formatDuration(selected.totalSeconds || 0);
  }

  if (pomodoroStatsSessions) {
    pomodoroStatsSessions.textContent = String(selected.sessionCount || 0);
  }

  if (pomodoroStatsCompleted) {
    pomodoroStatsCompleted.textContent = `${selected.completedCount || 0} / ${selected.stoppedCount || 0}`;
    pomodoroStatsCompleted.title = `${selected.completionRate || 0}% completion rate`;
  }

  if (pomodoroStatsStreak) {
    pomodoroStatsStreak.textContent = `${stats.streakDays || 0}d`;
  }

  if (pomodoroWeekTotal) {
    pomodoroWeekTotal.textContent = formatDuration(weekTotalSeconds);
  }

  renderPomodoroWeekBars(last7Days);
  renderPomodoroHistory(sessions);
}

function renderPomodoroWeekBars(days) {
  if (!pomodoroWeekBars) {
    return;
  }

  pomodoroWeekBars.replaceChildren();

  const maxSeconds = Math.max(1, ...days.map((day) => {
    return Math.max(0, Number(day.longestSessionSeconds ?? day.totalSeconds) || 0);
  }));

  days.forEach((day) => {
    const button = document.createElement("button");
    const bar = document.createElement("span");
    const label = document.createElement("small");
    const amount = document.createElement("strong");
    const totalSeconds = Math.max(0, Number(day.totalSeconds) || 0);
    const longestSessionSeconds = Math.max(0, Number(day.longestSessionSeconds ?? totalSeconds) || 0);
    const barSeconds = longestSessionSeconds || totalSeconds;
    const accessibleLabel = longestSessionSeconds > 0 && totalSeconds > longestSessionSeconds
      ? `${formatDayLabel(day.date)}: ${formatDuration(totalSeconds)} total, longest session ${formatDuration(longestSessionSeconds)}`
      : `${formatDayLabel(day.date)}: ${formatDuration(totalSeconds)}`;

    button.type = "button";
    button.className = "pomodoro-week-day";
    button.setAttribute("aria-pressed", String(day.date === selectedPomodoroStatsDay));
    button.setAttribute("aria-label", accessibleLabel);
    button.addEventListener("click", () => {
      selectedPomodoroStatsDay = day.date;

      if (pomodoroStatsDate) {
        pomodoroStatsDate.value = day.date;
      }

      void loadPomodoroStats();
    });

    bar.className = "pomodoro-week-bar";
    bar.style.setProperty("--height", `${Math.max(8, Math.round(barSeconds / maxSeconds * 100))}%`);

    label.textContent = formatShortWeekday(day.date);
    amount.textContent = formatDuration(totalSeconds);

    button.append(bar, label, amount);
    pomodoroWeekBars.append(button);
  });
}

function renderPomodoroHistory(sessions) {
  if (!pomodoroHistoryList || !pomodoroHistoryCount || !pomodoroHistoryEmpty) {
    return;
  }

  pomodoroHistoryList.replaceChildren();
  pomodoroHistoryCount.textContent = String(sessions.length);
  pomodoroHistoryEmpty.hidden = sessions.length > 0;
  pomodoroHistoryEmpty.textContent = "No focus sessions for this day yet.";

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
    pomodoroHistoryList.append(item);
  });
}

function formatShortWeekday(day) {
  const date = parseDayKey(day);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
}

function formatTimeRange(start, end) {
  const startDate = new Date(Number(start) || 0);
  const endDate = new Date(Number(end) || 0);

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    return "";
  }

  return `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function renderSiteList() {
  siteList.replaceChildren();

  if (schedule.sites.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-row";
    item.textContent = "No websites yet.";
    siteList.append(item);
    return;
  }

  siteList.append(
    ...schedule.sites.map((site, index) => {
      const enabled = isSiteEnabled(site);
      const blockingEnabled = enabled || Boolean(settings.blockAllForAll);
      const item = document.createElement("li");
      const button = document.createElement("button");
      const controls = document.createElement("div");
      const enableToggle = document.createElement("input");
      const deleteButton = document.createElement("button");
      const title = document.createElement("span");
      const meta = document.createElement("span");
      const usage = getUsageState(site.domain);

      item.className = "site-card";
      item.classList.toggle("is-disabled", !enabled);

      controls.className = "site-card-controls";

      enableToggle.type = "checkbox";
      enableToggle.className = "site-enable-toggle";
      enableToggle.checked = enabled;
      enableToggle.setAttribute("aria-label", `${enabled ? "Deactivate" : "Activate"} ${site.domain}`);
      enableToggle.title = enabled ? "Deactivate website" : "Activate website";
      enableToggle.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      enableToggle.addEventListener("change", (event) => {
        event.stopPropagation();
        void toggleSiteEnabled(index, enableToggle.checked, enableToggle);
      });

      deleteButton.type = "button";
      deleteButton.className = "site-delete-button";
      deleteButton.setAttribute("aria-label", `Delete ${site.domain}`);
      deleteButton.title = "Delete website";
      deleteButton.append(createDeleteIcon());
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        void deleteSiteFromList(index, deleteButton);
      });

      controls.append(enableToggle, deleteButton);

      button.type = "button";
      button.className = "site-row";
      button.addEventListener("click", () => {
        editingIndex = index;
        openEditor(site);
      });

      title.className = "site-domain";
      title.textContent = site.domain;

      meta.className = "site-meta";
      meta.textContent = siteSummary(site, usage);

      button.append(title, meta);

      if (blockingEnabled && isBlockedNow(site)) {
        const badge = document.createElement("span");
        badge.className = "active-badge";
        badge.textContent = "Blocked";
        button.append(badge);
      }

      item.append(controls, button);

      if (site.exceptions?.length > 0) {
        const exceptions = document.createElement("span");

        exceptions.className = "site-exceptions-preview";
        exceptions.textContent = `Allowed: ${formatExceptionPreview(site.exceptions)}`;
        item.append(exceptions);
      }

      const dailyRemainingSeconds = getDailyAllowanceRemainingSeconds(site, usage);
      const extraRemainingSeconds = getExtraRemainingSecondsForUsage(usage);

      if (blockingEnabled && (dailyRemainingSeconds !== null || extraRemainingSeconds > 0)) {
        const actions = document.createElement("div");

        actions.className = "site-row-actions";

        if (extraRemainingSeconds > 0) {
          const cutOffButton = document.createElement("button");
          const remainingNote = createSiteRemainingNote(`${formatDuration(extraRemainingSeconds)} added time remaining`);
          const extraUntil = normalizeTimestamp(usage?.extraUntil);
          const extraSeconds = Math.max(0, Number(usage?.extraSeconds) || 0);

          if (extraUntil > 0) {
            remainingNote.dataset.extraUntil = String(extraUntil);
          }

          if (extraSeconds > 0) {
            remainingNote.dataset.extraSeconds = String(extraSeconds);
          }

          actions.append(remainingNote);

          cutOffButton.type = "button";
          cutOffButton.className = "revoke-button";
          cutOffButton.textContent = "Revoke added time";
          cutOffButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            cutOffButton.disabled = true;

            try {
              const response = await chrome.runtime.sendMessage({
                type: "cut-off-site",
                domain: site.domain
              });

              if (!response?.ok) {
                throw new Error(response?.error || "Could not revoke added minutes.");
              }

              await loadData();
            } catch (error) {
              renderError(cleanError(error));
            } finally {
              cutOffButton.disabled = false;
            }
          });

          actions.append(cutOffButton);
        } else if (dailyRemainingSeconds !== null) {
          actions.append(createSiteRemainingNote(formatDailyAllowanceRemaining(dailyRemainingSeconds)));
        }

        item.append(actions);
      }

      return item;
    })
  );
  syncExtraTimeTicker();
}

function createDeleteIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const lid = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const body = document.createElementNS("http://www.w3.org/2000/svg", "path");

  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  lid.setAttribute("d", "M2.8 4.3h10.4M6.2 4.3V3.2h3.6v1.1");
  body.setAttribute("d", "M4.4 5.9 5 12.7c.1.7.6 1.1 1.3 1.1h3.4c.7 0 1.2-.4 1.3-1.1l.6-6.8M6.9 7.5v4.1M9.1 7.5v4.1");

  svg.append(lid, body);
  return svg;
}

async function toggleSiteEnabled(index, enabled, control = null) {
  const site = schedule.sites[index];

  if (!site) {
    return;
  }

  const previousSite = cloneSite(site);
  const nextEnabled = Boolean(enabled);

  schedule.sites[index] = {
    ...site,
    enabled: nextEnabled
  };

  if (control instanceof HTMLInputElement) {
    control.disabled = true;
  }

  try {
    await persistSchedule();
  } catch (error) {
    schedule.sites[index] = previousSite;
    renderError(cleanError(error));
    renderSiteList();
  }
}

async function deleteSiteFromList(index, control = null) {
  const site = schedule.sites[index];

  if (!site) {
    return;
  }

  const confirmed = window.confirm(`Delete ${site.domain} from your blocked websites?`);

  if (!confirmed) {
    return;
  }

  const [removedSite] = schedule.sites.splice(index, 1);

  if (control instanceof HTMLButtonElement) {
    control.disabled = true;
  }

  try {
    await persistSchedule();
  } catch (error) {
    schedule.sites.splice(index, 0, removedSite);
    renderError(cleanError(error));
    renderSiteList();
  }
}

function createSiteRemainingNote(text) {
  const note = document.createElement("span");

  note.className = "site-extra-note";
  note.textContent = text;
  return note;
}

function syncExtraTimeTicker() {
  const notes = Array.from(document.querySelectorAll("[data-extra-until]"));
  const hasActiveExtraTime = notes.some((note) => getExtraRemainingSecondsForNote(note) > 0);

  if (!hasActiveExtraTime) {
    stopExtraTimeTicker();
    return;
  }

  updateExtraTimeCountdowns();

  if (!extraTimeTickTimer) {
    extraTimeTickTimer = window.setInterval(updateExtraTimeCountdowns, 1000);
  }
}

function stopExtraTimeTicker() {
  if (extraTimeTickTimer) {
    window.clearInterval(extraTimeTickTimer);
    extraTimeTickTimer = 0;
  }
}

function updateExtraTimeCountdowns() {
  const notes = Array.from(document.querySelectorAll("[data-extra-until]"));
  let hasActiveExtraTime = false;
  let hasExpiredExtraTime = false;

  notes.forEach((note) => {
    const remainingSeconds = getExtraRemainingSecondsForNote(note);

    note.textContent = `${formatDuration(remainingSeconds)} added time remaining`;
    hasActiveExtraTime ||= remainingSeconds > 0;
    hasExpiredExtraTime ||= remainingSeconds <= 0;
  });

  if (hasExpiredExtraTime) {
    stopExtraTimeTicker();
    void loadData().catch(() => {});
    return;
  }

  if (!hasActiveExtraTime) {
    stopExtraTimeTicker();
  }
}

function getExtraRemainingSecondsForUsage(usage = null) {
  const extraUntil = normalizeTimestamp(usage?.extraUntil);

  if (extraUntil > 0) {
    return getExtraRemainingSecondsFromValues(extraUntil, usage?.extraSeconds);
  }

  return Math.max(0, Number(usage?.extraRemainingSeconds) || 0);
}

function getExtraRemainingSecondsForNote(note) {
  return getExtraRemainingSecondsFromValues(note?.dataset?.extraUntil, note?.dataset?.extraSeconds);
}

function getExtraRemainingSecondsFromValues(until, seconds) {
  const extraUntil = normalizeTimestamp(until);

  if (extraUntil <= 0) {
    return 0;
  }

  const storedSeconds = Math.max(0, Number(seconds) || 0);
  const clockRemainingSeconds = Math.max(0, (extraUntil - Date.now()) / 1000);

  return storedSeconds > 0
    ? Math.min(storedSeconds, clockRemainingSeconds)
    : clockRemainingSeconds;
}

function formatExceptionPreview(exceptions = []) {
  const visible = exceptions.slice(0, 2);
  const suffix = exceptions.length > visible.length
    ? ` +${exceptions.length - visible.length} more`
    : "";

  return `${visible.join(", ")}${suffix}`;
}

function getDailyAllowanceRemainingSeconds(site, usage = null) {
  const allowanceSeconds = Math.max(0, Number(site?.dailyAllowanceMinutes) || 0) * 60;

  if (allowanceSeconds <= 0) {
    return null;
  }

  const usedSeconds = Math.max(0, Number(usage?.usedSeconds) || 0);
  return Math.max(0, allowanceSeconds - usedSeconds);
}

function formatDailyAllowanceRemaining(seconds) {
  return seconds > 0
    ? `${formatDuration(seconds)} included time remaining`
    : "Daily time is up for today";
}

function addExceptionFromInput() {
  if (!exceptionInput) {
    return;
  }

  const siteDomainValue = normalizeDomain(siteDomain.value);

  try {
    const exception = normalizeExceptionForSite(exceptionInput.value, siteDomainValue);
    const existing = getEditorExceptions();

    if (existing.includes(exception)) {
      throw new Error("That exception is already added.");
    }

    renderExceptionList([...existing, exception]);
    exceptionInput.value = "";
    clearFormError();
    clearExceptionWarning();
    queueEditorAutosave({ immediate: true });
  } catch (error) {
    clearFormError();
    setExceptionWarning(cleanError(error));
    exceptionInput.focus();
  }
}

function renderExceptionList(exceptions = []) {
  if (!exceptionList) {
    return;
  }

  const normalized = normalizeExceptionList(exceptions, normalizeDomain(siteDomain.value));
  exceptionList.replaceChildren();

  if (normalized.length === 0) {
    const empty = document.createElement("li");

    empty.className = "exception-empty";
    empty.textContent = "No exceptions.";
    exceptionList.append(empty);
    return;
  }

  normalized.forEach((exception) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const remove = document.createElement("button");

    item.className = "exception-chip";
    item.dataset.exception = exception;
    label.textContent = exception;
    remove.type = "button";
    remove.className = "exception-remove";
    remove.dataset.removeException = exception;
    remove.setAttribute("aria-label", `Remove ${exception}`);
    remove.textContent = "Remove";

    item.append(label, remove);
    exceptionList.append(item);
  });
}

function getEditorExceptions() {
  if (!exceptionList) {
    return [];
  }

  return Array.from(exceptionList.querySelectorAll("[data-exception]"))
    .map((item) => normalizeDomain(item.dataset.exception || ""))
    .filter(Boolean);
}

function readExceptionsForSave(domain) {
  const normalized = [];

  getEditorExceptions().forEach((item) => {
    const exception = normalizeExceptionForSite(item, domain);

    if (!normalized.includes(exception)) {
      normalized.push(exception);
    }
  });

  return normalized;
}

function collapseEditorSettingDetails() {
  blockDetailsExpanded = false;
  grayscaleDetailsExpanded = false;
  redLightDetailsExpanded = false;
}

function collapseGlobalSettingDetails() {
  globalGrayscaleDetailsExpanded = false;
  globalRedLightDetailsExpanded = false;
}

function openEditor(site) {
  clearFormError();
  clearExceptionWarning();
  collapseEditorSettingDetails();
  scheduleTab?.setAttribute("aria-pressed", "true");
  usageTab?.setAttribute("aria-pressed", "false");
  siteDomain.value = site.domain || "";
  if (exceptionInput) {
    exceptionInput.value = "";
  }
  renderExceptionList(site.exceptions || []);
  dailyAllowance.value = String(site.dailyAllowanceMinutes || 0);
  allowExtraTime.checked = Boolean(site.allowExtraTime);
  if (blockEnabled) {
    blockEnabled.checked = isSiteEnabled(site);
  }
  if (grayscaleSite) {
    grayscaleSite.checked = Boolean(site.grayscale);
  }
  setModeRadios(grayscaleModeRadios, normalizeEffectMode(site.grayscaleMode));
  if (redLightSite) {
    redLightSite.checked = Boolean(site.redLight);
  }
  setModeRadios(redLightModeRadios, normalizeEffectMode(site.redLightMode));
  requirePinExtra.checked = Boolean(site.requirePinForExtraTime);
  syncPinSetupView();
  syncEditorGlobalOverrideView(site);
  renderIntervalList(
    grayscaleIntervalList,
    site.grayscaleIntervals || site.effectIntervals,
    queueEditorAutosave,
    { expanded: editingIndex === null }
  );
  renderIntervalList(
    redLightIntervalList,
    site.redLightIntervals || site.effectIntervals,
    queueEditorAutosave,
    { expanded: editingIndex === null }
  );
  intervalList.replaceChildren();
  clearTimeout(editorAutosaveTimer);

  const blockMode = normalizeBlockMode(site.blockMode, site.intervals);
  const intervals = Array.isArray(site.intervals) && site.intervals.length > 0
    ? site.intervals
    : [{ ...DEFAULT_INTERVAL }];

  setBlockMode(blockMode);
  intervals.forEach((interval) => {
    appendInterval(intervalList, interval, { expanded: editingIndex === null, onChange: queueEditorAutosave });
  });

  syncSiteVisualEffectMenus();
  syncBlockingModeView();

  listView.hidden = true;
  editorView.hidden = false;
  usageView.hidden = true;
  focusView.hidden = true;
  statusPanel.hidden = false;
  back.hidden = false;
  focusTab?.setAttribute("aria-pressed", "false");
  deleteSite.hidden = editingIndex === null;
  siteForm?.classList.toggle("is-new-site", editingIndex === null);

  if (saveSite) {
    saveSite.hidden = editingIndex !== null;
    saveSite.textContent = "Add website";
    saveSite.disabled = false;
  }

  siteDomain.focus();
}

function getBlockMode() {
  return blockModeRadios.find((radio) => radio.checked)?.value || "slots";
}

function setBlockMode(mode) {
  blockModeRadios.forEach((radio) => {
    radio.checked = radio.value === mode;
  });
}

function normalizeEffectMode(mode) {
  return mode === "slots" ? "slots" : "always";
}

function setModeRadios(radios, mode) {
  const normalized = normalizeEffectMode(mode);
  let selected = false;

  radios.forEach((radio) => {
    radio.checked = radio.value === normalized;
    selected ||= radio.checked;
  });

  if (!selected && radios.length > 0) {
    radios[0].checked = true;
  }

  radios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });
}

function getModeFromRadios(radios, fallback = "always") {
  return normalizeEffectMode(radios.find((radio) => radio.checked)?.value || fallback);
}

function syncGlobalVisualEffectMenus() {
  syncSettingDetails(globalGrayscale, globalGrayscaleDetails, globalGrayscaleExpander, globalGrayscaleDetailsExpanded, "grayscale");
  globalGrayscaleModeRadios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });

  syncSettingDetails(globalRedLight, globalRedLightDetails, globalRedLightExpander, globalRedLightDetailsExpanded, "red light");
  globalRedLightModeRadios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });

  syncGlobalEffectIntervalsView();
}

function syncSiteVisualEffectMenus() {
  syncSettingDetails(grayscaleSite, grayscaleDetails, grayscaleExpander, grayscaleDetailsExpanded, "grayscale");
  grayscaleModeRadios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });

  syncSettingDetails(redLightSite, redLightDetails, redLightExpander, redLightDetailsExpanded, "red light");
  redLightModeRadios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });

  syncSiteEffectIntervalsView();
}

function syncSettingDetails(toggle, details, expander, expanded, label, forceEnabled = null) {
  const enabled = forceEnabled === null ? Boolean(toggle?.checked) : Boolean(forceEnabled);
  const showDetails = enabled && expanded;

  if (details) {
    details.hidden = !showDetails;
  }

  if (expander) {
    expander.hidden = !enabled;
    expander.textContent = expanded ? "▴" : "▾";
    expander.setAttribute("aria-expanded", String(showDetails));
    expander.setAttribute("aria-label", `${expanded ? "Hide" : "Show"} ${label} settings`);
  }
}

function syncSiteEffectIntervalsView() {
  syncEffectIntervalView({
    toggle: grayscaleSite,
    radios: grayscaleModeRadios,
    heading: grayscaleSlotHeading,
    list: grayscaleIntervalList,
    addButton: addGrayscaleInterval,
    fallbackList: intervalList,
    onChange: queueEditorAutosave
  });
  syncEffectIntervalView({
    toggle: redLightSite,
    radios: redLightModeRadios,
    heading: redLightSlotHeading,
    list: redLightIntervalList,
    addButton: addRedLightInterval,
    fallbackList: intervalList,
    onChange: queueEditorAutosave
  });
}

function syncGlobalEffectIntervalsView() {
  syncEffectIntervalView({
    toggle: globalGrayscale,
    radios: globalGrayscaleModeRadios,
    heading: globalGrayscaleSlotHeading,
    list: globalGrayscaleIntervalList,
    addButton: addGlobalGrayscaleInterval,
    fallbackList: globalRedLightIntervalList,
    onChange: queueGlobalEffectAutosave
  });
  syncEffectIntervalView({
    toggle: globalRedLight,
    radios: globalRedLightModeRadios,
    heading: globalRedLightSlotHeading,
    list: globalRedLightIntervalList,
    addButton: addGlobalRedLightInterval,
    fallbackList: globalGrayscaleIntervalList,
    onChange: queueGlobalEffectAutosave
  });
}

function syncEffectIntervalView({ toggle, radios, heading, list, addButton, fallbackList, onChange }) {
  if (!heading || !list || !addButton) {
    return;
  }

  const needsSlots = Boolean(toggle?.checked) && getModeFromRadios(radios) === "slots";

  heading.hidden = !needsSlots;
  list.hidden = !needsSlots;
  addButton.disabled = !needsSlots;

  if (!needsSlots) {
    return;
  }

  if (list.children.length === 0) {
    const fallback = getIntervalsFromListOrDefault(fallbackList);

    fallback.forEach((interval, index) => {
      appendInterval(list, interval, { expanded: index === 0, onChange });
    });
  }
}

function getIntervalsFromListOrDefault(listElement) {
  if (!listElement) {
    return [{ ...DEFAULT_INTERVAL }];
  }

  try {
    const intervals = readIntervalsFrom(listElement);
    return intervals.length > 0 ? intervals : [{ ...DEFAULT_INTERVAL }];
  } catch (_error) {
    return [{ ...DEFAULT_INTERVAL }];
  }
}

function renderIntervalList(listElement, intervals, onChange = queueEditorAutosave, { expanded = false } = {}) {
  if (!listElement) {
    return;
  }

  listElement.replaceChildren();
  cloneIntervals(intervals).forEach((interval) => {
    appendInterval(listElement, interval, { expanded, onChange });
  });
}

function cloneIntervals(intervals) {
  if (!Array.isArray(intervals)) {
    return [];
  }

  return intervals.map((interval) => {
    const normalized = normalizeInterval(interval);

    return {
      start: normalized.start,
      end: normalized.end,
      ...(normalized.days ? { days: [...normalized.days] } : {})
    };
  });
}

function readEffectIntervalsForSave(listElement, { enabled, mode, fallback = [], label = "effect" } = {}) {
  if (!listElement) {
    return cloneIntervals(fallback);
  }

  if (!enabled || mode !== "slots") {
    try {
      return readIntervalsFrom(listElement);
    } catch (_error) {
      return cloneIntervals(fallback);
    }
  }

  const intervals = readIntervalsFrom(listElement);

  if (intervals.length === 0) {
    throw new Error(`Add at least one scheduled ${label} slot.`);
  }

  return intervals;
}

function syncBlockingModeView() {
  const isBlocked = blockEnabled ? blockEnabled.checked : true;
  const isEffectiveBlocked = isBlocked || Boolean(settings.blockAllForAll);

  syncSettingDetails(blockEnabled, blockDetails, blockExpander, blockDetailsExpanded, "blocking", isEffectiveBlocked);

  if (blockModeOptions) {
    blockModeOptions.hidden = !isEffectiveBlocked;
  }

  if (!isEffectiveBlocked) {
    slotHeading.hidden = true;
    intervalList.hidden = true;
    addInterval.disabled = true;
    return;
  }

  const isAlwaysBlocked = getBlockMode() === "always";
  blockModeRadios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });
  slotHeading.hidden = isAlwaysBlocked;
  intervalList.hidden = isAlwaysBlocked;
  addInterval.disabled = isAlwaysBlocked;

  if (!isAlwaysBlocked && intervalList.children.length === 0) {
    appendInterval(intervalList, { ...DEFAULT_INTERVAL }, { expanded: true, onChange: queueEditorAutosave });
  }
}

function isAllDaySite(site) {
  if (normalizeBlockMode(site?.blockMode, site?.intervals) === "always") {
    return true;
  }

  const intervals = Array.isArray(site?.intervals) ? site.intervals : [];

  return isLegacyAllDayIntervals(intervals);
}

function isAllDayInterval(interval) {
  const normalized = normalizeInterval(interval);
  return normalized.start === ALL_DAY_INTERVAL.start &&
    normalized.end === ALL_DAY_INTERVAL.end &&
    (!normalized.days || normalized.days.length === DAYS.length);
}

function isLegacyAllDayIntervals(intervals) {
  return Array.isArray(intervals) && intervals.length === 1 && isAllDayInterval(intervals[0]);
}

function queueEditorAutosave({ immediate = false } = {}) {
  if (editorView.hidden) {
    return;
  }

  // New websites must be explicitly created with the Add website button.
  // Existing websites can still autosave.
  if (editingIndex === null) {
    return;
  }

  clearTimeout(editorAutosaveTimer);
  editorAutosaveTimer = window.setTimeout(() => {
    void autosaveEditor();
  }, immediate ? 0 : 350);
}

let globalEffectAutosaveTimer = 0;
let globalEffectAutosaveInFlight = false;
let globalEffectAutosaveQueued = false;

function queueGlobalEffectAutosave({ immediate = false } = {}) {
  if (!globalGrayscaleIntervalList && !globalRedLightIntervalList) {
    return;
  }

  clearTimeout(globalEffectAutosaveTimer);
  globalEffectAutosaveTimer = window.setTimeout(() => {
    globalEffectAutosaveTimer = 0;
    void saveGlobalEffectIntervals();
  }, immediate ? 0 : 350);
}

async function saveGlobalEffectIntervals() {
  if (!globalGrayscaleIntervalList && !globalRedLightIntervalList) {
    return;
  }

  if (globalSettingsSaveInFlight || globalSettingsSaveQueued) {
    globalEffectAutosaveQueued = true;
    return;
  }

  if (globalEffectAutosaveInFlight) {
    globalEffectAutosaveQueued = true;
    return;
  }

  let grayscaleIntervalsForAll = [];
  let redLightIntervalsForAll = [];

  try {
    grayscaleIntervalsForAll = readEffectIntervalsForSave(globalGrayscaleIntervalList, {
      enabled: Boolean(globalGrayscale?.checked),
      mode: getModeFromRadios(globalGrayscaleModeRadios, settings.grayscaleForAllMode),
      fallback: settings.grayscaleIntervalsForAll || settings.effectIntervalsForAll,
      label: "grayscale"
    });
    redLightIntervalsForAll = readEffectIntervalsForSave(globalRedLightIntervalList, {
      enabled: Boolean(globalRedLight?.checked),
      mode: getModeFromRadios(globalRedLightModeRadios, settings.redLightForAllMode),
      fallback: settings.redLightIntervalsForAll || settings.effectIntervalsForAll,
      label: "red light"
    });
  } catch (error) {
    setSettingsStatus("global", cleanError(error), { error: true });
    return;
  }

  globalEffectAutosaveInFlight = true;
  setSettingsStatus("global", "Saving...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "save-settings",
      settings: {
        grayscaleIntervalsForAll,
        redLightIntervalsForAll,
        effectIntervalsForAll: grayscaleIntervalsForAll
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save effect schedule.");
    }

    settings = normalizeSettings(response.settings || settings);
    state = response.state || state;
    setSettingsStatus("global", "Effect schedule saved.");
  } catch (error) {
    setSettingsStatus("global", cleanError(error), { error: true });
  } finally {
    globalEffectAutosaveInFlight = false;

    if (globalEffectAutosaveQueued) {
      globalEffectAutosaveQueued = false;
      queueGlobalEffectAutosave({ immediate: true });
    }
  }
}

async function autosaveEditor({ fromSubmit = false } = {}) {
  if (editorView.hidden) {
    return;
  }

  if (editingIndex === null && !fromSubmit) {
    return;
  }

  if (editorAutosaveInFlight) {
    editorAutosaveQueued = true;
    return;
  }

  clearFormError();

  let site;

  try {
    site = readSiteForm();
  } catch (error) {
    const message = cleanError(error);

    if (editingIndex === null && (message === "Enter a website domain." || message === "Enter a valid website domain.")) {
      clearFormError();
      return;
    }

    setFormError(message);
    return;
  }

  editorAutosaveInFlight = true;
  const previousIndex = editingIndex;
  const previousSite = previousIndex === null ? null : cloneSite(schedule.sites[previousIndex]);

  if (saveSite) {
    saveSite.disabled = true;
    saveSite.textContent = previousIndex === null ? "Adding..." : "Add website";
  }

  if (previousIndex === null) {
    schedule.sites.push(site);
    editingIndex = schedule.sites.length - 1;
  } else {
    schedule.sites[previousIndex] = site;
  }

  try {
    await persistSchedule();
    deleteSite.hidden = editingIndex === null;
    clearFormError();

    if (saveSite) {
      saveSite.hidden = editingIndex !== null;
      saveSite.textContent = "Add website";
    }

    if (fromSubmit && previousIndex === null) {
      showList();
      return;
    }
  } catch (error) {
    if (previousIndex === null) {
      schedule.sites.pop();
      editingIndex = null;
    } else if (previousSite) {
      schedule.sites[previousIndex] = previousSite;
      editingIndex = previousIndex;
    }

    setFormError(cleanError(error));
  } finally {
    editorAutosaveInFlight = false;

    if (saveSite) {
      saveSite.hidden = editingIndex !== null;
      saveSite.disabled = false;
      saveSite.textContent = "Add website";
    }

    if (editorAutosaveQueued) {
      editorAutosaveQueued = false;
      void autosaveEditor();
    }
  }
}

function showList() {
  clearTimeout(editorAutosaveTimer);
  clearExceptionWarning();
  collapseEditorSettingDetails();
  collapseGlobalSettingDetails();
  syncGlobalVisualEffectMenus();
  scheduleTab?.setAttribute("aria-pressed", "true");
  usageTab?.setAttribute("aria-pressed", "false");
  focusTab?.setAttribute("aria-pressed", "false");
  editorView.hidden = true;
  listView.hidden = false;
  usageView.hidden = true;
  focusView.hidden = true;
  statusPanel.hidden = false;
  back.hidden = true;
  editingIndex = null;
}

function showScheduleView() {
  showList();
}

async function showUsageView() {
  clearTimeout(editorAutosaveTimer);
  editingIndex = null;
  clearFormError();
  clearExceptionWarning();
  collapseEditorSettingDetails();
  collapseGlobalSettingDetails();
  syncGlobalVisualEffectMenus();
  scheduleTab?.setAttribute("aria-pressed", "false");
  usageTab?.setAttribute("aria-pressed", "true");
  focusTab?.setAttribute("aria-pressed", "false");
  statusPanel.hidden = true;
  listView.hidden = true;
  editorView.hidden = true;
  usageView.hidden = false;
  focusView.hidden = true;
  back.hidden = true;
  await loadUsageData();
}

function showFocusView() {
  clearTimeout(editorAutosaveTimer);
  editingIndex = null;
  clearFormError();
  clearExceptionWarning();
  collapseEditorSettingDetails();
  collapseGlobalSettingDetails();
  syncGlobalVisualEffectMenus();
  scheduleTab?.setAttribute("aria-pressed", "false");
  usageTab?.setAttribute("aria-pressed", "false");
  focusTab?.setAttribute("aria-pressed", "true");
  statusPanel.hidden = true;
  listView.hidden = true;
  editorView.hidden = true;
  usageView.hidden = true;
  focusView.hidden = false;
  back.hidden = true;
  renderPomodoro();

  syncPomodoroStatsVisibility();

  if (pomodoroStatsVisible) {
    void loadPomodoroStats();
  }
}

async function loadUsageData() {
  const response = await chrome.runtime.sendMessage({ type: "get-usage-data" });

  if (!response?.ok) {
    usageData = {
      days: [],
      usageByDay: {}
    };
    usageTotal.textContent = "0m";
    weekTrend.textContent = response?.error || "Could not load usage.";
    weekSelectedTotal.textContent = "0m";
    weekAverageTotal.textContent = "0m";
    weekChart.replaceChildren();
    usagePeak.textContent = response?.error || "Could not load usage.";
    usageCount.textContent = "0 sites";
    hourChart.replaceChildren();
    usagePie.style.background = "";
    usagePie.classList.add("is-empty");
    usagePieTooltip.hidden = true;
    usagePieLegend.replaceChildren();
    usageSites.replaceChildren(createEmptyUsageRow("Usage data could not be loaded."));
    renderAnalyticsSummary(selectedUsageDay, visibleWeekDay || dateToDayKey(new Date()));
    return;
  }

  usageData = {
    days: Array.isArray(response.days) ? response.days : [],
    usageByDay: response.usageByDay && typeof response.usageByDay === "object"
      ? response.usageByDay
      : {}
  };

  const todayKey = dateToDayKey(new Date());
  visibleWeekDay ||= todayKey;
  renderUsageForDay(getSelectedDayForVisibleWeek(visibleWeekDay), { weekDay: visibleWeekDay });
}

function shiftUsageWeek(amount) {
  const selectedDate = parseDayKey(visibleWeekDay) || new Date();
  const nextWeekDay = dateToDayKey(addDays(selectedDate, amount * 7));
  const nextSelectedDay = getSelectedDayForVisibleWeek(nextWeekDay, { keepExistingSelection: false });

  clearUsageSelections({ keepWeek: false });
  renderUsageForDay(nextSelectedDay, { weekDay: nextWeekDay });
}

function shiftSelectedHour(amount) {
  const peakSeconds = Math.max(0, ...currentHourlyTotals);
  const fallbackHour = peakSeconds > 0 ? currentHourlyTotals.indexOf(peakSeconds) : 0;
  const baseHour = selectedHour ?? highlightedHour ?? fallbackHour;

  selectedPieDomain = "";
  highlightedPieDomain = "";
  selectedWeekDay = "";
  selectedHour = (baseHour + amount + 24) % 24;
  highlightedHour = null;
  updatePieHighlight();
  updateWeekHighlight();
  updateCategoryHighlight();
}

function renderUsageForDay(day, { weekDay = day || visibleWeekDay || dateToDayKey(new Date()) } = {}) {
  const selectedDay = day || null;
  visibleWeekDay = weekDay || selectedDay || dateToDayKey(new Date());
  selectedUsageDay = selectedDay;
  selectedWeekDay = selectedDay || "";
  renderWeekOverview(visibleWeekDay, selectedDay);

  if (!selectedDay) {
    renderNoSelectedDayDetails();
    return;
  }

  currentDaySites = getDaySites(selectedDay);
  currentContext = {
    days: [selectedDay],
    sites: currentDaySites,
    totalSeconds: getSitesTotalSeconds(currentDaySites)
  };
  const hourlyData = getHourlyData(currentDaySites);
  currentHourlyTotals = hourlyData.hourly;
  currentHourlyCategories = hourlyData.hourlyCategories;
  const peakSeconds = Math.max(0, ...currentHourlyTotals);
  const peakHour = currentHourlyTotals.indexOf(peakSeconds);

  const compactDomains = new Set(currentContext.sites.slice(0, COMPACT_SITE_LIMIT).map((site) => site.domain));
  const hasOtherWebsites = currentContext.sites.length > COMPACT_SITE_LIMIT;
  const selectedPieDomainIsVisible = shareMode === "all"
    ? currentContext.sites.some((site) => site.domain === selectedPieDomain)
    : compactDomains.has(selectedPieDomain) || (selectedPieDomain === OTHER_WEBSITES_LABEL && hasOtherWebsites);

  if (selectedPieDomain && !selectedPieDomainIsVisible) {
    selectedPieDomain = "";
    highlightedPieDomain = "";
  }

  usageTotal.textContent = formatDuration(currentContext.totalSeconds);
  usageCount.textContent = `${currentContext.sites.length} site${currentContext.sites.length === 1 ? "" : "s"}`;
  usagePeak.textContent = peakSeconds > 0
    ? `Peak ${formatHour(peakHour)}: ${formatDuration(peakSeconds)}`
    : "No usage yet";

  renderAnalyticsSummary(selectedDay);
  renderHourChart(currentHourlyTotals, currentHourlyCategories);
  renderUsagePie(currentContext.sites, currentContext.totalSeconds);
  renderUsageSites(currentContext.sites, currentContext.totalSeconds);
  updatePieHighlight();
}

function renderNoSelectedDayDetails() {
  currentDaySites = [];
  currentContext = {
    days: [],
    sites: [],
    totalSeconds: 0
  };
  currentHourlyTotals = Array.from({ length: 24 }, () => 0);
  currentHourlyCategories = Array.from({ length: 24 }, () => ({}));

  usageTotal.textContent = "0m";
  usageCount.textContent = "Select a day";
  usagePeak.textContent = "Select a day to view details";

  renderAnalyticsSummary(null, visibleWeekDay);
  renderHourChart(currentHourlyTotals, currentHourlyCategories);
  renderUsagePie([], 0, "Select a day to view website share.");
  renderUsageSites([], 0, "Select a day to view details.");
  updatePieHighlight();
}

function getDaySites(day) {
  const snapshot = normalizeUsageSnapshot(usageData.usageByDay?.[day]);

  return Object.entries(snapshot.sites)
    .map(([domain, entry]) => ({
      domain,
      screenSeconds: Math.max(0, Number(entry.screenSeconds) || 0),
      hourlySeconds: normalizeHourlySeconds(entry.hourlySeconds),
      category: categorizeDomain(domain)
    }))
    .filter((site) => site.screenSeconds > 0)
    .sort((left, right) => right.screenSeconds - left.screenSeconds);
}

function aggregateSitesForDays(days) {
  const sites = new Map();

  days.forEach((day) => {
    getDaySites(day).forEach((site) => {
      if (!sites.has(site.domain)) {
        sites.set(site.domain, {
          domain: site.domain,
          screenSeconds: 0,
          hourlySeconds: Array.from({ length: 24 }, () => 0),
          category: site.category
        });
      }

      const entry = sites.get(site.domain);
      entry.screenSeconds += site.screenSeconds;
      site.hourlySeconds.forEach((seconds, index) => {
        entry.hourlySeconds[index] += seconds;
      });
    });
  });

  return Array.from(sites.values()).sort((left, right) => right.screenSeconds - left.screenSeconds);
}

function getHourlyData(sites) {
  const hourly = Array.from({ length: 24 }, () => 0);
  const hourlyCategories = Array.from({ length: 24 }, () => ({}));

  sites.forEach((site) => {
    site.hourlySeconds.forEach((seconds, index) => {
      hourly[index] += seconds;
      hourlyCategories[index][site.category] = (hourlyCategories[index][site.category] || 0) + seconds;
    });
  });

  return { hourly, hourlyCategories };
}

function getSitesTotalSeconds(sites) {
  return sites.reduce((sum, site) => sum + site.screenSeconds, 0);
}

function renderAnalyticsSummary(selectedDay, weekDay = selectedDay || visibleWeekDay || dateToDayKey(new Date())) {
  const allDays = Object.keys(usageData.usageByDay || {}).sort();
  const weekDays = getWeekDayKeys(weekDay);
  const selectedSites = selectedDay ? getDaySites(selectedDay) : [];
  const weekSites = aggregateSitesForDays(weekDays);
  const allSites = aggregateSitesForDays(allDays);
  const selectedTotal = getSitesTotalSeconds(selectedSites);
  const weekTotal = getSitesTotalSeconds(weekSites);
  const allTotal = getSitesTotalSeconds(allSites);
  const activeDays = allDays.filter((day) => getDayTotalSeconds(day) > 0).length;
  const allDailyAverage = allTotal / Math.max(1, activeDays);
  const topSite = selectedSites[0];
  const topSiteNote = selectedDay
    ? topSite ? formatDuration(topSite.screenSeconds) : "No usage"
    : "Select a day";
  const todayKey = dateToDayKey(new Date());
  const dailyOverviewTitle = selectedDay
    ? selectedDay === todayKey ? "Today's Overview" : `${formatDayLabel(selectedDay)} Overview`
    : "Daily Overview";
  const sections = [
    {
      title: "All-Time Overview",
      cards: [
        { label: "All tracked", value: formatDuration(allTotal), note: `${activeDays} active day${activeDays === 1 ? "" : "s"}` },
        { label: "This week", value: formatDuration(weekTotal), note: `Average ${formatDuration(weekTotal / 7)}` },
        { label: "Daily average", value: formatDuration(allDailyAverage), note: "Across active days" },
        { label: "Websites", value: String(allSites.length), note: "Recorded so far" }
      ]
    },
    {
      title: dailyOverviewTitle,
      cards: [
        { label: "Selected day", value: selectedDay ? formatDuration(selectedTotal) : "None", note: selectedDay ? formatDayLabel(selectedDay) : "Select a day" },
        { label: "Top website", value: topSite ? topSite.domain : "None", note: topSiteNote }
      ]
    }
  ];

  analyticsSummary.replaceChildren(
    ...sections.map((section) => {
      const wrapper = document.createElement("section");
      const heading = document.createElement("h3");
      const cards = document.createElement("div");

      wrapper.className = "analytics-group";
      heading.className = "analytics-heading";
      heading.textContent = section.title;
      cards.className = "analytics-cards";

      cards.append(
        ...section.cards.map((card) => {
          const item = document.createElement("div");
          const label = document.createElement("span");
          const value = document.createElement("strong");
          const note = document.createElement("small");

          item.className = "analytics-card";
          label.textContent = card.label;
          value.textContent = card.value;
          note.textContent = card.note;
          item.append(label, value, note);
          return item;
        })
      );

      wrapper.append(heading, cards);
      return wrapper;
    })
  );
}

function renderWeekOverview(weekDay, selectedDay) {
  const weekDays = getWeekDayKeys(weekDay);
  const previousWeekDays = getPreviousWeekDayKeys(weekDay);
  const todayKey = dateToDayKey(new Date());
  const firstVisibleDay = weekDays[0];
  const visibleWeekIncludesToday = weekDays.includes(todayKey);
  const visibleWeekStartsInFuture = firstVisibleDay > todayKey;
  const hasOlderUsage = usageData.days.some((day) => day < firstVisibleDay);
  const weekEntries = weekDays.map((day) => ({
    day,
    seconds: getDayTotalSeconds(day)
  }));
  const previousEntries = previousWeekDays.map((day) => ({
    day,
    seconds: getDayTotalSeconds(day)
  }));
  const selectedEntry = selectedDay ? weekEntries.find((entry) => entry.day === selectedDay) : null;
  const currentAverage = getWeekAverageSeconds(weekEntries, weekDay);
  const previousAverage = getWeekAverageSeconds(previousEntries, previousWeekDays[0], { fullWeek: true });

  weekSelectedLabel.textContent = selectedDay ? formatDayLabel(selectedDay) : "Select a day";
  weekSelectedTotal.textContent = selectedEntry ? formatDuration(selectedEntry.seconds) : "0m";
  weekAverageTotal.textContent = formatDuration(currentAverage);
  weekRange.textContent = formatWeekRange(weekDays);
  weekTrend.textContent = formatWeekTrend(currentAverage, previousAverage, weekDay);
  if (prevWeek) {
    prevWeek.disabled = !hasOlderUsage;
  }

  if (nextWeek) {
    nextWeek.disabled = visibleWeekIncludesToday || visibleWeekStartsInFuture;
  }

  renderWeekChart(weekEntries, selectedDay, currentAverage);
}

function renderWeekChart(entries, selectedDay, averageSeconds) {
  const scaleMax = Math.max(1, averageSeconds, ...entries.map((entry) => entry.seconds));
  const averageHeight = Math.min(100, averageSeconds / scaleMax * 100);
  const averageBottom = 24 + averageHeight / 100 * 96;
  const averageLine = document.createElement("span");

  averageLine.className = "week-average-line";
  averageLine.style.bottom = `${averageBottom}px`;

  weekChart.replaceChildren(
    averageLine,
    ...entries.map((entry) => {
      const button = document.createElement("button");
      const track = document.createElement("span");
      const bar = document.createElement("span");
      const label = document.createElement("span");
      const height = entry.seconds > 0 ? Math.max(5, entry.seconds / scaleMax * 100) : 0;

      button.type = "button";
      button.className = "week-day";
      button.dataset.day = entry.day;
      button.setAttribute("aria-pressed", String(entry.day === selectedDay));
      button.setAttribute("aria-label", `${formatDayLabel(entry.day)}: ${formatDuration(entry.seconds)}`);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const nextSelectedDay = selectedUsageDay === entry.day ? null : entry.day;
        clearUsageSelections({ keepWeek: true });
        renderUsageForDay(nextSelectedDay, { weekDay: entry.day });
      });

      track.className = "week-bar-track";
      bar.className = "week-bar";
      bar.style.height = `${height}%`;
      label.className = "week-day-label";
      label.textContent = formatShortWeekday(entry.day);

      track.append(bar);
      button.append(track, label);
      return button;
    })
  );
  updateWeekHighlight();
}

function updateWeekHighlight() {
  const activeDay = selectedUsageDay;

  weekChart.querySelectorAll(".week-day").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.day === activeDay));
  });
}

function renderHourChart(hourly, hourlyCategories) {
  const activeCategories = getActiveCategories(hourlyCategories);
  if (selectedCategory && !activeCategories.includes(selectedCategory)) {
    selectedCategory = "";
    highlightedCategory = "";
  }

  hourChart.replaceChildren(
    ...hourly.map((seconds, hour) => {
      const column = document.createElement("button");
      const barWrap = document.createElement("div");
      const label = document.createElement("span");

      column.type = "button";
      column.className = "hour-column";
      column.dataset.hour = String(hour);
      column.setAttribute("aria-pressed", String(selectedHour === hour));
      column.setAttribute("aria-label", `${formatHour(hour)}: ${formatDuration(seconds)}`);
      column.title = `${formatHour(hour)} total: ${formatDuration(seconds)}`;
      column.addEventListener("click", () => {
        selectedPieDomain = "";
        highlightedPieDomain = "";
        selectedWeekDay = "";
        selectedHour = selectedHour === hour ? null : hour;
        selectedCategory = "";
        updatePieHighlight();
        updateWeekHighlight();
        updateCategoryHighlight();
      });

      barWrap.className = "hour-bar-track";

      activeCategories.forEach((category) => {
        const categorySeconds = hourlyCategories[hour]?.[category] || 0;

        if (categorySeconds <= 0) {
          return;
        }

        const segment = document.createElement("span");
        segment.className = "hour-segment";
        segment.dataset.category = category;
        segment.dataset.hour = String(hour);
        segment.style.height = `${Math.min(100, categorySeconds / 3600 * 100)}%`;
        segment.style.background = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
        segment.title = `${formatHour(hour)} total: ${formatDuration(seconds)} · ${CATEGORY_LABELS[category]}: ${formatDuration(categorySeconds)}`;
        segment.addEventListener("mouseenter", () => {
          highlightedCategory = category;
          highlightedHour = hour;
          updateCategoryHighlight();
        });
        segment.addEventListener("mouseleave", () => {
          highlightedCategory = "";
          highlightedHour = null;
          updateCategoryHighlight();
        });
        segment.addEventListener("click", (event) => {
          event.stopPropagation();
          selectedPieDomain = "";
          highlightedPieDomain = "";
          selectedWeekDay = "";
          selectedCategory = selectedCategory === category && selectedHour === hour ? "" : category;
          selectedHour = selectedCategory ? hour : null;
          updatePieHighlight();
          updateWeekHighlight();
          updateCategoryHighlight();
        });
        barWrap.append(segment);
      });

      label.className = "hour-label";
      label.textContent = hour % 3 === 0 ? String(hour) : "";

      column.append(barWrap, label);
      return column;
    })
  );
  renderCategoryLegend(activeCategories);
  updateCategoryHighlight();
}

function renderCategoryLegend(categories) {
  if (categories.length === 0) {
    categoryLegend.replaceChildren();
    return;
  }

  categoryLegend.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      const swatch = document.createElement("span");
      const label = document.createElement("span");

      button.type = "button";
      button.className = "category-chip";
      button.dataset.category = category;
      button.setAttribute("aria-pressed", String(selectedCategory === category && selectedHour === null));
      button.addEventListener("mouseenter", () => {
        highlightedCategory = category;
        highlightedHour = null;
        updateCategoryHighlight();
      });
      button.addEventListener("mouseleave", () => {
        highlightedCategory = "";
        highlightedHour = null;
        updateCategoryHighlight();
      });
      button.addEventListener("click", () => {
        selectedPieDomain = "";
        highlightedPieDomain = "";
        selectedWeekDay = "";
        selectedCategory = selectedCategory === category && selectedHour === null ? "" : category;
        selectedHour = null;
        updatePieHighlight();
        updateWeekHighlight();
        updateCategoryHighlight();
      });

      swatch.className = "category-swatch";
      swatch.style.background = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
      label.textContent = CATEGORY_LABELS[category] || CATEGORY_LABELS.other;

      button.append(swatch, label);
      return button;
    })
  );
}

function updateCategoryHighlight() {
  const activeCategory = highlightedCategory || selectedCategory;
  const activeHour = highlightedHour ?? selectedHour;
  const hasHighlight = Boolean(activeCategory || activeHour !== null);

  hourChart.classList.toggle("has-highlight", hasHighlight);

  hourChart.querySelectorAll("[data-category]").forEach((segment) => {
    const categoryMatches = !activeCategory || segment.dataset.category === activeCategory;
    const hourMatches = activeHour === null || Number(segment.dataset.hour) === activeHour;
    const isHighlighted = hasHighlight && categoryMatches && hourMatches;
    segment.classList.toggle("is-highlighted", isHighlighted);
    segment.classList.toggle("is-muted", hasHighlight && !isHighlighted);
  });

  hourChart.querySelectorAll(".hour-column").forEach((column) => {
    const isSelectedHour = selectedHour !== null && Number(column.dataset.hour) === selectedHour;
    column.setAttribute("aria-pressed", String(isSelectedHour));
  });

  categoryLegend.querySelectorAll("[data-category]").forEach((button) => {
    const isSelected = selectedCategory === button.dataset.category && selectedHour === null;
    const isHighlighted = activeCategory === button.dataset.category;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("is-highlighted", isHighlighted);
  });

  updateHourlySelectionSummary();
  renderCategoryDetail();
}

function updateHourlySelectionSummary() {
  const activeCategory = selectedCategory || highlightedCategory;
  const activeHour = selectedHour ?? highlightedHour;

  if (activeCategory && activeHour !== null) {
    const seconds = currentHourlyCategories[activeHour]?.[activeCategory] || 0;
    const hourTotal = currentHourlyTotals[activeHour] || 0;
    usagePeak.textContent = `${formatHour(activeHour)} total: ${formatDuration(hourTotal)} · ${CATEGORY_LABELS[activeCategory]}: ${formatDuration(seconds)}`;
    return;
  }

  if (activeCategory) {
    const seconds = currentHourlyCategories.reduce((sum, bucket) => {
      return sum + (bucket[activeCategory] || 0);
    }, 0);
    usagePeak.textContent = `${CATEGORY_LABELS[activeCategory]} total: ${formatDuration(seconds)}`;
    return;
  }

  if (activeHour !== null) {
    usagePeak.textContent = `${formatHour(activeHour)} total: ${formatDuration(currentHourlyTotals[activeHour] || 0)}`;
    return;
  }

  const peakSeconds = Math.max(0, ...currentHourlyTotals);
  const peakHour = currentHourlyTotals.indexOf(peakSeconds);
  usagePeak.textContent = peakSeconds > 0
    ? `Peak ${formatHour(peakHour)}: ${formatDuration(peakSeconds)}`
    : "No usage yet";
}

function renderCategoryDetail() {
  if (!selectedCategory) {
    categoryDetail.hidden = true;
    categoryDetailChart.replaceChildren();
    categoryDetailSites.replaceChildren();
    return;
  }

  const categorySites = currentDaySites
    .filter((site) => site.category === selectedCategory)
    .sort((left, right) => right.screenSeconds - left.screenSeconds);
  const categoryHourly = currentHourlyCategories.map((bucket) => bucket[selectedCategory] || 0);
  const totalSeconds = categorySites.reduce((sum, site) => sum + site.screenSeconds, 0);
  const peakSeconds = Math.max(0, ...categoryHourly);
  const peakHour = categoryHourly.indexOf(peakSeconds);

  categoryDetail.hidden = false;
  categoryDetailTitle.textContent = `${CATEGORY_LABELS[selectedCategory]} details`;
  categoryDetailMeta.textContent = `${formatDuration(totalSeconds)} total${peakSeconds > 0 ? ` · peak ${formatHour(peakHour)}` : ""}`;

  renderCategoryDetailChart(categoryHourly);
  categoryDetailSites.replaceChildren(
    ...(categorySites.length > 0
      ? categorySites.map((site) => {
        const item = document.createElement("li");
        const domain = document.createElement("span");
        const duration = document.createElement("strong");

        domain.textContent = site.domain;
        duration.textContent = formatDuration(site.screenSeconds);
        item.append(domain, duration);
        return item;
      })
      : [createEmptyUsageRow("No websites in this category for this day.")])
  );
}

function renderCategoryDetailChart(hourly) {
  categoryDetailChart.replaceChildren(
    ...hourly.map((seconds, hour) => {
      const column = document.createElement("span");
      const bar = document.createElement("span");
      const label = document.createElement("span");

      column.className = "category-detail-column";
      column.title = `${formatHour(hour)}: ${formatDuration(seconds)}`;
      bar.style.height = `${Math.min(100, seconds / 3600 * 100)}%`;
      label.textContent = hour % 6 === 0 ? String(hour) : "";
      column.append(bar, label);
      return column;
    })
  );
}

function getActiveCategories(hourlyCategories) {
  const totals = {};

  hourlyCategories.forEach((bucket) => {
    Object.entries(bucket).forEach(([category, seconds]) => {
      totals[category] = (totals[category] || 0) + seconds;
    });
  });

  return Object.entries(totals)
    .filter(([, seconds]) => seconds > 0)
    .sort((left, right) => {
      if (left[0] === "other") {
        return 1;
      }

      if (right[0] === "other") {
        return -1;
      }

      return right[1] - left[1];
    })
    .map(([category]) => category);
}

function renderUsagePie(sites, totalSeconds, emptyMessage = "No website share yet.") {
  updateShareModeButtons();

  if (sites.length === 0 || totalSeconds <= 0) {
    selectedPieDomain = "";
    highlightedPieDomain = "";
    usagePie.replaceChildren();
    usagePie.classList.add("is-empty");
    usagePieTooltip.hidden = true;
    usagePieLegend.replaceChildren(createEmptyUsageRow(emptyMessage));
    return;
  }

  usagePie.classList.remove("is-empty");

  const segments = getPieSegments(sites, totalSeconds);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let cursor = -90;

  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Website usage share");

  segments.forEach((segment, index) => {
    const startAngle = cursor;
    const endAngle = index === segments.length - 1
      ? 270
      : cursor + segment.percent / 100 * 360;
    const slice = createPieSlice(segment, startAngle, endAngle);

    cursor = endAngle;
    svg.append(slice);
  });

  usagePie.replaceChildren(svg);
  usagePieLegend.replaceChildren(
    ...segments.map((segment) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const swatch = document.createElement("span");
      const label = document.createElement("span");
      const value = document.createElement("strong");

      item.className = "usage-pie-item";
      button.type = "button";
      button.className = "usage-pie-button";
      button.dataset.pieDomain = segment.domain;
      button.addEventListener("mouseenter", () => {
        highlightedPieDomain = segment.domain;
        updatePieHighlight();
      });
      button.addEventListener("mouseleave", () => {
        highlightedPieDomain = "";
        updatePieHighlight();
      });
      button.addEventListener("click", () => {
        selectedCategory = "";
        highlightedCategory = "";
        selectedHour = null;
        highlightedHour = null;
        selectedWeekDay = "";
        selectedPieDomain = selectedPieDomain === segment.domain ? "" : segment.domain;
        highlightedPieDomain = "";
        updateCategoryHighlight();
        updateWeekHighlight();
        updatePieHighlight();
      });
      swatch.className = "usage-pie-swatch";
      swatch.style.background = segment.color;
      label.className = "usage-pie-label";
      label.textContent = segment.domain;
      value.textContent = `${Math.round(segment.percent)}% · ${formatDuration(segment.seconds)}`;

      button.append(swatch, label, value);
      item.append(button);
      return item;
    })
  );
  updatePieHighlight();
}

function createPieSlice(segment, startAngle, endAngle) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  const fullCircle = endAngle - startAngle >= 359.9;

  path.dataset.pieDomain = segment.domain;
  path.dataset.pieLabel = `${segment.domain}: ${formatDuration(segment.seconds)}`;
  path.setAttribute("fill", segment.color);
  path.setAttribute("tabindex", "0");
  path.setAttribute("role", "button");
  path.setAttribute("aria-label", path.dataset.pieLabel);
  path.setAttribute("d", fullCircle ? describePieCircle() : describePieSlice(50, 50, 45, startAngle, endAngle));
  title.textContent = path.dataset.pieLabel;
  path.append(title);

  path.addEventListener("mouseenter", (event) => {
    highlightedPieDomain = segment.domain;
    showPieTooltip(segment.domain, formatDuration(segment.seconds));
    movePieTooltip(event);
    updatePieHighlight();
  });
  path.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  path.addEventListener("mousemove", (event) => {
    movePieTooltip(event);
  });
  path.addEventListener("mouseleave", () => {
    highlightedPieDomain = "";
    usagePieTooltip.hidden = true;
    updatePieHighlight();
  });
  path.addEventListener("click", () => {
    selectedCategory = "";
    highlightedCategory = "";
    selectedHour = null;
    highlightedHour = null;
    selectedWeekDay = "";
    selectedPieDomain = selectedPieDomain === segment.domain ? "" : segment.domain;
    highlightedPieDomain = "";
    usagePieTooltip.hidden = true;
    updateCategoryHighlight();
    updateWeekHighlight();
    updatePieHighlight();
  });
  path.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      path.dispatchEvent(new MouseEvent("click"));
    }
  });

  return path;
}

function updatePieHighlight() {
  const activeDomain = highlightedPieDomain || selectedPieDomain;
  const hasHighlight = Boolean(activeDomain);

  usagePie.classList.toggle("has-highlight", hasHighlight);
  usagePie.querySelectorAll("[data-pie-domain]").forEach((slice) => {
    const isActive = slice.dataset.pieDomain === activeDomain;
    slice.classList.toggle("is-highlighted", isActive);
    slice.classList.toggle("is-muted", hasHighlight && !isActive);
  });

  usagePieLegend.querySelectorAll("[data-pie-domain]").forEach((button) => {
    const isActive = button.dataset.pieDomain === activeDomain;
    const isSelected = button.dataset.pieDomain === selectedPieDomain;
    button.classList.toggle("is-highlighted", isActive);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  usageSites.querySelectorAll("[data-site-domain]").forEach((row) => {
    const isActive = row.dataset.siteDomain === activeDomain;
    const isSelected = row.dataset.siteDomain === selectedPieDomain;
    const detail = row.querySelector(".usage-site-detail");

    row.classList.toggle("is-highlighted", isActive);
    row.classList.toggle("is-selected", isSelected);
    row.setAttribute("aria-expanded", String(isSelected));

    if (detail) {
      detail.hidden = !isSelected;
    }
  });
}

function showPieTooltip(domain, duration) {
  usagePieTooltip.textContent = `${domain} · ${duration}`;
  usagePieTooltip.hidden = false;
}

function movePieTooltip(event) {
  const rect = usagePie.parentElement.getBoundingClientRect();
  usagePieTooltip.style.left = `${event.clientX - rect.left}px`;
  usagePieTooltip.style.top = `${event.clientY - rect.top}px`;
}

function describePieCircle() {
  return [
    "M 50 50",
    "m -45 0",
    "a 45 45 0 1 0 90 0",
    "a 45 45 0 1 0 -90 0"
  ].join(" ");
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = angleInDegrees * Math.PI / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function getPieSegments(sites, totalSeconds) {
  const visibleSites = shareMode === "all"
    ? sites
    : sites.slice(0, COMPACT_SITE_LIMIT);
  const otherSeconds = shareMode === "all"
    ? 0
    : sites.slice(COMPACT_SITE_LIMIT).reduce((sum, site) => sum + site.screenSeconds, 0);
  const segments = otherSeconds > 0
    ? [...visibleSites, { domain: OTHER_WEBSITES_LABEL, screenSeconds: otherSeconds }]
    : visibleSites;

  return segments.map((site, index) => ({
    domain: site.domain,
    seconds: site.screenSeconds,
    percent: site.screenSeconds / totalSeconds * 100,
    color: PIE_COLORS[index % PIE_COLORS.length]
  }));
}

function updateShareModeButtons() {
  shareCompact?.setAttribute("aria-pressed", String(shareMode === "compact"));
  shareAll?.setAttribute("aria-pressed", String(shareMode === "all"));
}

function clearUsageSelections({ keepWeek = false } = {}) {
  selectedPieDomain = "";
  highlightedPieDomain = "";
  selectedCategory = "";
  highlightedCategory = "";
  selectedHour = null;
  highlightedHour = null;
  if (!keepWeek) {
    selectedWeekDay = "";
  }
  usagePieTooltip.hidden = true;
  updatePieHighlight();
  updateCategoryHighlight();
  updateWeekHighlight();
}

function categorizeDomain(domain) {
  const value = String(domain || "").toLowerCase();
  const match = CATEGORY_MATCHERS.find((category) => {
    return category.patterns.some((pattern) => value.includes(pattern));
  });

  return match?.id || "other";
}

function renderUsageSites(sites, totalSeconds, emptyMessage = "No website usage recorded for this day.") {
  if (sites.length === 0) {
    usageSites.replaceChildren(createEmptyUsageRow(emptyMessage));
    usageShowMore.hidden = true;
    return;
  }

  const visibleSites = websitesExpanded ? sites : sites.slice(0, WEBSITE_LIST_LIMIT);
  usageShowMore.hidden = sites.length <= WEBSITE_LIST_LIMIT;
  usageShowMore.textContent = websitesExpanded ? "Show less" : `Show all ${sites.length}`;

  usageSites.replaceChildren(
    ...visibleSites.map((site) => {
      const item = document.createElement("li");
      const top = document.createElement("div");
      const domain = document.createElement("span");
      const duration = document.createElement("strong");
      const progress = document.createElement("span");
      const fill = document.createElement("span");
      const detail = createUsageSiteTimeline(site);
      const percent = totalSeconds > 0 ? site.screenSeconds / totalSeconds * 100 : 0;

      item.className = "usage-site-row";
      item.dataset.siteDomain = site.domain;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-expanded", String(selectedPieDomain === site.domain));
      item.setAttribute("aria-label", `${site.domain}: ${formatDuration(site.screenSeconds)}`);
      item.addEventListener("mouseenter", () => {
        highlightedPieDomain = site.domain;
        updatePieHighlight();
      });
      item.addEventListener("mouseleave", () => {
        highlightedPieDomain = "";
        updatePieHighlight();
      });
      item.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest(".usage-site-detail")) {
          return;
        }

        selectedCategory = "";
        highlightedCategory = "";
        selectedHour = null;
        highlightedHour = null;
        selectedWeekDay = "";
        selectedPieDomain = selectedPieDomain === site.domain ? "" : site.domain;
        highlightedPieDomain = "";
        updateCategoryHighlight();
        updateWeekHighlight();
        updatePieHighlight();
      });
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.click();
        }
      });
      top.className = "usage-site-main";
      domain.className = "usage-domain";
      domain.textContent = site.domain;
      duration.className = "usage-duration";
      duration.textContent = formatDuration(site.screenSeconds);
      progress.className = "usage-progress";
      fill.style.width = `${Math.max(2, percent)}%`;

      top.append(domain, duration);
      progress.append(fill);
      detail.hidden = selectedPieDomain !== site.domain;
      item.append(top, progress, detail);
      return item;
    })
  );

  updatePieHighlight();
}

function createUsageSiteTimeline(site) {
  const detail = document.createElement("section");
  const heading = document.createElement("div");
  const title = document.createElement("span");
  const meta = document.createElement("strong");
  const bars = document.createElement("div");
  const hourly = normalizeHourlySeconds(site.hourlySeconds);
  const maxSeconds = Math.max(1, ...hourly);
  const peakSeconds = Math.max(0, ...hourly);
  const peakHour = hourly.indexOf(peakSeconds);

  detail.className = "usage-site-detail";
  heading.className = "usage-site-detail-heading";
  title.textContent = "Usage by hour";
  meta.textContent = peakSeconds > 0
    ? `Peak ${formatHour(peakHour)}`
    : "No hourly activity";
  bars.className = "usage-site-hours";
  bars.setAttribute("aria-label", `${site.domain} hourly usage`);

  hourly.forEach((seconds, hour) => {
    const column = document.createElement("span");
    const bar = document.createElement("span");
    const label = document.createElement("span");
    const height = seconds > 0 ? Math.max(6, seconds / maxSeconds * 100) : 0;

    column.className = "usage-site-hour";
    column.title = `${formatHour(hour)}: ${formatDuration(seconds)}`;
    bar.style.height = `${height}%`;
    label.textContent = hour % 6 === 0 ? String(hour) : "";
    column.append(bar, label);
    bars.append(column);
  });

  heading.append(title, meta);
  detail.append(heading, bars);
  return detail;
}

function createEmptyUsageRow(message) {
  const item = document.createElement("li");
  item.className = "empty-row";
  item.textContent = message;
  return item;
}

function normalizeUsageSnapshot(snapshot) {
  const sites = {};

  if (snapshot?.sites && typeof snapshot.sites === "object") {
    Object.entries(snapshot.sites).forEach(([domain, entry]) => {
      const normalizedDomain = normalizeDomain(domain);

      if (normalizedDomain) {
        sites[normalizedDomain] = {
          screenSeconds: Math.max(0, Number(entry?.screenSeconds) || 0),
          hourlySeconds: normalizeHourlySeconds(entry?.hourlySeconds)
        };
      }
    });
  }

  return {
    date: typeof snapshot?.date === "string" ? snapshot.date : "",
    sites
  };
}

function normalizeHourlySeconds(value) {
  return Array.from({ length: 24 }, (_unused, index) => {
    return Math.max(0, Number(Array.isArray(value) ? value[index] : 0) || 0);
  });
}

function formatDuration(value) {
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

function formatDayLabel(day) {
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

function parseDayKey(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dateToDayKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getDayTotalSeconds(day) {
  const snapshot = normalizeUsageSnapshot(usageData.usageByDay?.[day]);

  return Object.values(snapshot.sites)
    .reduce((sum, entry) => sum + Math.max(0, Number(entry.screenSeconds) || 0), 0);
}

function getWeekDayKeys(day) {
  const date = parseDayKey(day) || new Date();
  const start = getWeekStartDate(date);

  return Array.from({ length: 7 }, (_unused, index) => {
    return dateToDayKey(addDays(start, index));
  });
}

function getPreviousWeekDayKeys(day) {
  const date = parseDayKey(day) || new Date();
  return getWeekDayKeys(dateToDayKey(addDays(getWeekStartDate(date), -7)));
}

function getSelectedDayForVisibleWeek(weekDay, { keepExistingSelection = true } = {}) {
  const weekDays = getWeekDayKeys(weekDay);
  const todayKey = dateToDayKey(new Date());

  if (keepExistingSelection && selectedUsageDay && weekDays.includes(selectedUsageDay)) {
    return selectedUsageDay;
  }

  return weekDays.includes(todayKey) ? todayKey : null;
}

function getWeekStartDate(date) {
  const start = new Date(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekAverageSeconds(entries, selectedDay, { fullWeek = false } = {}) {
  const todayKey = dateToDayKey(new Date());
  const selectedWeekDays = getWeekDayKeys(selectedDay);
  const isCurrentWeek = selectedWeekDays.includes(todayKey);
  const eligibleEntries = fullWeek || !isCurrentWeek
    ? entries
    : entries.filter((entry) => entry.day <= todayKey);
  const total = eligibleEntries.reduce((sum, entry) => sum + entry.seconds, 0);

  return total / Math.max(1, eligibleEntries.length);
}

function formatWeekTrend(currentAverage, previousAverage, selectedDay) {
  const todayKey = dateToDayKey(new Date());
  const comparisonLabel = getWeekDayKeys(selectedDay).includes(todayKey)
    ? "last week"
    : "the previous week";

  if (previousAverage <= 0 && currentAverage <= 0) {
    return `Same as ${comparisonLabel}`;
  }

  if (previousAverage <= 0) {
    return `No data for ${comparisonLabel}`;
  }

  const percent = (currentAverage - previousAverage) / previousAverage * 100;

  if (Math.abs(percent) < 1) {
    return `Same as ${comparisonLabel}`;
  }

  return `You averaged ${Math.round(Math.abs(percent))}% ${percent > 0 ? "more" : "less"} than ${comparisonLabel}`;
}

function formatShortWeekday(day) {
  const date = parseDayKey(day);

  if (!date) {
    return "";
  }

  return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
}

function formatWeekRange(days) {
  const first = days[0];
  const last = days[days.length - 1];
  const startDate = parseDayKey(first);
  const endDate = parseDayKey(last);

  if (!startDate || !endDate) {
    return "";
  }

  const includeYear = startDate.getFullYear() !== endDate.getFullYear();
  const options = includeYear
    ? { month: "short", day: "numeric", year: "numeric" }
    : { month: "short", day: "numeric" };

  return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function appendInterval(listElement, interval, { expanded = false, onChange = queueEditorAutosave } = {}) {
  if (!listElement) {
    return;
  }

  const row = document.createElement("section");
  const header = document.createElement("div");
  const toggle = document.createElement("button");
  const summaryText = document.createElement("span");
  const summaryDays = document.createElement("span");
  const remove = document.createElement("button");
  const editor = document.createElement("div");
  const timeGrid = document.createElement("div");
  const startField = createClockControl("Start", "start", interval.start || DEFAULT_INTERVAL.start, { onChange });
  const endField = createClockControl("End", "end", interval.end || DEFAULT_INTERVAL.end, { onChange });
  const dayGroup = document.createElement("div");
  const selectedDays = normalizeDays(interval.days);

  row.className = "interval-row";
  row.dataset.expanded = String(expanded);
  header.className = "slot-header";
  editor.className = "slot-editor";
  timeGrid.className = "time-grid";
  toggle.type = "button";
  toggle.className = "slot-summary";
  toggle.dataset.toggleSlot = "true";
  toggle.setAttribute("aria-expanded", String(expanded));
  summaryText.className = "slot-summary-text";
  summaryText.dataset.slotSummary = "true";
  summaryDays.className = "slot-summary-days";
  summaryDays.dataset.slotDays = "true";
  dayGroup.className = "day-grid";
  dayGroup.setAttribute("role", "group");
  dayGroup.setAttribute("aria-label", "Days");

  DAYS.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.dataset.day = day.id;
    button.setAttribute("aria-label", day.id);
    button.setAttribute("aria-pressed", String(selectedDays.has(day.id)));
    button.textContent = day.label;
    dayGroup.append(button);
  });

  remove.type = "button";
  remove.className = "remove-button";
  remove.dataset.removeInterval = "true";
  remove.textContent = "Remove";

  toggle.append(summaryText, summaryDays);
  header.append(toggle, remove);
  timeGrid.append(startField, endField);
  editor.append(timeGrid, dayGroup);
  row.append(header, editor);
  listElement.append(row);
  updateSlotSummary(row);
}

function createClockControl(labelText, field, value, { onChange = queueEditorAutosave } = {}) {
  const control = document.createElement("div");
  const header = document.createElement("div");
  const label = document.createElement("span");
  const display = document.createElement("input");
  const input = document.createElement("input");
  const face = document.createElement("div");
  const hand = document.createElement("span");
  const center = document.createElement("span");
  const periodToggle = document.createElement("div");

  control.className = "clock-control";
  control.dataset.clockControl = field;
  header.className = "clock-header";
  label.className = "clock-label";
  label.textContent = labelText;
  display.className = "clock-value";
  display.dataset.timeDisplay = "true";
  display.type = "text";
  display.inputMode = "numeric";
  display.maxLength = 5;
  display.setAttribute("aria-label", `${labelText} time as HH:MM`);

  input.type = "hidden";
  input.dataset.field = field;
  input.value = normalizeTime(value);

  face.className = "clock-face";
  face.dataset.clockFace = "true";
  face.setAttribute("role", "slider");
  face.setAttribute("tabindex", "0");
  face.setAttribute("aria-label", `${labelText} time`);
  face.setAttribute("aria-valuemin", "0");
  face.setAttribute("aria-valuemax", String(24 * 60 - 1));

  ["12", "3", "6", "9"].forEach((mark) => {
    const marker = document.createElement("span");
    marker.className = `clock-mark mark-${mark}`;
    marker.textContent = mark;
    face.append(marker);
  });

  hand.className = "clock-hand";
  hand.dataset.clockHand = "true";
  center.className = "clock-center";
  face.append(hand, center);

  periodToggle.className = "period-toggle";
  [
    { label: "00-11", value: "0" },
    { label: "12-23", value: "720" }
  ].forEach((period) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.period = period.value;
    button.textContent = period.label;
    periodToggle.append(button);
  });

  header.append(label, display);
  control.append(header, input, face, periodToggle);
  attachClockControl(control, { onChange });
  return control;
}

function attachClockControl(control, { onChange = queueEditorAutosave } = {}) {
  const face = control.querySelector("[data-clock-face]");
  const input = control.querySelector("[data-field]");
  const queueSave = typeof onChange === "function" ? onChange : queueEditorAutosave;

  setClockMinutes(control, timeToMinutes(input.value));

  face.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    face.setPointerCapture(event.pointerId);
    setClockFromPointer(control, event);
    queueSave();
  });

  face.addEventListener("pointermove", (event) => {
    if (face.hasPointerCapture(event.pointerId)) {
      setClockFromPointer(control, event);
      queueSave();
    }
  });

  face.addEventListener("keydown", (event) => {
    const step = getKeyboardStep(event);

    if (step === 0) {
      return;
    }

    event.preventDefault();
    setClockMinutes(control, getClockMinutes(control) + step);
    queueSave();
  });

  control.querySelectorAll("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = getClockMinutes(control);
      const period = Number(button.dataset.period || "0");
      setClockMinutes(control, period + (current % 720));
      queueSave({ immediate: true });
    });
  });

  control.querySelector("[data-time-display]").addEventListener("change", () => {
    commitManualTime(control, queueSave);
  });

  control.querySelector("[data-time-display]").addEventListener("blur", () => {
    commitManualTime(control, queueSave);
  });

  control.querySelector("[data-time-display]").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitManualTime(control, queueSave);
      event.currentTarget.blur();
    }
  });
}

function setClockFromPointer(control, event) {
  const face = control.querySelector("[data-clock-face]");
  const rect = face.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  let angle = Math.atan2(y, x) * 180 / Math.PI + 90;

  if (angle < 0) {
    angle += 360;
  }

  const period = getClockMinutes(control) >= 720 ? 720 : 0;
  const minutesInHalf = Math.round((angle / 360) * 720 / 5) * 5 % 720;
  setClockMinutes(control, period + minutesInHalf);
}

function setClockMinutes(control, minutes) {
  const normalized = normalizeMinutes(minutes);
  const input = control.querySelector("[data-field]");
  const display = control.querySelector("[data-time-display]");
  const face = control.querySelector("[data-clock-face]");
  const rotation = normalized % 720 / 720 * 360;
  const time = minutesToTime(normalized);

  input.value = time;
  display.value = time;
  face.style.setProperty("--rotation", `${rotation}deg`);
  face.setAttribute("aria-valuenow", String(normalized));
  face.setAttribute("aria-valuetext", time);

  control.querySelectorAll("[data-period]").forEach((button) => {
    const period = Number(button.dataset.period || "0");
    button.setAttribute("aria-pressed", String(period === (normalized >= 720 ? 720 : 0)));
  });

  updateSlotSummary(control.closest(".interval-row"));
}

function commitManualTime(control, queueSave) {
  const display = control.querySelector("[data-time-display]");
  const input = control.querySelector("[data-field]");
  const time = parseManualTime(display.value);

  if (!time) {
    display.value = input.value;
    return;
  }

  setClockMinutes(control, timeToMinutes(time));
  if (typeof queueSave === "function") {
    queueSave();
  }
}

function parseManualTime(value) {
  const text = String(value || "").trim();
  let hours;
  let minutes;

  if (/^\d{1,2}$/.test(text)) {
    hours = Number(text);
    minutes = 0;
  } else if (/^\d{3,4}$/.test(text)) {
    hours = Number(text.slice(0, -2));
    minutes = Number(text.slice(-2));
  } else {
    const match = /^(\d{1,2})[:.](\d{1,2})$/.exec(text);

    if (!match) {
      return null;
    }

    hours = Number(match[1]);
    minutes = Number(match[2]);
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getClockMinutes(control) {
  return timeToMinutes(control.querySelector("[data-field]")?.value);
}

function getKeyboardStep(event) {
  if (event.key === "ArrowRight") {
    return 5;
  }

  if (event.key === "ArrowLeft") {
    return -5;
  }

  if (event.key === "ArrowUp") {
    return 60;
  }

  if (event.key === "ArrowDown") {
    return -60;
  }

  return 0;
}

function normalizeMinutes(minutes) {
  const rounded = Number.isFinite(Number(minutes)) ? Math.round(Number(minutes)) : 0;
  return (rounded % 1440 + 1440) % 1440;
}

function timeToMinutes(value) {
  const time = normalizeTime(value);
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const minutes = normalizeMinutes(value);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function readSiteForm() {
  const domain = normalizeDomain(siteDomain.value);
  const blockMode = getBlockMode();
  const intervals = readIntervalsForSave(blockMode);
  const grayscaleEnabled = Boolean(grayscaleSite?.checked);
  const grayscaleMode = getModeFromRadios(grayscaleModeRadios);
  const redLightEnabled = Boolean(redLightSite?.checked);
  const redLightMode = getModeFromRadios(redLightModeRadios);
  const grayscaleIntervals = readEffectIntervalsForSave(grayscaleIntervalList, {
    enabled: grayscaleEnabled,
    mode: grayscaleMode,
    fallback: editingIndex === null ? [] : schedule.sites[editingIndex]?.grayscaleIntervals || schedule.sites[editingIndex]?.effectIntervals,
    label: "grayscale"
  });
  const redLightIntervals = readEffectIntervalsForSave(redLightIntervalList, {
    enabled: redLightEnabled,
    mode: redLightMode,
    fallback: editingIndex === null ? [] : schedule.sites[editingIndex]?.redLightIntervals || schedule.sites[editingIndex]?.effectIntervals,
    label: "red light"
  });
  const dailyAllowanceMinutes = normalizeAllowanceMinutes(dailyAllowance.value);
  const enabled = Boolean(blockEnabled?.checked ?? (editingIndex === null ? true : isSiteEnabled(schedule.sites[editingIndex])));

  if (!domain) {
    throw new Error("Enter a website domain.");
  }

  if (!isValidWebsiteDomain(domain)) {
    throw new Error("Enter a valid website domain.");
  }

  const duplicate = schedule.sites.some((site, index) => {
    return index !== editingIndex && site.domain === domain;
  });

  if (duplicate) {
    throw new Error("That website is already in the schedule.");
  }

  if (enabled && blockMode === "slots" && intervals.length === 0) {
    throw new Error("Add at least one time slot.");
  }

  const exceptions = readExceptionsForSave(domain);

  return {
    domain,
    enabled,
    blockMode,
    exceptions,
    dailyAllowanceMinutes,
    allowExtraTime: Boolean(allowExtraTime?.checked),
    grayscale: grayscaleEnabled,
    grayscaleMode,
    grayscaleIntervals,
    redLight: redLightEnabled,
    redLightMode,
    redLightIntervals,
    requirePinForExtraTime: settings.hasPin ? Boolean(requirePinExtra?.checked) : false,
    effectIntervals: grayscaleIntervals,
    intervals: intervals.length > 0 ? intervals : [{ ...DEFAULT_INTERVAL }]
  };
}


function handleIntervalListClick(event, { onChange = queueEditorAutosave } = {}) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const removeButton = target.closest("[data-remove-interval]");
  if (removeButton) {
    removeButton.closest(".interval-row")?.remove();
    onChange({ immediate: true });
    return;
  }

  const toggleButton = target.closest("[data-toggle-slot]");
  if (toggleButton) {
    const row = toggleButton.closest(".interval-row");
    setSlotExpanded(row, row.dataset.expanded !== "true");
    return;
  }

  const dayButton = target.closest("[data-day]");
  if (dayButton) {
    const isPressed = dayButton.getAttribute("aria-pressed") === "true";
    dayButton.setAttribute("aria-pressed", String(!isPressed));
    updateSlotSummary(dayButton.closest(".interval-row"));
    onChange({ immediate: true });
  }
}

function readIntervalsForSave(blockMode) {
  if (blockMode !== "always") {
    return readIntervals();
  }

  try {
    return readIntervals();
  } catch (_error) {
    return getStoredIntervalsFallback();
  }
}

function readIntervals() {
  return readIntervalsFrom(intervalList);
}

function readIntervalsFrom(listElement) {
  if (!listElement) {
    return [];
  }

  return Array.from(listElement.querySelectorAll(".interval-row")).map((row) => {
    const start = row.querySelector('[data-field="start"]')?.value;
    const end = row.querySelector('[data-field="end"]')?.value;
    const days = Array.from(row.querySelectorAll("[data-day]"))
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => button.dataset.day);

    if (!isValidTime(start) || !isValidTime(end)) {
      throw new Error("Every slot needs a valid start and end time.");
    }

    if (days.length === 0) {
      throw new Error("Pick at least one day for every slot.");
    }

    const interval = { start, end };

    if (days.length < DAYS.length) {
      interval.days = days;
    }

    return interval;
  });
}

function getStoredIntervalsFallback() {
  const source = editingIndex === null
    ? []
    : Array.isArray(schedule.sites[editingIndex]?.intervals)
      ? schedule.sites[editingIndex].intervals
      : [];

  if (source.length === 0) {
    return [{ ...DEFAULT_INTERVAL }];
  }

  return source.map((interval) => {
    const normalized = normalizeInterval(interval);

    return {
      start: normalized.start,
      end: normalized.end,
      ...(normalized.days ? { days: [...normalized.days] } : {})
    };
  });
}

function setSlotExpanded(row, isExpanded) {
  if (!row) {
    return;
  }

  row.dataset.expanded = String(isExpanded);
  row.querySelector("[data-toggle-slot]")?.setAttribute("aria-expanded", String(isExpanded));
}

function updateSlotSummary(row) {
  if (!row) {
    return;
  }

  const start = row.querySelector('[data-field="start"]')?.value || DEFAULT_INTERVAL.start;
  const end = row.querySelector('[data-field="end"]')?.value || DEFAULT_INTERVAL.end;
  const days = Array.from(row.querySelectorAll("[data-day]"))
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.dataset.day);
  const summary = row.querySelector("[data-slot-summary]");
  const daySummary = row.querySelector("[data-slot-days]");

  if (summary) {
    summary.textContent = `${start} -> ${end}`;
  }

  if (daySummary) {
    daySummary.textContent = summarizeDays(days);
  }
}

function summarizeDays(days) {
  if (days.length === DAYS.length) {
    return "Every day";
  }

  if (sameDays(days, ["mon", "tue", "wed", "thu", "fri"])) {
    return "Weekdays";
  }

  if (sameDays(days, ["sat", "sun"])) {
    return "Weekend";
  }

  return DAYS
    .filter((day) => days.includes(day.id))
    .map((day) => day.id.toUpperCase())
    .join(", ");
}

function sameDays(days, expected) {
  return days.length === expected.length && expected.every((day) => days.includes(day));
}

function normalizeSchedule(value) {
  const sites = Array.isArray(value?.sites) ? value.sites : [];

  return {
    timezone: typeof value?.timezone === "string" && value.timezone.trim()
      ? value.timezone.trim()
      : "local",
    sites: sites
      .map((site) => {
        const domain = normalizeDomain(site.domain || site.domains?.[0] || "");

        return {
          domain,
          enabled: site.enabled !== false && site.disabled !== true,
          blockMode: normalizeBlockMode(site.blockMode, site.intervals),
          exceptions: normalizeExceptionList(site.exceptions ?? site.allowlist ?? site.allowList ?? site.allowedDomains, domain),
          dailyAllowanceMinutes: normalizeAllowanceMinutes(site.dailyAllowanceMinutes),
          allowExtraTime: Boolean(site.allowExtraTime),
          grayscale: Boolean(site.grayscale),
          grayscaleMode: normalizeEffectMode(site.grayscaleMode),
          grayscaleIntervals: Array.isArray(site.grayscaleIntervals)
            ? site.grayscaleIntervals.map(normalizeInterval)
            : Array.isArray(site.effectIntervals)
              ? site.effectIntervals.map(normalizeInterval)
              : [],
          redLight: Boolean(site.redLight),
          redLightMode: normalizeEffectMode(site.redLightMode),
          redLightIntervals: Array.isArray(site.redLightIntervals)
            ? site.redLightIntervals.map(normalizeInterval)
            : Array.isArray(site.effectIntervals)
              ? site.effectIntervals.map(normalizeInterval)
              : [],
          effectIntervals: Array.isArray(site.effectIntervals) ? site.effectIntervals.map(normalizeInterval) : [],
          requirePinForExtraTime: Boolean(site.requirePinForExtraTime),
          intervals: Array.isArray(site.intervals) ? site.intervals.map(normalizeInterval) : []
        };
      })
      .filter((site) => site.domain)
  };
}

function normalizeSettings(value) {
  return {
    hasPin: Boolean(value?.hasPin),
    blockAllForAll: Boolean(value?.blockAllForAll),
    requirePinForAllExtraTime: Boolean(value?.requirePinForAllExtraTime),
    allowExtraTimeForAll: Boolean(value?.allowExtraTimeForAll),
    grayscaleForAll: Boolean(value?.grayscaleForAll),
    grayscaleApplyToAllWebsites: Boolean(value?.grayscaleApplyToAllWebsites),
    grayscaleForAllMode: normalizeEffectMode(value?.grayscaleForAllMode),
    grayscaleIntervalsForAll: Array.isArray(value?.grayscaleIntervalsForAll)
      ? value.grayscaleIntervalsForAll.map(normalizeInterval)
      : Array.isArray(value?.effectIntervalsForAll)
        ? value.effectIntervalsForAll.map(normalizeInterval)
        : [],
    redLightForAll: Boolean(value?.redLightForAll),
    redLightApplyToAllWebsites: Boolean(value?.redLightApplyToAllWebsites),
    redLightForAllMode: normalizeEffectMode(value?.redLightForAllMode),
    redLightIntervalsForAll: Array.isArray(value?.redLightIntervalsForAll)
      ? value.redLightIntervalsForAll.map(normalizeInterval)
      : Array.isArray(value?.effectIntervalsForAll)
        ? value.effectIntervalsForAll.map(normalizeInterval)
        : [],
    effectIntervalsForAll: Array.isArray(value?.effectIntervalsForAll) ? value.effectIntervalsForAll.map(normalizeInterval) : [],
    pinValue: sanitizePinValue(value?.pinValue)
  };
}

function applyStoredGlobalSettings(storedSettings) {
  const stored = storedSettings?.[SETTINGS_KEY];

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "blockAllForAll")) {
    settings.blockAllForAll = Boolean(stored.blockAllForAll);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "allowExtraTimeForAll")) {
    settings.allowExtraTimeForAll = Boolean(stored.allowExtraTimeForAll);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "grayscaleForAll")) {
    settings.grayscaleForAll = Boolean(stored.grayscaleForAll);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "grayscaleApplyToAllWebsites")) {
    settings.grayscaleApplyToAllWebsites = Boolean(stored.grayscaleApplyToAllWebsites);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "grayscaleForAllMode")) {
    settings.grayscaleForAllMode = normalizeEffectMode(stored.grayscaleForAllMode);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "grayscaleIntervalsForAll")) {
    settings.grayscaleIntervalsForAll = Array.isArray(stored.grayscaleIntervalsForAll)
      ? stored.grayscaleIntervalsForAll.map(normalizeInterval)
      : [];
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "redLightForAll")) {
    settings.redLightForAll = Boolean(stored.redLightForAll);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "redLightApplyToAllWebsites")) {
    settings.redLightApplyToAllWebsites = Boolean(stored.redLightApplyToAllWebsites);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "redLightForAllMode")) {
    settings.redLightForAllMode = normalizeEffectMode(stored.redLightForAllMode);
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "redLightIntervalsForAll")) {
    settings.redLightIntervalsForAll = Array.isArray(stored.redLightIntervalsForAll)
      ? stored.redLightIntervalsForAll.map(normalizeInterval)
      : [];
  }

  if (stored && typeof stored === "object" && Object.prototype.hasOwnProperty.call(stored, "effectIntervalsForAll")) {
    settings.effectIntervalsForAll = Array.isArray(stored.effectIntervalsForAll)
      ? stored.effectIntervalsForAll.map(normalizeInterval)
      : [];
  }

  if (blockAll) {
    blockAll.checked = Boolean(settings.blockAllForAll);
  }

  if (globalExtraTime) {
    globalExtraTime.checked = Boolean(settings.allowExtraTimeForAll);
  }

  if (globalGrayscale) {
    globalGrayscale.checked = Boolean(settings.grayscaleForAll);
  }

  if (globalGrayscaleAllWebsites) {
    globalGrayscaleAllWebsites.checked = Boolean(settings.grayscaleApplyToAllWebsites);
  }

  setModeRadios(globalGrayscaleModeRadios, settings.grayscaleForAllMode);

  if (globalRedLight) {
    globalRedLight.checked = Boolean(settings.redLightForAll);
  }

  if (globalRedLightAllWebsites) {
    globalRedLightAllWebsites.checked = Boolean(settings.redLightApplyToAllWebsites);
  }

  setModeRadios(globalRedLightModeRadios, settings.redLightForAllMode);

  syncGlobalVisualEffectMenus();
}

function normalizePomodoro(value = {}) {
  const until = normalizeTimestamp(value?.until);
  const active = Boolean(value?.active) && until > Date.now();

  return {
    active,
    until: active ? until : 0,
    mode: value?.mode === "strict" ? "strict" : "standard",
    whitelist: parsePomodoroWhitelist(Array.isArray(value?.whitelist) ? value.whitelist.join(", ") : value?.whitelist)
  };
}

function parsePomodoroWhitelist(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || "").split(/[\s,]+/);

  return Array.from(new Set(items.map((item) => normalizeDomain(item)).filter(Boolean)));
}

function normalizeTimestamp(value) {
  const timestamp = Number(value);

  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function sanitizePinValue(value) {
  return String(value || "").replace(/\D+/g, "").slice(0, 4);
}

function setPinVisibility(input, button, isVisible) {
  if (!input || !button) {
    return;
  }

  input.type = isVisible ? "text" : "password";
  button.setAttribute("aria-pressed", String(isVisible));
  button.setAttribute("aria-label", `${isVisible ? "Hide" : "Show"} PIN`);
  button.innerHTML = isVisible ? getEyeOffIcon() : getEyeIcon();
}

function getEyeIcon() {
  return [
    '<svg viewBox="0 0 24 24" aria-hidden="true">',
    '<path d="M1.5 12s3.9-6.5 10.5-6.5S22.5 12 22.5 12s-3.9 6.5-10.5 6.5S1.5 12 1.5 12Z"/>',
    '<circle cx="12" cy="12" r="3.25"/>',
    "</svg>"
  ].join("");
}

function getEyeOffIcon() {
  return [
    '<svg viewBox="0 0 24 24" aria-hidden="true">',
    '<path d="M3 4.5 21 19.5"/>',
    '<path d="M10.6 5.7a12 12 0 0 1 1.4-.2C18.6 5.5 22.5 12 22.5 12a18.5 18.5 0 0 1-4.1 4.8"/>',
    '<path d="M6.2 8.2A18.1 18.1 0 0 0 1.5 12s3.9 6.5 10.5 6.5c1 0 1.9-.1 2.8-.4"/>',
    '<path d="M9.4 9.4A3.7 3.7 0 0 0 12 15.8"/>',
    "</svg>"
  ].join("");
}

function normalizeInterval(interval) {
  return {
    start: normalizeTime(interval?.start || DEFAULT_INTERVAL.start),
    end: normalizeTime(interval?.end || DEFAULT_INTERVAL.end),
    ...(interval?.days ? { days: Array.from(normalizeDays(interval.days)) } : {})
  };
}

function normalizeDomain(value) {
  const text = String(value || "").trim().toLowerCase();

  if (!text) {
    return "";
  }

  try {
    const url = new URL(text.includes("://") ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "");
  } catch (_error) {
    return text
      .replace(/^\*:\/\/\*\./, "")
      .replace(/^\*:\/\/\*/, "")
      .replace(/^\*\./, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

function normalizeExceptionForSite(value, siteDomain) {
  const exception = normalizeDomain(value);
  const domain = normalizeDomain(siteDomain);

  if (!exception) {
    throw new Error("Enter an exception domain.");
  }

  if (!domain) {
    throw new Error("Enter the blocked website before adding exceptions.");
  }

  if (!isValidWebsiteDomain(exception)) {
    throw new Error("Enter a valid exception domain.");
  }

  if (exception === domain || !domainMatches(exception, domain)) {
    throw new Error("Exceptions must be subdomains of the blocked website.");
  }

  return exception;
}

function normalizeExceptionList(value, siteDomain) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,]+/)
      : [];
  const normalized = [];

  values.forEach((item) => {
    try {
      const exception = normalizeExceptionForSite(item, siteDomain);

      if (!normalized.includes(exception)) {
        normalized.push(exception);
      }
    } catch (_error) {
    }
  });

  return normalized;
}

function domainMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function normalizeTime(value) {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(String(value || ""));

  if (!match) {
    return DEFAULT_INTERVAL.start;
  }

  const hours = Number(match[1]);

  if (hours < 0 || hours > 23) {
    return DEFAULT_INTERVAL.start;
  }

  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function normalizeDays(days) {
  if (!days) {
    return new Set(DAYS.map((day) => day.id));
  }

  const values = Array.isArray(days) ? days : String(days).split(/[\s,]+/);
  const normalized = new Set(values.map((day) => String(day).toLowerCase()));
  const selected = DAYS.filter((day) => normalized.has(day.id)).map((day) => day.id);

  return new Set(selected.length > 0 ? selected : DAYS.map((day) => day.id));
}

function normalizeAllowanceMinutes(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  return Math.min(Math.round(minutes), 24 * 60);
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidWebsiteDomain(domain) {
  return domain === "localhost" || /^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/i.test(domain);
}

function normalizeBlockMode(mode, intervals = []) {
  if (mode === "always" || mode === "slots") {
    return mode;
  }

  return isLegacyAllDayIntervals(intervals) ? "always" : "slots";
}

function cloneSite(site) {
  return {
    domain: site.domain,
    enabled: isSiteEnabled(site),
    blockMode: normalizeBlockMode(site.blockMode, site.intervals),
    exceptions: normalizeExceptionList(site.exceptions, site.domain),
    dailyAllowanceMinutes: normalizeAllowanceMinutes(site.dailyAllowanceMinutes),
    allowExtraTime: Boolean(site.allowExtraTime),
    grayscale: Boolean(site.grayscale),
    grayscaleMode: normalizeEffectMode(site.grayscaleMode),
    grayscaleIntervals: cloneIntervals(site.grayscaleIntervals || site.effectIntervals),
    redLight: Boolean(site.redLight),
    redLightMode: normalizeEffectMode(site.redLightMode),
    redLightIntervals: cloneIntervals(site.redLightIntervals || site.effectIntervals),
    effectIntervals: cloneIntervals(site.effectIntervals),
    requirePinForExtraTime: Boolean(site.requirePinForExtraTime),
    intervals: Array.isArray(site.intervals)
      ? site.intervals.map((interval) => ({
        ...interval,
        ...(Array.isArray(interval.days) ? { days: [...interval.days] } : {})
      }))
      : []
  };
}

function siteSummary(site, usage = null) {
  const blockAllEnforced = Boolean(settings.blockAllForAll);

  if (!isSiteEnabled(site) && !blockAllEnforced) {
    return "blocking paused";
  }

  const count = site.intervals.length;
  const slotText = blockAllEnforced || normalizeBlockMode(site.blockMode, site.intervals) === "always"
    ? "always"
    : `during ${count} slot${count === 1 ? "" : "s"}`;
  const parts = [`blocked ${slotText}`];

  if (site.dailyAllowanceMinutes > 0) {
    parts.push(`${site.dailyAllowanceMinutes} min/day`);
  }

  if (settings.allowExtraTimeForAll || site.allowExtraTime) {
    parts.push("extra time allowed");
  }

  if (settings.grayscaleForAll || site.grayscale) {
    parts.push("grayscale");
  }

  if (settings.redLightForAll || site.redLight) {
    parts.push("red light");
  }

  if (settings.hasPin && (site.requirePinForExtraTime || settings.requirePinForAllExtraTime)) {
    parts.push("PIN required for extra time");
  }

  if (site.exceptions?.length > 0) {
    parts.push(`${site.exceptions.length} exception${site.exceptions.length === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}

function isBlockedNow(site) {
  if (!isSiteEnabled(site) && !settings.blockAllForAll) {
    return false;
  }

  const blockedSites = Array.isArray(state?.activeSites) ? state.activeSites : [];
  return blockedSites.some((blockedSite) => blockedSite.domains.includes(site.domain));
}

function isSiteEnabled(site) {
  return site?.enabled !== false;
}

function getUsageState(domain) {
  return (state?.siteUsage || []).find((site) => site.domain === domain) || null;
}

function findSiteIndex(domains) {
  return schedule.sites.findIndex((site) => domains.includes(site.domain));
}

function renderError(message) {
  summary.textContent = message;
  summary.classList.add("error");
  activeSites.replaceChildren();
  updated.textContent = "";
}

function setFormError(message) {
  formError.textContent = message;
}

function clearFormError() {
  formError.textContent = "";
}

function setExceptionWarning(message) {
  if (!exceptionWarning) {
    return;
  }

  exceptionWarning.textContent = message;
  exceptionWarning.hidden = false;
}

function clearExceptionWarning() {
  if (!exceptionWarning) {
    return;
  }

  exceptionWarning.textContent = "";
  exceptionWarning.hidden = true;
}

function cleanError(error) {
  const message = error && typeof error === "object" && "message" in error
    ? error.message
    : error;

  return String(message || "Something went wrong.").replace(/^Error:\s*/, "");
}
