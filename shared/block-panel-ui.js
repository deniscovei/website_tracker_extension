(() => {
  const BRAND_ICON_PATH = "assets/icons/icon48.png";

  function getBrandIconUrl() {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(BRAND_ICON_PATH);
    }

    return "../../assets/icons/icon48.png";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderBrandHeader() {
    return `
      <header class="ft-block-brand" aria-label="Focus Tracker">
        <img class="ft-block-brand-icon" src="${getBrandIconUrl()}" alt="" aria-hidden="true">
        <p class="ft-block-brand-name">Focus Tracker</p>
      </header>
    `;
  }

  function renderShell({ title, message, body = "", actions = "", titleId = "focus-tracker-block-title" }) {
    return `
      <section class="ft-block-shell" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}">
        <div class="ft-block-card">
          ${renderBrandHeader()}
          <h1 id="${escapeHtml(titleId)}" class="ft-block-title">${escapeHtml(title)}</h1>
          ${message ? `<p class="ft-block-message">${escapeHtml(message)}</p>` : ""}
          ${body}
          ${actions}
        </div>
      </section>
    `;
  }

  function renderMinuteButtons({ minutes = [5, 15, 30], disabled = false } = {}) {
    return `
      <div class="ft-block-minute-actions">
        ${minutes.map((minute) => `
          <button class="ft-block-minute-button" type="button" data-minutes="${minute}" ${disabled ? "disabled" : ""}>
            ${minute} min
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderPinField({ inputId = "focus-tracker-pin-input", disabled = false, value = "" } = {}) {
    return `
      <label class="ft-block-pin-field">
        <span class="ft-block-pin-label">PIN</span>
        <input
          id="${escapeHtml(inputId)}"
          class="ft-block-pin-input"
          type="password"
          inputmode="numeric"
          autocomplete="off"
          maxlength="4"
          placeholder="0000"
          value="${escapeHtml(value)}"
          ${disabled ? "disabled" : ""}
        >
      </label>
    `;
  }

  function renderActionButtons({ primaryText, secondaryText = "Back", disabled = false } = {}) {
    return `
      <div class="ft-block-panel-actions">
        <button class="ft-block-panel-button ft-block-panel-button-primary" type="button" data-primary-action ${disabled ? "disabled" : ""}>
          ${escapeHtml(primaryText)}
        </button>
        <button class="ft-block-panel-button ft-block-panel-button-secondary" type="button" data-secondary-action ${disabled ? "disabled" : ""}>
          ${escapeHtml(secondaryText)}
        </button>
      </div>
    `;
  }

  function renderError(message) {
    return message ? `<p class="ft-block-error">${escapeHtml(message)}</p>` : "";
  }

  globalThis.FocusTrackerBlockPanel = {
    escapeHtml,
    getBrandIconUrl,
    renderShell,
    renderMinuteButtons,
    renderPinField,
    renderActionButtons,
    renderError
  };
})();
