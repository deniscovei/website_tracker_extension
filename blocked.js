const params = new URLSearchParams(window.location.search);
const site = params.get("site") || "";
const extraTime = document.getElementById("extra-time");
const extraStatus = document.getElementById("extra-status");
const extraActions = document.getElementById("extra-actions");
const continueSite = document.getElementById("continue-site");
const cutOffSite = document.getElementById("cut-off-site");

let latestStatus = null;

continueSite?.addEventListener("click", () => {
  if (site) {
    window.location.href = `https://${site}/`;
  }
});

cutOffSite?.addEventListener("click", () => {
  void handleCutOffSite();
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
    updateActionButtons();
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

  updateActionButtons();
}

async function requestExtraMinutes(minutes) {
  await addExtraMinutes(minutes);
}

function updateActionButtons() {
  const canContinue = Boolean(site && latestStatus?.remainingSeconds > 0);
  const canCutOff = Boolean(site && (latestStatus?.extraSeconds || 0) > 0);

  continueSite.hidden = !canContinue;
  continueSite.disabled = !canContinue;
  cutOffSite.hidden = !canCutOff;
  cutOffSite.disabled = !canCutOff;
}

async function addExtraMinutes(minutes) {
  extraActions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  if (cutOffSite) {
    cutOffSite.disabled = true;
  }
  continueSite.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "add-extra-time",
      domain: site,
      minutes
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not add extra time."));
    }

    latestStatus = response.status || latestStatus;
    extraStatus.textContent = `Added ${formatMinutes(minutes)} for today.`;
    updateActionButtons();
  } catch (error) {
    extraStatus.textContent = cleanError(error);
  } finally {
    extraActions.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });

    if (cutOffSite) {
      cutOffSite.disabled = false;
    }

    updateActionButtons();
  }
}

async function handleCutOffSite() {
  if (!site || !cutOffSite) {
    return;
  }

  cutOffSite.disabled = true;
  continueSite.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "cut-off-site",
      domain: site
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not cut off this website."));
    }

    latestStatus = response.status || latestStatus;
    extraStatus.textContent = "Website cut off for today.";
    updateActionButtons();
  } catch (error) {
    extraStatus.textContent = cleanError(error);
  } finally {
    cutOffSite.disabled = false;
    updateActionButtons();
  }
}

function formatMinutes(minutes) {
  const value = Math.max(0, Number(minutes) || 0);
  return `${value} minute${value === 1 ? "" : "s"}`;
}

function cleanError(error) {
  const message = error && typeof error === "object" && "message" in error
    ? error.message
    : error;

  return String(message || "Something went wrong.").replace(/^Error:\s*/, "");
}
