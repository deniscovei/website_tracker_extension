/**
 * Apply global settings checkbox state without owning persistence.
 * @param {object} options
 */
export function syncGlobalSettingsControls({ pinGlobal, globalExtraTime, settings, disabled }) {
  if (pinGlobal) {
    pinGlobal.checked = Boolean(settings.hasPin && settings.requirePinForAllExtraTime);
    pinGlobal.disabled = Boolean(!settings.hasPin || disabled);
  }

  if (globalExtraTime) {
    globalExtraTime.checked = Boolean(settings.allowExtraTimeForAll);
    globalExtraTime.disabled = Boolean(disabled);
  }
}
