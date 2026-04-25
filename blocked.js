const params = new URLSearchParams(window.location.search);
const site = params.get("site") || "";
const extraTime = document.getElementById("extra-time");
const extraStatus = document.getElementById("extra-status");
const extraActions = document.getElementById("extra-actions");
const continueSite = document.getElementById("continue-site");
const pinPanel = document.getElementById("pin-panel");
const pinCode = document.getElementById("pin-code");
const pinVisibility = document.getElementById("pin-visibility");
const pinError = document.getElementById("pin-error");

let latestStatus = null;
let pendingMinutes = 0;
let pinIsValid = false;
let validatedPin = "";
let pinValidationId = 0;
let blockedPinVisible = false;

continueSite?.addEventListener("click", () => {
  void handleContinue();
});

extraActions?.addEventListener("click", async (event) => {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  const button = event.target.closest("[data-extra-minutes]");

  if (!button) {
    return;
  }

  await requestExtraMinutes(Number(button.dataset.extraMinutes));
});

pinCode?.addEventListener("input", () => {
  void handlePinInput();
});

pinCode?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !continueSite.hidden && !continueSite.disabled) {
    event.preventDefault();
    continueSite.click();
  }
});

pinVisibility?.addEventListener("click", () => {
  blockedPinVisible = !blockedPinVisible;
  setPinVisibility(pinCode, pinVisibility, blockedPinVisible);
});

void loadExtraTimeStatus();

async function loadExtraTimeStatus() {
  if (!site) {
    return;
  }

  extraTime.hidden = false;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "get-site-status",
      domain: site
    });

    if (!response?.ok || !response.status?.found) {
      extraStatus.textContent = "This website is blocked by the current schedule.";
      continueSite.hidden = true;
      return;
    }

    latestStatus = response.status;
    renderStatus(response.status);
  } catch (error) {
    extraStatus.textContent = cleanError(error);
    continueSite.hidden = true;
  }
}

function renderStatus(status) {
  latestStatus = status;
  const remainingMinutes = Math.ceil(status.remainingSeconds / 60);
  extraTime.hidden = false;
  extraActions.hidden = true;

  if (!status.allowExtraTime && status.dailyAllowanceMinutes <= 0) {
    extraTime.hidden = true;
    updateContinueState();
    return;
  }

  if (status.allowExtraTime) {
    extraStatus.textContent = remainingMinutes > 0
      ? `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} available for today.`
      : "Your daily allowance is used up. Add more time for today.";
    extraActions.hidden = false;
  } else if (remainingMinutes > 0) {
    extraStatus.textContent = `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} available for today.`;
  } else if (status.dailyAllowanceMinutes > 0) {
    extraStatus.textContent = "Your daily allowance is used up. Extra time is disabled for this website.";
  } else {
    extraStatus.textContent = "Extra time is disabled for this website.";
  }

  updateContinueState();
}

async function requestExtraMinutes(minutes) {
  pendingMinutes = minutes;

  if (latestStatus?.requiresPinForExtraTime) {
    showPinPanel();
    return;
  }

  await addExtraMinutes(minutes);
}

async function handleContinue() {
  if (pinPanel.hidden || pendingMinutes <= 0) {
    if (site) {
      window.location.href = `https://${site}/`;
    }
    return;
  }

  if (!pinIsValid) {
    return;
  }

  await addExtraMinutes(pendingMinutes, validatedPin, { navigateAfter: true });
}

async function handlePinInput() {
  const pin = sanitizePinValue(pinCode.value);

  if (pin !== pinCode.value) {
    pinCode.value = pin;
  }

  pinIsValid = false;
  validatedPin = "";
  pinValidationId += 1;

  if (pin.length === 0) {
    setPinMessage(`Enter the PIN to add ${formatMinutes(pendingMinutes)}.`, "idle");
    updateContinueState();
    return;
  }

  if (pin.length < 4) {
    setPinMessage("PIN must be 4 digits.", "error");
    updateContinueState();
    return;
  }

  const validationId = pinValidationId;
  setPinMessage("Checking PIN...", "pending");
  updateContinueState();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "validate-pin",
      pin
    });

    if (validationId !== pinValidationId) {
      return;
    }

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not validate the PIN."));
    }

    if (!response.configured) {
      setPinMessage("PIN protection is not set yet.", "error");
      updateContinueState();
      return;
    }

    if (!response.valid) {
      setPinMessage("PIN does not match.", "error");
      updateContinueState();
      return;
    }

    pinIsValid = true;
    validatedPin = pin;
    setPinMessage("PIN ready.", "valid");
    updateContinueState();
  } catch (error) {
    if (validationId !== pinValidationId) {
      return;
    }

    setPinMessage(cleanError(error), "error");
    updateContinueState();
  }
}

function showPinPanel() {
  pinPanel.hidden = false;
  pinCode.value = "";
  blockedPinVisible = false;
  setPinVisibility(pinCode, pinVisibility, false);
  pinIsValid = false;
  validatedPin = "";
  pinValidationId += 1;
  setPinMessage(`Enter the PIN to add ${formatMinutes(pendingMinutes)}.`, "idle");
  updateContinueState();
  pinCode.focus();
}

function hidePinPanel() {
  pendingMinutes = 0;
  pinCode.value = "";
  pinPanel.hidden = true;
  pinIsValid = false;
  validatedPin = "";
  pinValidationId += 1;
  blockedPinVisible = false;
  setPinVisibility(pinCode, pinVisibility, false);
  setPinMessage("", "idle");
  updateContinueState();
}

function updateContinueState() {
  const canUseAllowance = Boolean(site && latestStatus?.remainingSeconds > 0 && pinPanel.hidden);
  const canUsePinFlow = Boolean(site && !pinPanel.hidden && pendingMinutes > 0);

  continueSite.hidden = !(canUseAllowance || canUsePinFlow);
  continueSite.disabled = canUsePinFlow ? !pinIsValid : false;
}

async function addExtraMinutes(minutes, pin = "", { navigateAfter = false } = {}) {
  extraActions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  continueSite.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "add-extra-time",
      domain: site,
      minutes,
      pin
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not add extra time."));
    }

    latestStatus = response.status || latestStatus;
    extraStatus.textContent = `Added ${formatMinutes(minutes)} for today.`;
    hidePinPanel();

    if (navigateAfter && site) {
      window.location.href = `https://${site}/`;
      return;
    }

    continueSite.hidden = false;
    continueSite.disabled = false;
  } catch (error) {
    const message = cleanError(error);

    if (pinPanel.hidden) {
      extraStatus.textContent = message;
    } else {
      setPinMessage(message, "error");
    }
  } finally {
    extraActions.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });

    if (!pinPanel.hidden) {
      continueSite.disabled = !pinIsValid;
    }
  }
}

function setPinMessage(message, state) {
  pinError.textContent = message;
  pinError.dataset.state = state;
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

function sanitizePinValue(value) {
  return String(value || "").replace(/\D+/g, "").slice(0, 4);
}

function formatMinutes(minutes) {
  const value = Math.max(0, Number(minutes) || 0);
  return `${value} minute${value === 1 ? "" : "s"}`;
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

function cleanError(error) {
  const message = error && typeof error === "object" && "message" in error
    ? error.message
    : error;

  return String(message || "Something went wrong.").replace(/^Error:\s*/, "");
}
