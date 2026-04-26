const params = new URLSearchParams(window.location.search);
const site = params.get("site") || "";
const extraTime = document.getElementById("extra-time");
const extraStatus = document.getElementById("extra-status");
const allowanceActions = document.getElementById("allowance-actions");
const continueSite = document.getElementById("continue-site");
const mainPanel = document.getElementById("panel-main");
const extraActions = document.getElementById("extra-actions");
const addedPanel = document.getElementById("panel-added");
const addedStatus = document.getElementById("added-status");
const addedBack = document.getElementById("added-back");
const addedContinue = document.getElementById("added-continue");
const pinPanel = document.getElementById("panel-pin");
const pinStatusCopy = document.getElementById("pin-status-copy");
const pinBack = document.getElementById("pin-back");
const pinContinue = document.getElementById("pin-continue");
const pinCode = document.getElementById("pin-code");
const pinVisibility = document.getElementById("pin-visibility");
const pinError = document.getElementById("pin-error");

let latestStatus = null;
let pendingMinutes = 0;
let pinIsValid = false;
let validatedPin = "";
let pinValidationId = 0;
let blockedPinVisible = false;
let currentPanel = "main";
let actionInFlight = false;

continueSite?.addEventListener("click", () => {
  navigateToSite();
});

addedBack?.addEventListener("click", () => {
  showMainPanel();
});

addedContinue?.addEventListener("click", () => {
  navigateToSite();
});

pinBack?.addEventListener("click", () => {
  resetPinState();
  showMainPanel();
});

pinContinue?.addEventListener("click", () => {
  void handlePinContinue();
});

extraActions?.addEventListener("click", async (event) => {
  if (!(event.target instanceof HTMLElement) || actionInFlight) {
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
  if (event.key === "Enter" && !pinContinue.disabled) {
    event.preventDefault();
    pinContinue.click();
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
  extraStatus.textContent = "Checking today's allowance...";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "get-site-status",
      domain: site
    });

    if (!response?.ok || !response.status?.found) {
      extraStatus.textContent = "This website is blocked by the current schedule.";
      hideAllPanels();
      return;
    }

    renderStatus(response.status);
  } catch (error) {
    extraStatus.textContent = cleanError(error);
    hideAllPanels();
  }
}

function renderStatus(status) {
  latestStatus = status;
  const remainingSeconds = Math.max(0, Number(status.remainingSeconds) || 0);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const hasAllowance = remainingSeconds > 0;
  const canAddExtra = Boolean(status.allowExtraTime);

  if (!hasAllowance && !canAddExtra) {
    extraTime.hidden = true;
    hideAllPanels();
    return;
  }

  extraTime.hidden = false;
  extraStatus.textContent = hasAllowance
    ? `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} available for today.`
    : "Today's allowance is used up. Add more time for today.";
  allowanceActions.hidden = currentPanel !== "main" || !hasAllowance;

  if (!canAddExtra) {
    hideAllPanels({ keepAllowance: true });
    return;
  }

  if (currentPanel === "added") {
    showAddedPanel(pendingMinutes || 0, { keepStatus: true });
    return;
  }

  if (currentPanel === "pin") {
    showPinPanel({ keepInput: true, keepStatus: true });
    return;
  }

  showMainPanel();
}

async function requestExtraMinutes(minutes) {
  pendingMinutes = Math.max(0, Number(minutes) || 0);

  if (pendingMinutes <= 0) {
    return;
  }

  if (latestStatus?.requiresPinForExtraTime) {
    showPinPanel();
    return;
  }

  setBusyState(true);
  extraStatus.textContent = `Adding ${formatMinutes(pendingMinutes)}...`;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "add-extra-time",
      domain: site,
      minutes: pendingMinutes,
      pin: ""
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not add extra time."));
    }

    renderStatus(response.status || latestStatus);
    showAddedPanel(pendingMinutes);
  } catch (error) {
    showMainPanel();
    extraStatus.textContent = cleanError(error);
  } finally {
    setBusyState(false);
  }
}

async function handlePinContinue() {
  if (!pinIsValid || pendingMinutes <= 0 || actionInFlight) {
    return;
  }

  setBusyState(true);
  setPinMessage("Adding time...", "pending");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "add-extra-time",
      domain: site,
      minutes: pendingMinutes,
      pin: validatedPin
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not add extra time."));
    }

    renderStatus(response.status || latestStatus);
    navigateToSite();
  } catch (error) {
    setPinMessage(cleanError(error), "error");
  } finally {
    setBusyState(false);
    updateActionState();
  }
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
    setPinMessage("Enter the 4-digit PIN to continue.", "idle");
    updateActionState();
    return;
  }

  if (pin.length < 4) {
    setPinMessage("PIN must be 4 digits.", "error");
    updateActionState();
    return;
  }

  const validationId = pinValidationId;
  setPinMessage("Checking PIN...", "pending");
  updateActionState();

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
      updateActionState();
      return;
    }

    if (!response.valid) {
      setPinMessage("PIN does not match.", "error");
      updateActionState();
      return;
    }

    pinIsValid = true;
    validatedPin = pin;
    setPinMessage("PIN is correct.", "valid");
    updateActionState();
  } catch (error) {
    if (validationId !== pinValidationId) {
      return;
    }

    setPinMessage(cleanError(error), "error");
    updateActionState();
  }
}

function showMainPanel() {
  currentPanel = "main";
  resetPinState({ keepPendingMinutes: true });
  mainPanel.hidden = !latestStatus?.allowExtraTime;
  addedPanel.hidden = true;
  pinPanel.hidden = true;
  allowanceActions.hidden = !latestStatus?.remainingSeconds;
  updateActionState();
}

function showAddedPanel(minutes, { keepStatus = false } = {}) {
  currentPanel = "added";
  mainPanel.hidden = true;
  addedPanel.hidden = false;
  pinPanel.hidden = true;
  allowanceActions.hidden = true;
  addedStatus.textContent = `Added ${formatMinutes(minutes)} for today.`;

  if (!keepStatus && latestStatus) {
    const remainingMinutes = Math.ceil((latestStatus.remainingSeconds || 0) / 60);
    extraStatus.textContent = `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} available for today.`;
  }

  updateActionState();
}

function showPinPanel({ keepInput = false, keepStatus = false } = {}) {
  currentPanel = "pin";
  mainPanel.hidden = true;
  addedPanel.hidden = true;
  pinPanel.hidden = false;
  allowanceActions.hidden = true;
  pinStatusCopy.textContent = `${formatMinutes(pendingMinutes)} will be added for today.`;

  if (!keepInput) {
    resetPinState({ keepPendingMinutes: true });
  }

  if (!keepStatus) {
    setPinMessage("Enter the 4-digit PIN to continue.", "idle");
  }

  updateActionState();
  pinCode.focus();
}

function hideAllPanels({ keepAllowance = false } = {}) {
  mainPanel.hidden = true;
  addedPanel.hidden = true;
  pinPanel.hidden = true;
  allowanceActions.hidden = keepAllowance ? allowanceActions.hidden : true;
}

function resetPinState({ keepPendingMinutes = false } = {}) {
  if (!keepPendingMinutes) {
    pendingMinutes = 0;
  }

  pinCode.value = "";
  pinIsValid = false;
  validatedPin = "";
  pinValidationId += 1;
  blockedPinVisible = false;
  setPinVisibility(pinCode, pinVisibility, false);
  setPinMessage("", "idle");
}

function updateActionState() {
  const hasAllowance = Boolean(site && latestStatus?.remainingSeconds > 0);
  const canContinueWithPin = Boolean(pinIsValid && pendingMinutes > 0 && !actionInFlight);

  continueSite.disabled = !hasAllowance || actionInFlight;
  addedBack.disabled = actionInFlight;
  addedContinue.disabled = actionInFlight;
  pinBack.disabled = actionInFlight;
  pinContinue.disabled = !canContinueWithPin;
  pinCode.disabled = actionInFlight;
  pinVisibility.disabled = actionInFlight || pinCode.value.length === 0;

  extraActions.querySelectorAll("button").forEach((button) => {
    button.disabled = actionInFlight;
  });
}

function setBusyState(isBusy) {
  actionInFlight = isBusy;
  updateActionState();
}

function setPinMessage(message, state) {
  pinError.textContent = message;
  pinError.dataset.state = state;
}

function navigateToSite() {
  if (site) {
    window.location.href = `https://${site}/`;
  }
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
