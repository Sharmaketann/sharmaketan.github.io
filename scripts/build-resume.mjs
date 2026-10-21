#!/usr/bin/env node
/**
 * Renders resume/resume.html -> public/Sharma_Ketan_Resume.pdf via headless Chrome,
 * then asserts the result is still one page and still ATS-readable.
 *
 *   node scripts/build-resume.mjs
 *
 * Chrome is used rather than a PDF library because the layout is CSS, and
 * because Chrome embeds a real text layer (which is the whole point - the
 * previous Google Doc stored the skills section as an image and ATS parsers
 * read it as nothing).
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "resume/resume.html");
const out = resolve(root, "public/Sharma_Ketan_Resume.pdf");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to a Chromium binary.");
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`Missing source: ${src}`);
  process.exit(1);
}

console.log(`chrome : ${chrome}`);
console.log(`source : ${src}`);

execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-pdf-header-footer",
    // give webfonts time to land, otherwise the PDF renders in fallbacks
    "--virtual-time-budget=20000",
    `--print-to-pdf=${out}`,
    pathToFileURL(src).href,
  ],
  { stdio: ["ignore", "ignore", "ignore"] },
);

if (!existsSync(out)) {
  console.error("Chrome produced no PDF.");
  process.exit(1);
}

// ── Assertions: fail loudly rather than ship a silently broken resume ────────
const pdf = readFileSync(out).toString("latin1");
const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
const hasText = /\/FontFile\d?/.test(pdf);
const a4 = /\/MediaBox\s*\[\s*0\s+0\s+59[0-9](\.\d+)?\s+84[0-9](\.\d+)?\s*\]/.test(pdf);

const problems = [];
if (pages !== 1) problems.push(`expected 1 page, got ${pages}`);
if (!hasText) problems.push("no embedded font programs - text layer may be missing");
if (!a4) problems.push("page box is not A4");

console.log(`output : ${out} (${(statSync(out).size / 1024).toFixed(0)} KB)`);
console.log(`pages  : ${pages}`);

if (problems.length) {
  console.error("\nFAILED:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("ok     : 1 page, A4, text layer present");
