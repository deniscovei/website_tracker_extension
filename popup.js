const DAYS = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
  { id: "sun", label: "S" }
];

const DEFAULT_INTERVAL = {
  start: "09:00",
  end: "17:00"
};

const summary = document.getElementById("summary");
const activeSites = document.getElementById("active-sites");
const updated = document.getElementById("updated");
const statusPanel = document.querySelector(".status");
const refresh = document.getElementById("refresh");
const back = document.getElementById("back");
const scheduleTab = document.getElementById("schedule-tab");
const usageTab = document.getElementById("usage-tab");
const listView = document.getElementById("list-view");
const editorView = document.getElementById("editor-view");
const usageView = document.getElementById("usage-view");
const siteList = document.getElementById("site-list");
const newSite = document.getElementById("new-site");
const siteForm = document.getElementById("site-form");
const siteDomain = document.getElementById("site-domain");
const blockModeRadios = Array.from(document.querySelectorAll('input[name="block-mode"]'));
const dailyAllowance = document.getElementById("daily-allowance");
const allowExtraTime = document.getElementById("allow-extra-time");
const slotHeading = document.getElementById("slot-heading");
const intervalList = document.getElementById("interval-list");
const addInterval = document.getElementById("add-interval");
const deleteSite = document.getElementById("delete-site");
const formError = document.getElementById("form-error");
const usageDay = document.getElementById("usage-day");
const usageTotal = document.getElementById("usage-total");
const weekTrend = document.getElementById("week-trend");
const weekSelectedLabel = document.getElementById("week-selected-label");
const weekSelectedTotal = document.getElementById("week-selected-total");
const weekAverageTotal = document.getElementById("week-average-total");
const weekChart = document.getElementById("week-chart");
const usagePeak = document.getElementById("usage-peak");
const usageCount = document.getElementById("usage-count");
const hourChart = document.getElementById("hour-chart");
const categoryLegend = document.getElementById("category-legend");
const usagePie = document.getElementById("usage-pie");
const usagePieTooltip = document.getElementById("usage-pie-tooltip");
const usagePieLegend = document.getElementById("usage-pie-legend");
const shareCompact = document.getElementById("share-compact");
const shareAll = document.getElementById("share-all");
const usageSites = document.getElementById("usage-sites");
const usageShowMore = document.getElementById("usage-show-more");

const ALL_DAY_INTERVAL = {
  start: "00:00",
  end: "00:00"
};

const COMPACT_SITE_LIMIT = 8;
const WEBSITE_LIST_LIMIT = 8;
const OTHER_WEBSITES_LABEL = "Other websites";

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

scheduleTab?.addEventListener("click", () => {
  showScheduleView();
});

usageTab?.addEventListener("click", () => {
  void showUsageView();
});

usageDay?.addEventListener("change", () => {
  renderUsageForDay(usageDay.value);
});

blockModeRadios.forEach((radio) => {
  radio.addEventListener("change", syncBlockingModeView);
});

shareCompact?.addEventListener("click", () => {
  shareMode = "compact";
  renderUsageForDay(usageDay.value);
});

shareAll?.addEventListener("click", () => {
  shareMode = "all";
  renderUsageForDay(usageDay.value);
});

usageShowMore?.addEventListener("click", () => {
  websitesExpanded = !websitesExpanded;
  renderUsageForDay(usageDay.value);
});

document.addEventListener("click", (event) => {
  if (usageView.hidden || !(event.target instanceof HTMLElement)) {
    return;
  }

  if (event.target.closest("[data-pie-domain], [data-site-domain], [data-category], [data-hour], .week-day, #usage-day, .mini-toggle")) {
    return;
  }

  clearUsageSelections();
});

refresh?.addEventListener("click", async () => {
  refresh.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({ type: "refresh-rules" });

    if (!response?.ok) {
      throw new Error(response?.error || "Refresh failed.");
    }

    state = response.state;
    renderStatus();
    renderSiteList();
  } catch (error) {
    renderError(cleanError(error));
  } finally {
    refresh.disabled = false;
  }
});

newSite?.addEventListener("click", () => {
  editingIndex = null;
  openEditor({
    domain: "",
    dailyAllowanceMinutes: 0,
    allowExtraTime: false,
    intervals: [{ ...DEFAULT_INTERVAL }]
  });
});

back?.addEventListener("click", showList);

addInterval?.addEventListener("click", () => {
  appendInterval({ ...DEFAULT_INTERVAL }, { expanded: true });
});

deleteSite?.addEventListener("click", async () => {
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
  clearFormError();

  try {
    const site = readSiteForm();

    if (editingIndex === null) {
      schedule.sites.push(site);
    } else {
      schedule.sites[editingIndex] = site;
    }

    await persistSchedule();
    showList();
  } catch (error) {
    setFormError(cleanError(error));
  }
});

intervalList?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const removeButton = target.closest("[data-remove-interval]");
  if (removeButton) {
    removeButton.closest(".interval-row")?.remove();
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
  }
});

void loadData();

async function loadData() {
  const response = await chrome.runtime.sendMessage({ type: "get-schedule-data" });

  if (!response?.ok) {
    renderError(response?.error || "Could not load schedule.");
    return;
  }

  schedule = normalizeSchedule(response.schedule);
  state = response.state;
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
  renderStatus();
  renderSiteList();
}

function renderStatus() {
  activeSites.replaceChildren();

  if (!state) {
    summary.textContent = "No schedule status yet.";
    updated.textContent = "";
    return;
  }

  if (state.error) {
    summary.textContent = "Schedule error. Blocking rules were cleared.";
    updated.textContent = state.error;
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
      const item = document.createElement("li");
      const button = document.createElement("button");
      const title = document.createElement("span");
      const meta = document.createElement("span");

      button.type = "button";
      button.className = "site-row";
      button.addEventListener("click", () => {
        editingIndex = index;
        openEditor(site);
      });

      title.className = "site-domain";
      title.textContent = site.domain;

      meta.className = "site-meta";
      meta.textContent = siteSummary(site, getUsageState(site.domain));

      button.append(title, meta);

      if (isBlockedNow(site)) {
        const badge = document.createElement("span");
        badge.className = "active-badge";
        badge.textContent = "Blocked";
        button.append(badge);
      }

      item.append(button);
      return item;
    })
  );
}

function openEditor(site) {
  clearFormError();
  scheduleTab?.setAttribute("aria-pressed", "true");
  usageTab?.setAttribute("aria-pressed", "false");
  siteDomain.value = site.domain || "";
  dailyAllowance.value = String(site.dailyAllowanceMinutes || 0);
  allowExtraTime.checked = Boolean(site.allowExtraTime);
  intervalList.replaceChildren();

  const isAlwaysBlocked = isAllDaySite(site);
  const intervals = !isAlwaysBlocked && Array.isArray(site.intervals) && site.intervals.length > 0
    ? site.intervals
    : [{ ...DEFAULT_INTERVAL }];

  setBlockMode(isAlwaysBlocked ? "always" : "slots");

  if (!isAlwaysBlocked) {
    intervals.forEach((interval) => {
      appendInterval(interval, { expanded: editingIndex === null });
    });
  }

  syncBlockingModeView();

  listView.hidden = true;
  editorView.hidden = false;
  usageView.hidden = true;
  statusPanel.hidden = false;
  back.hidden = false;
  deleteSite.hidden = editingIndex === null;
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

function syncBlockingModeView() {
  const isAlwaysBlocked = getBlockMode() === "always";
  blockModeRadios.forEach((radio) => {
    radio.closest(".mode-option")?.classList.toggle("is-selected", radio.checked);
  });
  slotHeading.hidden = isAlwaysBlocked;
  intervalList.hidden = isAlwaysBlocked;
  addInterval.disabled = isAlwaysBlocked;

  if (!isAlwaysBlocked && intervalList.children.length === 0) {
    appendInterval({ ...DEFAULT_INTERVAL }, { expanded: true });
  }
}

function isAllDaySite(site) {
  const intervals = Array.isArray(site?.intervals) ? site.intervals : [];

  return intervals.length === 1 && isAllDayInterval(intervals[0]);
}

function isAllDayInterval(interval) {
  const normalized = normalizeInterval(interval);
  return normalized.start === ALL_DAY_INTERVAL.start &&
    normalized.end === ALL_DAY_INTERVAL.end &&
    (!normalized.days || normalized.days.length === DAYS.length);
}

function showList() {
  scheduleTab?.setAttribute("aria-pressed", "true");
  usageTab?.setAttribute("aria-pressed", "false");
  editorView.hidden = true;
  listView.hidden = false;
  usageView.hidden = true;
  statusPanel.hidden = false;
  back.hidden = true;
  editingIndex = null;
}

function showScheduleView() {
  showList();
}

async function showUsageView() {
  editingIndex = null;
  clearFormError();
  scheduleTab?.setAttribute("aria-pressed", "false");
  usageTab?.setAttribute("aria-pressed", "true");
  statusPanel.hidden = true;
  listView.hidden = true;
  editorView.hidden = true;
  usageView.hidden = false;
  back.hidden = true;
  await loadUsageData();
}

async function loadUsageData() {
  const response = await chrome.runtime.sendMessage({ type: "get-usage-data" });

  if (!response?.ok) {
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
    return;
  }

  usageData = {
    days: Array.isArray(response.days) ? response.days : [],
    usageByDay: response.usageByDay && typeof response.usageByDay === "object"
      ? response.usageByDay
      : {}
  };

  const selectedDay = usageDay.value || usageData.days[0] || dateToDayKey(new Date());
  renderUsageDays(selectedDay);
  renderUsageForDay(selectedDay);
}

function renderUsageDays(selectedDay = usageDay.value || dateToDayKey(new Date())) {
  const optionDays = new Set(usageData.days);
  getWeekDayKeys(selectedDay).forEach((day) => optionDays.add(day));
  optionDays.add(selectedDay);

  usageDay.replaceChildren(
    ...Array.from(optionDays).sort().reverse().map((day) => {
      const option = document.createElement("option");
      option.value = day;
      option.textContent = formatDayLabel(day);
      return option;
    })
  );

  usageDay.value = selectedDay;
}

function renderUsageForDay(day) {
  const selectedDay = day || dateToDayKey(new Date());
  renderUsageDays(selectedDay);
  renderWeekOverview(selectedDay);

  const snapshot = normalizeUsageSnapshot(usageData.usageByDay?.[selectedDay]);
  const hourly = Array.from({ length: 24 }, () => 0);
  const hourlyCategories = Array.from({ length: 24 }, () => ({}));
  const sites = Object.entries(snapshot.sites)
    .map(([domain, entry]) => {
      const screenSeconds = Math.max(0, Number(entry.screenSeconds) || 0);
      const hourlySeconds = normalizeHourlySeconds(entry.hourlySeconds);
      const category = categorizeDomain(domain);

      hourlySeconds.forEach((seconds, index) => {
        hourly[index] += seconds;
        hourlyCategories[index][category] = (hourlyCategories[index][category] || 0) + seconds;
      });

      return { domain, screenSeconds, category };
    })
    .filter((site) => site.screenSeconds > 0)
    .sort((left, right) => right.screenSeconds - left.screenSeconds);
  const totalSeconds = sites.reduce((sum, site) => sum + site.screenSeconds, 0);
  const peakSeconds = Math.max(0, ...hourly);
  const peakHour = hourly.indexOf(peakSeconds);

  const compactDomains = new Set(sites.slice(0, COMPACT_SITE_LIMIT).map((site) => site.domain));
  const hasOtherWebsites = sites.length > COMPACT_SITE_LIMIT;
  const selectedPieDomainIsVisible = shareMode === "all"
    ? sites.some((site) => site.domain === selectedPieDomain)
    : compactDomains.has(selectedPieDomain) || (selectedPieDomain === OTHER_WEBSITES_LABEL && hasOtherWebsites);

  if (selectedPieDomain && !selectedPieDomainIsVisible) {
    selectedPieDomain = "";
    highlightedPieDomain = "";
  }

  usageTotal.textContent = formatDuration(totalSeconds);
  usageCount.textContent = `${sites.length} site${sites.length === 1 ? "" : "s"}`;
  usagePeak.textContent = peakSeconds > 0
    ? `Peak ${formatHour(peakHour)}: ${formatDuration(peakSeconds)}`
    : "No usage yet";

  renderHourChart(hourly, hourlyCategories);
  renderUsagePie(sites, totalSeconds);
  renderUsageSites(sites, totalSeconds);
  updatePieHighlight();
}

function renderWeekOverview(selectedDay) {
  const weekDays = getWeekDayKeys(selectedDay);
  const previousWeekDays = getPreviousWeekDayKeys(selectedDay);
  const weekEntries = weekDays.map((day) => ({
    day,
    seconds: getDayTotalSeconds(day)
  }));
  const previousEntries = previousWeekDays.map((day) => ({
    day,
    seconds: getDayTotalSeconds(day)
  }));
  const selectedEntry = weekEntries.find((entry) => entry.day === selectedDay) || weekEntries[0];
  const currentAverage = getWeekAverageSeconds(weekEntries, selectedDay);
  const previousAverage = getWeekAverageSeconds(previousEntries, previousWeekDays[0], { fullWeek: true });

  weekSelectedLabel.textContent = formatDayLabel(selectedDay);
  weekSelectedTotal.textContent = formatDuration(selectedEntry?.seconds || 0);
  weekAverageTotal.textContent = formatDuration(currentAverage);
  weekTrend.textContent = formatWeekTrend(currentAverage, previousAverage, selectedDay);
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
      button.setAttribute("aria-pressed", String(entry.day === selectedDay));
      button.setAttribute("aria-label", `${formatDayLabel(entry.day)}: ${formatDuration(entry.seconds)}`);
      button.addEventListener("click", () => {
        renderUsageForDay(entry.day);
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
        selectedHour = selectedHour === hour ? null : hour;
        selectedCategory = "";
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
          selectedCategory = selectedCategory === category && selectedHour === hour ? "" : category;
          selectedHour = selectedCategory ? hour : null;
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
        selectedCategory = selectedCategory === category && selectedHour === null ? "" : category;
        selectedHour = null;
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

function renderUsagePie(sites, totalSeconds) {
  updateShareModeButtons();

  if (sites.length === 0 || totalSeconds <= 0) {
    selectedPieDomain = "";
    highlightedPieDomain = "";
    usagePie.replaceChildren();
    usagePie.classList.add("is-empty");
    usagePieTooltip.hidden = true;
    usagePieLegend.replaceChildren(createEmptyUsageRow("No website share yet."));
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
        selectedPieDomain = selectedPieDomain === segment.domain ? "" : segment.domain;
        highlightedPieDomain = "";
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
  path.addEventListener("mousemove", (event) => {
    movePieTooltip(event);
  });
  path.addEventListener("mouseleave", () => {
    highlightedPieDomain = "";
    usagePieTooltip.hidden = true;
    updatePieHighlight();
  });
  path.addEventListener("click", () => {
    selectedPieDomain = selectedPieDomain === segment.domain ? "" : segment.domain;
    highlightedPieDomain = "";
    usagePieTooltip.hidden = true;
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
    row.classList.toggle("is-highlighted", row.dataset.siteDomain === activeDomain);
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

function clearUsageSelections() {
  selectedPieDomain = "";
  highlightedPieDomain = "";
  selectedCategory = "";
  highlightedCategory = "";
  selectedHour = null;
  highlightedHour = null;
  usagePieTooltip.hidden = true;
  updatePieHighlight();
  updateCategoryHighlight();
}

function categorizeDomain(domain) {
  const value = String(domain || "").toLowerCase();
  const match = CATEGORY_MATCHERS.find((category) => {
    return category.patterns.some((pattern) => value.includes(pattern));
  });

  return match?.id || "other";
}

function renderUsageSites(sites, totalSeconds) {
  if (sites.length === 0) {
    usageSites.replaceChildren(createEmptyUsageRow("No website usage recorded for this day."));
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
      const percent = totalSeconds > 0 ? site.screenSeconds / totalSeconds * 100 : 0;

      item.className = "usage-site-row";
      item.dataset.siteDomain = site.domain;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `${site.domain}: ${formatDuration(site.screenSeconds)}`);
      item.addEventListener("mouseenter", () => {
        highlightedPieDomain = site.domain;
        updatePieHighlight();
      });
      item.addEventListener("mouseleave", () => {
        highlightedPieDomain = "";
        updatePieHighlight();
      });
      item.addEventListener("click", () => {
        selectedPieDomain = selectedPieDomain === site.domain ? "" : site.domain;
        highlightedPieDomain = "";
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
      item.append(top, progress);
      return item;
    })
  );
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

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function appendInterval(interval, { expanded = false } = {}) {
  const row = document.createElement("section");
  const header = document.createElement("div");
  const toggle = document.createElement("button");
  const summaryText = document.createElement("span");
  const summaryDays = document.createElement("span");
  const remove = document.createElement("button");
  const editor = document.createElement("div");
  const timeGrid = document.createElement("div");
  const startField = createClockControl("Start", "start", interval.start || DEFAULT_INTERVAL.start);
  const endField = createClockControl("End", "end", interval.end || DEFAULT_INTERVAL.end);
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
  intervalList.append(row);
  updateSlotSummary(row);
}

function createClockControl(labelText, field, value) {
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
  attachClockControl(control);
  return control;
}

function attachClockControl(control) {
  const face = control.querySelector("[data-clock-face]");
  const input = control.querySelector("[data-field]");

  setClockMinutes(control, timeToMinutes(input.value));

  face.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    face.setPointerCapture(event.pointerId);
    setClockFromPointer(control, event);
  });

  face.addEventListener("pointermove", (event) => {
    if (face.hasPointerCapture(event.pointerId)) {
      setClockFromPointer(control, event);
    }
  });

  face.addEventListener("keydown", (event) => {
    const step = getKeyboardStep(event);

    if (step === 0) {
      return;
    }

    event.preventDefault();
    setClockMinutes(control, getClockMinutes(control) + step);
  });

  control.querySelectorAll("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = getClockMinutes(control);
      const period = Number(button.dataset.period || "0");
      setClockMinutes(control, period + (current % 720));
    });
  });

  control.querySelector("[data-time-display]").addEventListener("change", () => {
    commitManualTime(control);
  });

  control.querySelector("[data-time-display]").addEventListener("blur", () => {
    commitManualTime(control);
  });

  control.querySelector("[data-time-display]").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitManualTime(control);
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

function commitManualTime(control) {
  const display = control.querySelector("[data-time-display]");
  const input = control.querySelector("[data-field]");
  const time = parseManualTime(display.value);

  if (!time) {
    display.value = input.value;
    return;
  }

  setClockMinutes(control, timeToMinutes(time));
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
  const intervals = getBlockMode() === "always"
    ? [{ ...ALL_DAY_INTERVAL }]
    : readIntervals();
  const dailyAllowanceMinutes = normalizeAllowanceMinutes(dailyAllowance.value);

  if (!domain) {
    throw new Error("Enter a website domain.");
  }

  const duplicate = schedule.sites.some((site, index) => {
    return index !== editingIndex && site.domain === domain;
  });

  if (duplicate) {
    throw new Error("That website is already in the schedule.");
  }

  if (intervals.length === 0) {
    throw new Error("Add at least one time slot.");
  }

  return {
    domain,
    dailyAllowanceMinutes,
    allowExtraTime: allowExtraTime.checked,
    intervals
  };
}

function readIntervals() {
  return Array.from(intervalList.querySelectorAll(".interval-row")).map((row) => {
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
      .map((site) => ({
        domain: normalizeDomain(site.domain || site.domains?.[0] || ""),
        dailyAllowanceMinutes: normalizeAllowanceMinutes(site.dailyAllowanceMinutes),
        allowExtraTime: Boolean(site.allowExtraTime),
        intervals: Array.isArray(site.intervals) ? site.intervals.map(normalizeInterval) : []
      }))
      .filter((site) => site.domain)
  };
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

function siteSummary(site, usage = null) {
  const count = site.intervals.length;
  const slotText = isAllDaySite(site)
    ? "always"
    : `during ${count} slot${count === 1 ? "" : "s"}`;
  const parts = [`blocked ${slotText}`];

  if (site.dailyAllowanceMinutes > 0) {
    parts.push(`${site.dailyAllowanceMinutes} min/day`);
  }

  if ((site.dailyAllowanceMinutes > 0 || usage?.extraSeconds > 0) && usage) {
    parts.push(`${Math.ceil(usage.remainingSeconds / 60)} min left`);
  }

  if (site.allowExtraTime) {
    parts.push("extra time on");
  }

  return parts.join(" · ");
}

function isBlockedNow(site) {
  const blockedSites = Array.isArray(state?.activeSites) ? state.activeSites : [];
  return blockedSites.some((blockedSite) => blockedSite.domains.includes(site.domain));
}

function getUsageState(domain) {
  return (state?.siteUsage || []).find((site) => site.domain === domain) || null;
}

function findSiteIndex(domains) {
  return schedule.sites.findIndex((site) => domains.includes(site.domain));
}

function renderError(message) {
  summary.textContent = message;
  activeSites.replaceChildren();
  updated.textContent = "";
}

function setFormError(message) {
  formError.textContent = message;
}

function clearFormError() {
  formError.textContent = "";
}

function cleanError(error) {
  const message = error && typeof error === "object" && "message" in error
    ? error.message
    : error;

  return String(message || "Something went wrong.").replace(/^Error:\s*/, "");
}
