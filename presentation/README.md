# Focus Tracker Presentation Pack

This folder contains Chrome Web Store style presentation assets generated from mock data.

## Assets

- `screenshots/01-website-blocking-dashboard.png`
- `screenshots/02-extra-time-instant-revoke.png`
- `screenshots/03-usage-insights.png`
- `screenshots/04-pomodoro-focus-mode.png`
- `screenshots/05-global-settings-and-filters.png`
- `promotional/small-promo-440x280.png`
- `promotional/marquee-promo-1400x560.png`
- `description.txt`

The five screenshots are `1280x800`, matching Chrome Web Store screenshot guidance.

## Regenerate

Run:

```bash
node presentation/capture-assets.mjs
```

The generator uses local Chrome or Chromium plus ImageMagick `convert`, and does not require npm packages. Set `CHROME_BIN` or `CONVERT_BIN` if either tool is installed somewhere unusual.
