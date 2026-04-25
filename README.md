# Website Tracker

A small Manifest V3 Chrome extension that tracks daily website screen time and blocks websites during editable time windows.

## Load It In Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Choose this folder: `/home/denis/extensie`.

The schedule is saved in Chrome storage from the popup. The extension refreshes active blocking rules every 30 seconds while it is running.

## Edit The Schedule

1. Click the extension icon.
2. Click **New site** or choose an existing website.
3. Choose **Always blocked** or **Timed blocks**.
4. Use **Add slot** for each blocked time interval when timed blocks are enabled.
5. Click a slot row to open the clock editor.
6. Drag or click the clock dials to adjust start and end times, or type the `HH:MM` value directly.
7. Set **Daily allowance** if the site should be usable for a few minutes while it is blocked.
8. Turn on extra time if the blocked page should offer buttons to add more minutes.
9. Click **Save**.

Intervals use browser local time. Overnight intervals work, so a slot from `22:00` to `07:00` blocks through midnight.

Daily allowance minutes are only spent while the site is active during a blocked slot. The allowance resets each local day. If extra time is enabled, the blocked page can add 5, 15, or 30 more minutes for the current day.

## Screen Time

Open the popup and switch to **Usage** to see website usage for the selected day. The extension records active HTTP and HTTPS websites, shows total time, a weekly Apple-style bar chart with a daily average line, stacked hourly category bars, an interactive website share pie chart, and a per-website breakdown. Usage is kept for today plus the last 30 completed days.
