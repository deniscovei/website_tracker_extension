const params = new URLSearchParams(window.location.search);
const site = params.get("site") || "";
const extraTime = document.getElementById("extra-time");
const extraStatus = document.getElementById("extra-status");
const extraActions = document.getElementById("extra-actions");
const continueSite = document.getElementById("continue-site");

document.getElementById("go-back")?.addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
    return;
  }

  window.close();
});

continueSite?.addEventListener("click", () => {
  if (site) {
    window.location.href = `https://${site}/`;
  }
});

extraActions?.addEventListener("click", async (event) => {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  const button = event.target.closest("[data-extra-minutes]");

  if (!button) {
    return;
  }

  await addExtraMinutes(Number(button.dataset.extraMinutes));
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
      return;
    }

    renderStatus(response.status);
  } catch (error) {
    extraStatus.textContent = cleanError(error);
  }
}

function renderStatus(status) {
  const remainingMinutes = Math.ceil(status.remainingSeconds / 60);
  extraActions.hidden = true;

  if (!status.allowExtraTime && status.dailyAllowanceMinutes <= 0) {
    extraTime.hidden = true;
    return;
  }

  if (remainingMinutes > 0) {
    continueSite.hidden = false;
  }

  if (status.allowExtraTime) {
    extraStatus.textContent = remainingMinutes > 0
      ? `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} available for today.`
      : "Your daily allowance is used up. Add more time for today.";
    extraActions.hidden = false;
    return;
  }

  if (remainingMinutes > 0) {
    extraStatus.textContent = `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} available for today.`;
    return;
  }

  if (status.dailyAllowanceMinutes > 0) {
    extraStatus.textContent = "Your daily allowance is used up. Extra time is disabled for this website.";
    return;
  }

  extraStatus.textContent = "Extra time is disabled for this website.";
}

async function addExtraMinutes(minutes) {
  extraActions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  try {
    const response = await chrome.runtime.sendMessage({
      type: "add-extra-time",
      domain: site,
      minutes
    });

    if (!response?.ok) {
      throw new Error(cleanError(response?.error || "Could not add extra time."));
    }

    extraStatus.textContent = `Added ${minutes} minute${minutes === 1 ? "" : "s"} for today.`;
    continueSite.hidden = false;
  } catch (error) {
    extraStatus.textContent = cleanError(error);
  } finally {
    extraActions.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }
}

function cleanError(error) {
  const message = error && typeof error === "object" && "message" in error
    ? error.message
    : error;

  return String(message || "Something went wrong.").replace(/^Error:\s*/, "");
}
