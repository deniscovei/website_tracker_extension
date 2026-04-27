import { createDemoPopupData } from "../../shared/demo-data.js";

const demo = createDemoPopupData();
const siteList = document.getElementById("site-list");
const weekBars = document.getElementById("week-bars");
const focusTotal = document.getElementById("focus-total");
const days = demo.pomodoroStats.last7Days;
const maxSeconds = Math.max(1, ...days.map((day) => day.totalSeconds));

focusTotal.textContent = "52m";

siteList.replaceChildren(
  ...demo.schedule.sites.map((site) => {
    const item = document.createElement("li");
    const domain = document.createElement("strong");
    const meta = document.createElement("small");

    domain.textContent = site.domain;
    meta.textContent = site.blockMode === "always"
      ? "Always blocked"
      : `${site.intervals.length} time slots · ${site.dailyAllowanceMinutes} min/day`;
    item.append(domain, meta);
    return item;
  })
);

weekBars.replaceChildren(
  ...days.map((day) => {
    const bar = document.createElement("span");
    const height = day.totalSeconds <= 0 ? 0 : Math.max(8, Math.round(day.totalSeconds / maxSeconds * 100));

    bar.style.height = `${height}%`;
    bar.title = `${day.date}: ${Math.round(day.totalSeconds / 60)}m`;
    return bar;
  })
);
