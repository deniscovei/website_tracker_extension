import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "store-assets.html");
const screenshotsDir = resolve(__dirname, "screenshots");
const promoDir = resolve(__dirname, "promotional");
const chromeCandidates = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);
const convertCandidates = [
  process.env.CONVERT_BIN,
  "/usr/bin/convert",
  "/usr/bin/magick"
].filter(Boolean);

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
const convert = convertCandidates.find((candidate) => existsSync(candidate));

if (!chrome) {
  console.error("Could not find Chrome or Chromium. Set CHROME_BIN to generate assets.");
  process.exit(1);
}

if (!convert) {
  console.error("Could not find ImageMagick convert. Set CONVERT_BIN to generate assets.");
  process.exit(1);
}

mkdirSync(screenshotsDir, { recursive: true });
mkdirSync(promoDir, { recursive: true });

const assets = [
  { id: "screenshot-1", size: "1280,800", out: resolve(screenshotsDir, "01-website-blocking-dashboard.png") },
  { id: "screenshot-2", size: "1280,800", out: resolve(screenshotsDir, "02-extra-time-instant-revoke.png") },
  { id: "screenshot-3", size: "1280,800", out: resolve(screenshotsDir, "03-usage-insights.png") },
  { id: "screenshot-4", size: "1280,800", out: resolve(screenshotsDir, "04-pomodoro-focus-mode.png") },
  { id: "screenshot-5", size: "1280,800", out: resolve(screenshotsDir, "05-global-settings-and-filters.png") },
  { id: "promo-small", size: "440,280", out: resolve(promoDir, "small-promo-440x280.png") },
  { id: "promo-marquee", size: "1400,560", out: resolve(promoDir, "marquee-promo-1400x560.png") }
];

for (const asset of assets) {
  const [width, height] = asset.size.split(",").map((part) => Number(part));
  const captureSize = `${width},${height + 120}`;
  const rawOut = `${asset.out}.raw.png`;

  rmSync(asset.out, { force: true });
  rmSync(rawOut, { force: true });

  const url = `${pathToFileURL(htmlPath).href}?asset=${asset.id}`;
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${captureSize}`,
    "--virtual-time-budget=1000",
    `--screenshot=${rawOut}`,
    url
  ], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    console.error(`Failed to capture ${asset.id}`);
    process.exit(result.status || 1);
  }

  const cropResult = spawnSync(convert, [
    rawOut,
    "-crop",
    `${width}x${height}+0+0`,
    "+repage",
    asset.out
  ], {
    stdio: "inherit"
  });

  rmSync(rawOut, { force: true });

  if (cropResult.status !== 0) {
    console.error(`Failed to crop ${asset.id}`);
    process.exit(cropResult.status || 1);
  }
}

console.log("Presentation assets generated.");
