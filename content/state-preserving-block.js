(() => {
  if (window.__focusTrackerStatePreservingBlockInstalled) {
    return;
  }

  window.__focusTrackerStatePreservingBlockInstalled = true;

  const OVERLAY_ID = "focus-tracker-state-preserving-block";
  const ROOT_ID = "focus-tracker-state-preserving-root";
  const MINUTE_OPTIONS = [5, 15, 30];
  const BRAND_ICON_URL = chrome.runtime.getURL("assets/icons/icon48.png");
  const STYLE_TEXT = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #f8fafc;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    .overlay {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        linear-gradient(135deg, rgba(96, 165, 250, 0.1), transparent 42%),
        linear-gradient(315deg, rgba(222, 84, 113, 0.08), transparent 40%),
        rgba(17, 24, 39, 0.76);
      backdrop-filter: blur(5px);
      pointer-events: auto;
    }

    .card {
      width: min(460px, calc(100vw - 28px));
      border: 1px solid rgba(245, 247, 245, 0.14);
      border-radius: 8px;
      background: rgba(29, 33, 29, 0.92);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
      padding: clamp(20px, 4vw, 28px);
      text-align: center;
    }

    .brand-header {
      display: inline-grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 10px;
      margin: 0 auto 16px;
      text-align: left;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      display: block;
    }

    .brand-name {
      margin: 0;
      color: #f8fafc;
      font-size: 1.06rem;
      font-weight: 950;
      letter-spacing: -0.03em;
      line-height: 1.05;
    }

    .eyebrow {
      margin: 0 0 12px;
      color: #f18eaa;
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1 {
      max-width: 9ch;
      margin: 0 auto;
      color: #f8fafc;
      font-size: clamp(1.8rem, 5.8vw, 2.5rem);
      font-weight: 950;
      line-height: 1.06;
      letter-spacing: -0.04em;
    }

    .message {
      max-width: 24rem;
      margin: 14px auto 0;
      color: #cbd5e1;
      font-size: 0.96rem;
      font-weight: 500;
      line-height: 1.5;
    }

    .extra-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }

    .extra-actions button {
      min-height: 44px;
      border: 1px solid rgba(245, 247, 245, 0.14);
      border-radius: 6px;
      background: #1f2937;
      color: #dbeafe;
      cursor: pointer;
      font: inherit;
      font-size: 1rem;
      font-weight: 800;
      line-height: 1;
      padding: 0 14px;
    }

    .extra-actions button:hover:not(:disabled) {
      background: #273449;
    }

    .panel-button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 6px;
      font: inherit;
      font-weight: 800;
      padding: 0 18px;
      cursor: pointer;
    }

    .panel-button.primary {
      background: #2563eb;
      color: #ffffff;
    }

    .panel-button.primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .panel-button.secondary {
      border-color: rgba(245, 247, 245, 0.14);
      background: #1f2937;
      color: #dbeafe;
    }

    .panel-button.secondary:hover:not(:disabled) {
      background: #273449;
    }

    .popup-view-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 14px;
    }

    .pin-field {
      display: block;
      margin: 18px 0 0;
      border: 0;
      padding: 0;
      text-align: left;
    }

    .pin-label {
      display: block;
      margin: 0 0 8px;
      color: #cbd5e1;
      font-size: 0.84rem;
      font-weight: 800;
      line-height: 1.35;
      text-align: center;
    }

    .pin-input {
      width: 100%;
      min-width: 0;
      min-height: 42px;
      border: 1px solid rgba(245, 247, 245, 0.14);
      border-radius: 6px;
      background: #1f2937;
      color: #dbeafe;
      font: inherit;
      font-weight: 900;
      letter-spacing: 0.12em;
      padding: 0 10px;
      text-align: center;
    }

    .pin-input:focus {
      outline: 3px solid rgba(37, 99, 235, 0.32);
      outline-offset: 3px;
    }

    .error {
      min-height: 18px;
      margin: 12px 0 0;
      color: #f18eaa;
      font-size: 0.82rem;
      font-weight: 800;
      line-height: 1.35;
      text-align: center;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.58;
    }

    button:focus-visible {
      outline: 3px solid rgba(37, 99, 235, 0.32);
      outline-offset: 3px;
    }

    @media (max-width: 520px) {
      .extra-actions,
      .popup-view-actions {
        grid-template-columns: 1fr;
      }
    }
  `;

  let overlayHost = null;
  let shadowRoot = null;
  let currentStatus = null;
  let pendingMinutes = 0;
  let actionInFlight = false;
  let pinError = "";
  let pausedMedia = [];
  let mediaGuardTimer = 0;

  document.addEventListener("play", handleMediaPlayWhileBlocked, true);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "focus-tracker-ping-state-blocker") {
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "focus-tracker-show-state-blocker") {
      showOverlay(message.status)
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: cleanError(error) }));
      return true;
    }

    if (message?.type === "focus-tracker-hide-state-blocker") {
      hideOverlay(false);
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  async function showOverlay(status = null) {
    currentStatus = status?.found ? status : await loadStatus();
    pendingMinutes = 0;
    actionInFlight = false;
    pinError = "";

    pauseMedia();
    startMediaGuard();
    ensureOverlay();
    renderSelectView();
  }

  async function loadStatus() {
    const response = await chrome.runtime.sendMessage({
      type: "get-site-status",
      domain: getCurrentDomain()
    });

    if (!response?.ok || !response.status?.found) {
      throw new Error(response?.error || "This website is blocked.");
    }

    return response.status;
  }

  function ensureOverlay() {
    overlayHost = document.getElementById(OVERLAY_ID);

    if (!overlayHost) {
      overlayHost = document.createElement("div");
      overlayHost.id = OVERLAY_ID;
      shadowRoot = overlayHost.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = STYLE_TEXT;

      const root = document.createElement("div");
      root.id = ROOT_ID;

      shadowRoot.append(style, root);
      document.documentElement.append(overlayHost);
    } else {
      shadowRoot = overlayHost.shadowRoot;
    }
  }

  function renderSelectView() {
    const root = getRoot();
    const allowExtraTime = Boolean(currentStatus?.allowExtraTime);

    root.innerHTML = `
      <section class="overlay" role="dialog" aria-modal="true" aria-labelledby="focus-tracker-block-title">
        <div class="card">
          <header class="brand-header" aria-label="Focus Tracker">
            <img class="brand-icon" src="${BRAND_ICON_URL}" alt="" aria-hidden="true">
            <p class="brand-name">Focus Tracker</p>
          </header>

          <h1 id="focus-tracker-block-title">This website is blocked</h1>
          <p class="message">${allowExtraTime
            ? "Your time is up for this website. Add more time to continue where you left off."
            : "Your time is up for this website."}</p>

          ${allowExtraTime ? `<div class="extra-actions">${MINUTE_OPTIONS.map((minutes) => (
            `<button type="button" data-minutes="${minutes}" ${actionInFlight ? "disabled" : ""}>${minutes} min</button>`
          )).join("")}</div>` : ""}

          ${pinError ? `<p class="error">${escapeHtml(pinError)}</p>` : ""}
        </div>
      </section>
    `;

    root.querySelectorAll("[data-minutes]").forEach((button) => {
      button.addEventListener("click", () => {
        const minutes = Number(button.getAttribute("data-minutes"));
        void handleMinuteSelection(minutes);
      });
    });
  }

  function renderPinView() {
    const root = getRoot();
    const minutes = Math.max(0, Number(pendingMinutes) || 0);

    root.innerHTML = `
      <section class="overlay" role="dialog" aria-modal="true" aria-labelledby="focus-tracker-pin-title">
        <div class="card">
          <header class="brand-header" aria-label="Focus Tracker">
            <img class="brand-icon" src="${BRAND_ICON_URL}" alt="" aria-hidden="true">
            <p class="brand-name">Focus Tracker</p>
          </header>

          <p class="eyebrow">PIN required</p>
          <h1 id="focus-tracker-pin-title">Enter your PIN</h1>
          <p class="message">Add ${minutes} minute${minutes === 1 ? "" : "s"}.</p>

          <label class="pin-field">
            <span class="pin-label">PIN</span>
            <input id="focus-tracker-pin-input" class="pin-input" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="0000" ${actionInFlight ? "disabled" : ""}>
          </label>

          ${pinError ? `<p class="error">${escapeHtml(pinError)}</p>` : ""}

          <div class="popup-view-actions">
            <button class="panel-button primary" id="focus-tracker-submit-pin" type="button" ${actionInFlight ? "disabled" : ""}>Add time</button>
            <button class="panel-button secondary" id="focus-tracker-back" type="button" ${actionInFlight ? "disabled" : ""}>Back</button>
          </div>
        </div>
      </section>
    `;

    const input = root.querySelector("#focus-tracker-pin-input");
    const submit = root.querySelector("#focus-tracker-submit-pin");
    const back = root.querySelector("#focus-tracker-back");

    if (input instanceof HTMLInputElement) {
      input.focus();
      input.addEventListener("input", () => {
        input.value = sanitizePin(input.value);
        pinError = "";
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit?.click();
        }
      });
    }

    submit?.addEventListener("click", () => {
      const pin = input instanceof HTMLInputElement ? sanitizePin(input.value) : "";
      void grantExtraTime(pendingMinutes, pin);
    });

    back?.addEventListener("click", () => {
      pendingMinutes = 0;
      pinError = "";
      renderSelectView();
    });
  }

  async function handleMinuteSelection(minutes) {
    pendingMinutes = Math.max(0, Number(minutes) || 0);

    if (pendingMinutes <= 0 || actionInFlight) {
      return;
    }

    if (currentStatus?.requiresPinForExtraTime) {
      pinError = "";
      renderPinView();
      return;
    }

    await grantExtraTime(pendingMinutes, "");
  }

  async function grantExtraTime(minutes, pin) {
    if (actionInFlight) {
      return;
    }

    const sanitizedPin = sanitizePin(pin);

    if (currentStatus?.requiresPinForExtraTime && sanitizedPin.length !== 4) {
      pinError = "Enter the 4-digit PIN.";
      renderPinView();
      return;
    }

    actionInFlight = true;
    pinError = "";

    if (currentStatus?.requiresPinForExtraTime) {
      renderPinView();
    } else {
      renderSelectView();
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: "add-extra-time",
        domain: getCurrentDomain(),
        minutes,
        pin: sanitizedPin,
        targetUrl: window.location.href
      });

      if (!response?.ok) {
        throw new Error(response?.error || "Could not add extra time.");
      }

      if (response.status?.isBlocked) {
        throw new Error("This website is still blocked. Try adding time again.");
      }

      hideOverlay(true);
    } catch (error) {
      actionInFlight = false;
      pinError = cleanError(error);

      if (currentStatus?.requiresPinForExtraTime) {
        renderPinView();
      } else {
        renderSelectView();
      }
    }
  }

  function hideOverlay(resumeMediaAfterHide = false) {
    if (overlayHost?.isConnected) {
      overlayHost.remove();
    }

    overlayHost = null;
    shadowRoot = null;
    currentStatus = null;
    actionInFlight = false;
    pendingMinutes = 0;
    pinError = "";

    stopMediaGuard();

    if (resumeMediaAfterHide) {
      resumeMedia();
    } else {
      pausedMedia = [];
    }
  }

  function pauseMedia() {
    pausedMedia = [];

    document.querySelectorAll("video, audio").forEach((media) => {
      const wasPlaying = !media.paused && !media.ended;
      const previousMuted = Boolean(media.muted);
      const previousVolume = Number.isFinite(media.volume) ? media.volume : 1;

      if (wasPlaying) {
        pausedMedia.push({
          media,
          previousMuted,
          previousVolume
        });
      }

      try {
        media.muted = true;
      } catch (_error) {
      }

      try {
        media.volume = 0;
      } catch (_error) {
      }

      try {
        media.pause();
      } catch (_error) {
      }
    });
  }

  function resumeMedia() {
    const mediaToResume = pausedMedia;
    pausedMedia = [];

    mediaToResume.forEach(({ media, previousMuted, previousVolume }) => {
      if (!document.contains(media)) {
        return;
      }

      try {
        media.muted = previousMuted;
      } catch (_error) {
      }

      try {
        media.volume = previousVolume;
      } catch (_error) {
      }

      try {
        const playPromise = media.play?.();

        if (playPromise?.catch) {
          playPromise.catch(() => {});
        }
      } catch (_error) {
      }
    });
  }

  function startMediaGuard() {
    stopMediaGuard();
    enforceMediaSilence();
    mediaGuardTimer = window.setInterval(enforceMediaSilence, 500);
  }

  function stopMediaGuard() {
    if (mediaGuardTimer) {
      window.clearInterval(mediaGuardTimer);
      mediaGuardTimer = 0;
    }
  }

  function enforceMediaSilence() {
    if (!overlayHost) {
      return;
    }

    document.querySelectorAll("video, audio").forEach((media) => {
      try {
        media.muted = true;
      } catch (_error) {
      }

      try {
        media.volume = 0;
      } catch (_error) {
      }

      try {
        media.pause();
      } catch (_error) {
      }
    });
  }

  function handleMediaPlayWhileBlocked(event) {
    if (!overlayHost) {
      return;
    }

    const media = event.target;

    if (!(media instanceof HTMLMediaElement)) {
      return;
    }

    try {
      media.muted = true;
    } catch (_error) {
    }

    try {
      media.volume = 0;
    } catch (_error) {
    }

    try {
      media.pause();
    } catch (_error) {
    }
  }

  function getRoot() {
    ensureOverlay();
    return shadowRoot.getElementById(ROOT_ID);
  }

  function getCurrentDomain() {
    return window.location.hostname.replace(/^www\./, "").toLowerCase();
  }

  function sanitizePin(value) {
    return String(value || "").replace(/\D+/g, "").slice(0, 4);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cleanError(error) {
    return String(error?.message || error || "Something went wrong.").replace(/^Error:\s*/, "");
  }
})();
