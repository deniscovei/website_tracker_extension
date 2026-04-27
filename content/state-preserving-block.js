(() => {
  if (window.__focusTrackerStatePreservingBlockInstalled) {
    return;
  }

  window.__focusTrackerStatePreservingBlockInstalled = true;

  const OVERLAY_ID = "focus-tracker-state-preserving-block";
  const ROOT_ID = "focus-tracker-state-preserving-root";
  const MINUTE_OPTIONS = [5, 15, 30];
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

      const sharedStyles = document.createElement("link");
      sharedStyles.rel = "stylesheet";
      sharedStyles.href = chrome.runtime.getURL("shared/block-panel.css");

      const root = document.createElement("div");
      root.id = ROOT_ID;

      shadowRoot.append(style, sharedStyles, root);
      document.documentElement.append(overlayHost);
    } else {
      shadowRoot = overlayHost.shadowRoot;
    }
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
    const ui = globalThis.FocusTrackerBlockPanel;

    root.innerHTML = ui.renderShell({
      title: "Enter your PIN",
      message: `Add ${minutes} minute${minutes === 1 ? "" : "s"} to continue.`,
      body: `
        ${ui.renderPinField({
          inputId: "focus-tracker-pin-input",
          disabled: actionInFlight
        })}
        ${ui.renderError(pinError)}
      `,
      actions: ui.renderActionButtons({
        primaryText: "Add time",
        secondaryText: "Back",
        disabled: actionInFlight
      }),
      titleId: "focus-tracker-pin-title"
    });

    const input = root.querySelector("#focus-tracker-pin-input");
    const submit = root.querySelector("[data-primary-action]");
    const back = root.querySelector("[data-secondary-action]");

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

  function cleanError(error) {
    return String(error?.message || error || "Something went wrong.").replace(/^Error:\s*/, "");
  }
})();
