# Focus Tracker

Focus Tracker is a Manifest V3 Chrome extension for blocking distracting websites, tracking screen time, and running focused work sessions without losing page state.

## Features

- Schedule websites as always blocked or blocked during selected time slots.
- Track website usage by day, hour, category, and website share.
- Add daily allowances and optional extra-time buttons for blocked websites.
- Protect extra-time actions with an optional 4-digit PIN.
- Run Focus sessions in Standard mode or Strict whitelist mode.
- Preserve page state with an in-page blocked overlay when possible.
- Fall back to a dedicated blocked page when a page cannot host the overlay.
- Record Focus statistics: focused time, sessions, completion rate, streak, and a 7-day trend.

## Screenshots

Screenshot placeholders are listed below. Use `pages/popup/popup.html?demo=1` and `pages/dev/showcase.html` for polished fake data captures.

### Website blocking and overrides
![Website blocking and overrides](docs/screenshots/websites-overview.png)

### Focus session and statistics
![Focus session and statistics](docs/screenshots/focus-statistics.png)

### State-preserving block overlay
![State-preserving block overlay](docs/screenshots/block-overlay.png)

### Add website flow
![Add website flow](docs/screenshots/add-website.png)

The screenshot files are planned but not committed yet. See [docs/chrome-web-store/screenshot-plan.md](docs/chrome-web-store/screenshot-plan.md).

## Install Locally

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Choose this folder.

## Usage

Open the extension popup and use the **Websites** tab to add a website. New websites default to **Always blocked** and are only created after clicking **Add website**. Existing websites autosave as you edit them.

Use the **Usage** tab for screen-time analytics. Use the **Focus** tab to start a timed Focus session and open **Show statistics** for Focus history.

## Demo Mode

For screenshots, open:

```text
chrome-extension://<extension-id>/pages/popup/popup.html?demo=1
chrome-extension://<extension-id>/pages/dev/showcase.html
```

Demo mode uses realistic fake websites, usage, and Focus statistics. It is read-only and does not persist data to `chrome.storage`.

## Privacy

Focus Tracker stores schedules, settings, and usage history locally in Chrome storage. It does not send browsing data to an external server.

## Development Checks

Run syntax checks after changes:

```bash
node --check background/background.js
node --check pages/popup/popup.js
node --check content/state-preserving-block.js
node --check pages/blocked/blocked.js
```

For the current module split, also run `node --check` on files under `pages/popup/components`, `pages/popup/controllers`, `pages/popup/helpers`, `pages/popup/state`, and `shared`.

## Chrome Web Store

Publishing assets and copy are tracked in [docs/chrome-web-store/TODO.md](docs/chrome-web-store/TODO.md). The screenshot plan is in [docs/chrome-web-store/screenshot-plan.md](docs/chrome-web-store/screenshot-plan.md).
