const params = new URLSearchParams(window.location.search);
const site = params.get("site") || "";
const extraTime = document.getElementById("extra-time");
const popupViewRoot = document.getElementById("popup-view-root");

const VIEW_STATE = {
  SELECT: "select",
  SUCCESS: "success",
  PIN: "pin"
};
const FINAL_ACTION_LABEL = "Enter Page";

let latestStatus = null;
let currentView = VIEW_STATE.SELECT;
let pendingMinutes = 0;
let blockedPinVisible = false;
let actionInFlight = false;
let pinDraft = "";

void loadExtraTimeStatus();

async function loadExtraTimeStatus() {
  if (!site) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "get-site-status",
      domain: site
    });

    if (!response?.ok || !response.status?.found || !response.status.allowExtraTime) {
      extraTime.hidden = true;
      return;
    }

    latestStatus = response.status;
    currentView = VIEW_STATE.SELECT;
    pendingMinutes = 0;
    blockedPinVisible = false;
    actionInFlight = false;
    pinDraft = "";
    extraTime.hidden = false;
    renderCurrentView();
  } catch (error) {
    console.error("Could not load add-minutes popup state.", error);
    extraTime.hidden = true;
  }
}

function renderCurrentView() {
  popupViewRoot.replaceChildren();

  if (currentView === VIEW_STATE.SUCCESS) {
    popupViewRoot.append(createSuccessView());
  } else if (currentView === VIEW_STATE.PIN) {
    popupViewRoot.append(createPinView());
    requestAnimationFrame(() => {
      popupViewRoot.querySelector("#pin-code")?.focus();
    });
  } else {
    popupViewRoot.append(createSelectionView());
  }
}

function createSelectionView() {
  const view = document.createElement("section");
  const actions = document.createElement("div");
  const minuteOptions = [5, 15, 30];

  view.className = "popup-view popup-view-selection";
  actions.className = "extra-actions";

  minuteOptions.forEach((minutes) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "minutes-button";
    button.textContent = `Add ${minutes} min`;
    button.disabled = actionInFlight;
    button.addEventListener("click", () => {
      void handleMinuteSelection(minutes);
    });
    actions.append(button);
  });

  view.append(actions);
  return view;
}

function createSuccessView() {
  const view = document.createElement("section");
  const message = document.createElement("p");
  const actions = document.createElement("div");
  const backButton = document.createElement("button");
  const button = document.createElement("button");

  view.className = "popup-view popup-view-success";
  message.className = "view-message";
  message.textContent = `Add ${formatMinutes(pendingMinutes)} and enter the page.`;

  actions.className = "popup-view-actions";

  backButton.type = "button";
  backButton.className = "panel-button secondary";
  backButton.textContent = "Back";
  backButton.disabled = actionInFlight;
  backButton.addEventListener("click", () => {
    returnToSelection();
  });

  button.type = "button";
  button.className = "panel-button primary";
  button.textContent = FINAL_ACTION_LABEL;
  button.disabled = actionInFlight;
  button.addEventListener("click", () => {
    void confirmStagedMinutes();
  });

  actions.append(backButton, button);
  view.append(message, actions);
  return view;
}

function createPinView() {
  const view = document.createElement("section");
  const field = document.createElement("label");
  const wrap = document.createElement("div");
  const input = document.createElement("input");
  const visibilityButton = document.createElement("button");
  const actions = document.createElement("div");
  const backButton = document.createElement("button");
  const continueButton = document.createElement("button");

  view.className = "popup-view popup-view-pin";

  field.className = "pin-field";
  field.setAttribute("aria-label", "PIN entry");

  wrap.className = "pin-input-wrap";

  input.id = "pin-code";
  input.type = blockedPinVisible ? "text" : "password";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.maxLength = 4;
  input.placeholder = "0000";
  input.className = "pin-input";
  input.value = pinDraft;
  input.disabled = actionInFlight;
  input.setAttribute("aria-label", "PIN");
  input.addEventListener("input", () => {
    input.value = sanitizePinValue(input.value);
    pinDraft = input.value;
    input.setCustomValidity("");
    continueButton.disabled = actionInFlight || input.value.length !== 4;
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !continueButton.disabled) {
      event.preventDefault();
      continueButton.click();
    }
  });

  visibilityButton.type = "button";
  visibilityButton.className = "eye-button";
  visibilityButton.disabled = actionInFlight;
  visibilityButton.setAttribute("aria-label", `${blockedPinVisible ? "Hide" : "Show"} PIN`);
  visibilityButton.setAttribute("aria-pressed", String(blockedPinVisible));
  visibilityButton.innerHTML = blockedPinVisible ? getEyeOffIcon() : getEyeIcon();
  visibilityButton.addEventListener("click", () => {
    blockedPinVisible = !blockedPinVisible;
    renderCurrentView();
  });

  actions.className = "popup-view-actions";

  backButton.type = "button";
  backButton.className = "panel-button secondary";
  backButton.textContent = "Back";
  backButton.disabled = actionInFlight;
  backButton.addEventListener("click", () => {
    returnToSelection();
  });

  continueButton.type = "button";
  continueButton.className = "panel-button primary";
  continueButton.textContent = FINAL_ACTION_LABEL;
  continueButton.disabled = actionInFlight || input.value.length !== 4;
  continueButton.addEventListener("click", () => {
    void handlePinSubmit(input);
  });

  wrap.append(input, visibilityButton);
  field.append(wrap);
  actions.append(backButton, continueButton);
  view.append(field, actions);

  return view;
}

async function handleMinuteSelection(minutes) {
  pendingMinutes = Math.max(0, Number(minutes) || 0);

  if (pendingMinutes <= 0 || !latestStatus) {
    return;
  }

  if (latestStatus.requiresPinForExtraTime) {
    pinDraft = "";
    blockedPinVisible = false;
    currentView = VIEW_STATE.PIN;
    renderCurrentView();
    return;
  }

  currentView = VIEW_STATE.SUCCESS;
  renderCurrentView();
}

async function handlePinSubmit(input) {
  const pin = sanitizePinValue(input?.value);

  if (!input) {
    return;
  }

  input.value = pin;
  pinDraft = pin;
  input.setCustomValidity("");

  if (pin.length !== 4) {
    input.setCustomValidity("PIN must be 4 digits.");
    input.reportValidity();
    return;
  }

  actionInFlight = true;
  renderCurrentView();

  const refreshedInput = popupViewRoot.querySelector("#pin-code");
  if (refreshedInput instanceof HTMLInputElement) {
    refreshedInput.value = pin;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "add-extra-time",
      domain: site,
      minutes: pendingMinutes,
      pin
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not add extra time."));
    }

    latestStatus = response.status || latestStatus;
    navigateToSite();
  } catch (error) {
    actionInFlight = false;
    currentView = VIEW_STATE.PIN;
    renderCurrentView();

    const nextInput = popupViewRoot.querySelector("#pin-code");

    if (nextInput instanceof HTMLInputElement) {
      nextInput.value = pin;
      pinDraft = pin;
      nextInput.setCustomValidity(cleanError(error));
      nextInput.reportValidity();
      nextInput.focus();
      nextInput.select();
    }
  }
}

async function confirmStagedMinutes() {
  if (pendingMinutes <= 0 || actionInFlight) {
    return;
  }

  actionInFlight = true;
  renderCurrentView();

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

    latestStatus = response.status || latestStatus;
    navigateToSite();
  } catch (error) {
    console.error("Could not add staged extra time.", error);
    actionInFlight = false;
    currentView = VIEW_STATE.SELECT;
    renderCurrentView();
    window.alert(cleanError(error));
  }
}

function navigateToSite() {
  if (site) {
    window.location.href = `https://${site}/`;
  }
}

function returnToSelection() {
  if (actionInFlight) {
    return;
  }

  currentView = VIEW_STATE.SELECT;
  pendingMinutes = 0;
  pinDraft = "";
  blockedPinVisible = false;
  renderCurrentView();
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
