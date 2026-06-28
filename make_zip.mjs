#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const ZIP_NAME = "focus_tracker.zip";
const MANIFEST_PATH = "manifest.json";
const PACKAGE_ROOTS = ["manifest.json", "assets", "background", "content", "pages", "shared"];
const PACKAGE_EXCLUDES = ["assets/readme/"];
const DEFAULT_BASE_REFS = ["origin/master", "master"];

function main() {
  assertRepoRoot();
  assertCommand("git");
  assertCommand("zip");

  const baseRef = getBaseRef();
  const changed = packageChangedFromBase(baseRef);
  const version = maybeBumpManifestVersion(baseRef, changed);
  const files = listPackageFilesFromFs();

  rebuildZip(files);

  const zipBytes = statSync(ZIP_NAME).size;
  console.log(`Base ref: ${baseRef}`);
  console.log(`Package changed from base: ${changed ? "yes" : "no"}`);
  console.log(`Manifest version: ${version}`);
  console.log(`Zip: ${ZIP_NAME} (${zipBytes} bytes, ${files.length} files)`);
}

function assertRepoRoot() {
  if (!existsSync(MANIFEST_PATH)) {
    fail(`Run this from the extension repo root; ${MANIFEST_PATH} was not found.`);
  }
}

function assertCommand(command) {
  const result = spawnSync(command, ["--version"], { encoding: "utf8" });

  if (result.error || result.status !== 0) {
    fail(`Required command not available: ${command}`);
  }
}

function getBaseRef() {
  const explicitBase = getArgValue("--base") || process.env.BASE_REF;
  const candidates = explicitBase ? [explicitBase] : DEFAULT_BASE_REFS;

  for (const ref of candidates) {
    const result = git(["rev-parse", "--verify", `${ref}^{commit}`], { allowFailure: true });

    if (result.status === 0) {
      return ref;
    }
  }

  fail(`Could not find a base ref. Tried: ${candidates.join(", ")}`);
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return "";
  }

  return process.argv[index + 1] || "";
}

function maybeBumpManifestVersion(baseRef, changed) {
  const manifest = readJsonFile(MANIFEST_PATH);
  const currentVersion = String(manifest.version || "");
  const baseManifest = readJsonFromGit(baseRef, MANIFEST_PATH);
  const baseVersion = String(baseManifest?.version || "");

  if (!changed) {
    return currentVersion;
  }

  if (!isNumericVersion(currentVersion)) {
    fail(`Manifest version must be numeric dot-separated values, got: ${currentVersion}`);
  }

  if (!baseVersion || !isNumericVersion(baseVersion)) {
    return currentVersion;
  }

  if (compareVersions(currentVersion, baseVersion) > 0) {
    return currentVersion;
  }

  const nextVersion = bumpVersion(baseVersion);
  manifest.version = nextVersion;
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Bumped ${MANIFEST_PATH}: ${currentVersion} -> ${nextVersion}`);
  return nextVersion;
}

function packageChangedFromBase(baseRef) {
  const currentFiles = new Set(listPackageFilesFromFs());
  const baseFiles = new Set(listPackageFilesFromGit(baseRef));
  const allFiles = new Set([...currentFiles, ...baseFiles]);

  for (const file of allFiles) {
    const current = currentFiles.has(file) ? readFileSync(file) : null;
    const base = baseFiles.has(file) ? readFileFromGit(baseRef, file) : null;

    if (!buffersEqual(current, base)) {
      return true;
    }
  }

  return false;
}

function listPackageFilesFromFs() {
  return PACKAGE_ROOTS.flatMap((root) => {
    if (!existsSync(root)) {
      return [];
    }

    const stats = statSync(root);

    if (stats.isFile()) {
      return shouldPackageFile(root) ? [root] : [];
    }

    return walkFiles(root).filter(shouldPackageFile);
  }).sort();
}

function listPackageFilesFromGit(baseRef) {
  const result = git(["ls-tree", "-r", "--name-only", baseRef, "--", ...PACKAGE_ROOTS]);

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(shouldPackageFile)
    .sort();
}

function walkFiles(root) {
  const files = [];

  for (const entry of readdirSync(root)) {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (stats.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldPackageFile(file) {
  const normalized = file.replaceAll("\\", "/");

  if (normalized.split("/").some((part) => part.startsWith("."))) {
    return false;
  }

  if (basename(normalized).endsWith(".code-workspace")) {
    return false;
  }

  if (PACKAGE_EXCLUDES.some((prefix) => normalized === prefix.replace(/\/$/, "") || normalized.startsWith(prefix))) {
    return false;
  }

  return PACKAGE_ROOTS.some((root) => normalized === root || normalized.startsWith(`${root}/`));
}

function rebuildZip(files) {
  if (files.length === 0) {
    fail("No package files found.");
  }

  rmSync(ZIP_NAME, { force: true });
  mkdirSync(dirname(ZIP_NAME), { recursive: true });

  const result = spawnSync("zip", ["-q", ZIP_NAME, ...files], { encoding: "utf8" });

  if (result.status !== 0) {
    fail(result.stderr || `zip failed with status ${result.status}`);
  }
}

function readJsonFile(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readJsonFromGit(baseRef, file) {
  const content = readFileFromGit(baseRef, file, { allowMissing: true });
  return content ? JSON.parse(content.toString("utf8")) : null;
}

function readFileFromGit(baseRef, file, { allowMissing = false } = {}) {
  const result = git(["show", `${baseRef}:${file}`], { encoding: null, allowFailure: allowMissing });

  if (allowMissing && result.status !== 0) {
    return null;
  }

  return result.stdout;
}

function isNumericVersion(version) {
  return /^\d+(?:\.\d+){0,3}$/.test(version);
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);

    if (difference !== 0) {
      return Math.sign(difference);
    }
  }

  return 0;
}

function bumpVersion(version) {
  const parts = version.split(".").map(Number);
  const index = parts.length - 1;
  parts[index] += 1;
  return parts.join(".");
}

function buffersEqual(left, right) {
  if (left === null || right === null) {
    return left === right;
  }

  return left.equals(right);
}

function git(args, { encoding = "utf8", allowFailure = false } = {}) {
  const result = spawnSync("git", args, { encoding });

  if (!allowFailure && result.status !== 0) {
    fail(result.stderr?.toString() || `git ${args.join(" ")} failed`);
  }

  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main();
