/**
 * Synchronize top-level popup tab pressed states.
 * @param {object} tabs
 * @param {"websites" | "usage" | "focus"} activeTab
 */
export function setActiveTab(tabs, activeTab) {
  tabs.scheduleTab?.setAttribute("aria-pressed", String(activeTab === "websites"));
  tabs.usageTab?.setAttribute("aria-pressed", String(activeTab === "usage"));
  tabs.focusTab?.setAttribute("aria-pressed", String(activeTab === "focus"));
}
