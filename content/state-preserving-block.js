(() => {
  if (window.__focusTrackerStatePreservingBlockInstalled) {
    return;
  }

  window.__focusTrackerStatePreservingBlockInstalled = true;

  const OVERLAY_ID = "focus-tracker-state-preserving-block";
  const ROOT_ID = "focus-tracker-state-preserving-root";
  const BLOCK_STATE_UPDATED_MESSAGE = "focus-tracker-block-state-updated";
  const MINUTE_OPTIONS = [5, 15, 30];
  const SCROLL_KEYS = new Set([
    " ",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp"
  ]);
  const KEYBOARD_EVENTS = ["keydown", "keypress", "keyup"];
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
  `;

  let overlayHost = null;
  let shadowRoot = null;
  let currentStatus = null;
  let pendingMinutes = 0;
  let actionInFlight = false;
  let pinError = "";
  let statusRefreshToken = 0;
  const mediaStates = new Map();
  let mediaGuardTimer = 0;
  let scrollLockActive = false;
  let overlayRemovalObserver = null;

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
      hideOverlay(true);
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === BLOCK_STATE_UPDATED_MESSAGE) {
      syncOverlayStatus()
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: cleanError(error) }));
      return true;
    }

    return false;
  });

  async function showOverlay(status = null) {
    const overlayAlreadyVisible = Boolean(overlayHost?.isConnected);

    currentStatus = status?.found ? status : await loadStatus();

    if (!overlayAlreadyVisible) {
      pendingMinutes = 0;
      actionInFlight = false;
      pinError = "";
    }

    if (overlayAlreadyVisible) {
      enforceMediaSilence();
    } else {
      pauseMedia();
    }

    startMediaGuard();
    lockPageScroll();
    ensureOverlay();

    if (overlayAlreadyVisible && currentStatus?.requiresPinForExtraTime && pendingMinutes > 0) {
      renderPinView();
    } else {
      renderSelectView();
    }
  }

  async function syncOverlayStatus() {
    if (!overlayHost?.isConnected) {
      return;
    }

    const refreshToken = ++statusRefreshToken;
    let nextStatus = null;

    try {
      nextStatus = await loadStatus();
    } catch (_error) {
      if (refreshToken === statusRefreshToken) {
        hideOverlay(true);
      }
      return;
    }

    if (refreshToken !== statusRefreshToken) {
      return;
    }

    if (!nextStatus?.isBlocked) {
      hideOverlay(true);
      return;
    }

    currentStatus = nextStatus;
    pinError = "";

    if (!currentStatus.allowExtraTime) {
      pendingMinutes = 0;
    }

    if (currentStatus.requiresPinForExtraTime && pendingMinutes > 0) {
      renderPinView();
      return;
    }

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

      const sharedStyles = document.createElement("link");
      sharedStyles.rel = "stylesheet";
      sharedStyles.href = chrome.runtime.getURL("shared/block-panel.css");

      const root = document.createElement("div");
      root.id = ROOT_ID;

      shadowRoot.append(style, sharedStyles, root);
      (document.body || document.documentElement).append(overlayHost);
      bindOverlayKeyboardGuards();
      startOverlayRemovalObserver();
    } else {
      shadowRoot = overlayHost.shadowRoot;
      bindOverlayKeyboardGuards();
      startOverlayRemovalObserver();
    }
  }

  function bindOverlayKeyboardGuards() {
    if (!shadowRoot || shadowRoot.__focusTrackerKeyboardGuardsBound) {
      return;
    }

    KEYBOARD_EVENTS.forEach((eventName) => {
      shadowRoot.addEventListener(eventName, stopOverlayKeyboardPropagation);
    });
    shadowRoot.__focusTrackerKeyboardGuardsBound = true;
  }

  function renderSelectView() {
    const root = getRoot();
    const allowExtraTime = Boolean(currentStatus?.allowExtraTime);
    const ui = globalThis.FocusTrackerBlockPanel;

    root.innerHTML = ui.renderShell({
      title: "This website is blocked",
      message: allowExtraTime
        ? "Your time is up for this website. Add more time to continue where you left off."
        : "Your time is up for this website.",
      actions: allowExtraTime
        ? ui.renderMinuteButtons({ minutes: MINUTE_OPTIONS, disabled: actionInFlight })
        : "",
      body: ui.renderError(pinError),
      titleId: "focus-tracker-block-title"
    });

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
    const minutesLabel = `${minutes} minute${minutes === 1 ? "" : "s"}`;
    const ui = globalThis.FocusTrackerBlockPanel;

    root.innerHTML = ui.renderShell({
      title: "This website is blocked",
      message: "Your time is up for this website. Add more time to continue where you left off.",
      body: `
        <p class="ft-block-confirm-message">Add ${ui.escapeHtml(minutesLabel)} and enter the page.</p>
        ${ui.renderPinField({
          inputId: "focus-tracker-pin-input",
          disabled: actionInFlight
        })}
        ${ui.renderError(pinError)}
      `,
      actions: ui.renderActionButtons({
        primaryText: "Enter Page",
        secondaryText: "Back",
        disabled: actionInFlight
      }),
      titleId: "focus-tracker-pin-title"
    });

    const input = root.querySelector("#focus-tracker-pin-input");
    const submit = root.querySelector("[data-primary-action]");
    const back = root.querySelector("[data-secondary-action]");

    if (input instanceof HTMLInputElement) {
      focusWithoutScrolling(input);
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
    stopOverlayRemovalObserver();

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
    unlockPageScroll();

    if (resumeMediaAfterHide) {
      resumeMedia();
    } else {
      mediaStates.clear();
    }
  }

  function isOverlayActive() {
    return Boolean(overlayHost?.isConnected);
  }

  function startOverlayRemovalObserver() {
    stopOverlayRemovalObserver();

    if (!overlayHost?.isConnected || typeof MutationObserver === "undefined") {
      return;
    }

    overlayRemovalObserver = new MutationObserver(() => {
      if (overlayHost && !overlayHost.isConnected) {
        hideOverlay(false);
      }
    });
    overlayRemovalObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function stopOverlayRemovalObserver() {
    if (overlayRemovalObserver) {
      overlayRemovalObserver.disconnect();
      overlayRemovalObserver = null;
    }
  }

  function pauseMedia() {
    mediaStates.clear();

    document.querySelectorAll("video, audio").forEach((media) => {
      pauseMediaElement(media, {
        resumeAfterHide: !media.paused && !media.ended
      });
    });
  }

  function rememberMediaState(media, resumeAfterHide = false) {
    if (!(media instanceof HTMLMediaElement)) {
      return null;
    }

    if (!mediaStates.has(media)) {
      mediaStates.set(media, {
        wasPlaying: Boolean(resumeAfterHide),
        currentTime: getMediaCurrentTime(media),
        source: getMediaSource(media)
      });
    }

    return mediaStates.get(media);
  }

  function pauseMediaElement(media, { resumeAfterHide = false } = {}) {
    if (!(media instanceof HTMLMediaElement)) {
      return;
    }

    rememberMediaState(media, resumeAfterHide);

    try {
      media.pause();
    } catch (_error) {
    }
  }

  function resumeMedia() {
    const mediaToRestore = Array.from(mediaStates.entries());
    mediaStates.clear();

    mediaToRestore.forEach(([media, state]) => {
      if (!media || !document.contains(media)) {
        return;
      }

      restoreMediaCurrentTime(media, state);

      if (!state.wasPlaying) {
        return;
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

  function getMediaCurrentTime(media) {
    const currentTime = Number(media.currentTime);
    return Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : null;
  }

  function getMediaSource(media) {
    return String(media.currentSrc || media.src || "");
  }

  function restoreMediaCurrentTime(media, state) {
    if (!Number.isFinite(state.currentTime) || state.currentTime < 0) {
      return;
    }

    if (state.source && getMediaSource(media) && state.source !== getMediaSource(media)) {
      return;
    }

    const currentTime = getMediaCurrentTime(media);

    if (currentTime === null || Math.abs(currentTime - state.currentTime) < 0.25) {
      return;
    }

    try {
      media.currentTime = state.currentTime;
    } catch (_error) {
    }
  }

  function focusWithoutScrolling(element) {
    try {
      element.focus({ preventScroll: true });
    } catch (_error) {
      element.focus();
    }
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
    if (!isOverlayActive()) {
      return;
    }

    document.querySelectorAll("video, audio").forEach((media) => {
      pauseMediaElement(media);
    });
  }

  function handleMediaPlayWhileBlocked(event) {
    if (!isOverlayActive()) {
      return;
    }

    pauseMediaElement(event.target);
  }

  function lockPageScroll() {
    if (scrollLockActive) {
      return;
    }

    scrollLockActive = true;

    window.addEventListener("wheel", preventBlockedScroll, { capture: true, passive: false });
    window.addEventListener("touchmove", preventBlockedScroll, { capture: true, passive: false });
    KEYBOARD_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, preventBlockedPageKeyboard, true);
    });
  }

  function unlockPageScroll() {
    if (!scrollLockActive) {
      return;
    }

    scrollLockActive = false;

    window.removeEventListener("wheel", preventBlockedScroll, true);
    window.removeEventListener("touchmove", preventBlockedScroll, true);
    KEYBOARD_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, preventBlockedPageKeyboard, true);
    });
  }

  function preventBlockedScroll(event) {
    if (!isOverlayActive()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function stopOverlayKeyboardPropagation(event) {
    if (!isOverlayActive()) {
      return;
    }

    event.stopPropagation();
  }

  function preventBlockedPageKeyboard(event) {
    if (!isOverlayActive() || event.composedPath?.().includes(overlayHost)) {
      return;
    }

    if (event.type === "keydown" && SCROLL_KEYS.has(event.key)) {
      event.preventDefault();
    }

    event.stopPropagation();
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

  function cleanError(error) {
    return String(error?.message || error || "Something went wrong.").replace(/^Error:\s*/, "");
  }
})();
