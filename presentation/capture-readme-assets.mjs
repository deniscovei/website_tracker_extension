import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "readme-assets.html");
const readmeDir = resolve(__dirname, "..", "assets", "readme");
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
  console.error("Could not find Chrome or Chromium. Set CHROME_BIN to generate README assets.");
  process.exit(1);
}

if (!convert) {
  console.error("Could not find ImageMagick convert. Set CONVERT_BIN to generate README assets.");
  process.exit(1);
}

mkdirSync(readmeDir, { recursive: true });

const assets = [
  { id: "websites", out: resolve(readmeDir, "websites.png") },
  { id: "usage", out: resolve(readmeDir, "usage.png") },
  { id: "focus", out: resolve(readmeDir, "focus.png") }
];

for (const asset of assets) {
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
    "--window-size=480,840",
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
    "480x720+0+0",
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

console.log("README assets generated.");
