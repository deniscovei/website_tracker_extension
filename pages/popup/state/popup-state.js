/**
 * Create a lightweight holder for popup-wide state. The existing popup still
 * owns most transitions, but new modules share this shape.
 * @returns {object}
 */
export function createPopupState() {
  return {
    selectedTab: "websites",
    editingIndex: null,
    pomodoroStatsVisible: false,
    selectedPomodoroStatsDay: ""
  };
}
