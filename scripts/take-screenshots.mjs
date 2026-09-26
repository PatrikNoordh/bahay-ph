/**
 * scripts/take-screenshots.mjs
 *
 * Uses Puppeteer to capture polished PNG screenshots of every app screen.
 * Saves to screenshots/ at iPhone 14 resolution (390×844) and 2× retina.
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. node scripts/take-screenshots.mjs
 *
 * The script waits for real network requests to settle before screenshotting,
 * so images and data will be visible (not skeleton loaders).
 *
 * Authenticated screens (dashboard) are captured in guest state unless you
 * add SCREENSHOT_SESSION_TOKEN to .env.local (see comments below).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../screenshots");

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";

// iPhone 14 dimensions
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

// ─── Validate env ──────────────────────────────────────────────────────────────

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function waitForApp(page, url) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  // Extra wait for CSS animations to finish
  await new Promise((r) => setTimeout(r, 800));
}

async function screenshot(page, name) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  ✅  ${name}.png`);
  return filePath;
}

async function getFirstPropertyId() {
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase
    .from("properties")
    .select("id, property_type")
    .eq("status", "active")
    .limit(4);
  return data ?? [];
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📸  Bahay.ph — Screenshot Capture\n");
  console.log(`    Target: ${BASE_URL}`);
  console.log(`    Output: ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Fetch first few property IDs for detail page screenshots
  const properties = await getFirstPropertyId();
  if (properties.length === 0) {
    console.warn("⚠️  No active properties found in database.");
    console.warn("    Run seed-database.mjs first, or screenshots will show empty states.\n");
  }

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: VIEWPORT,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set Supabase session cookie if SCREENSHOT_SESSION_TOKEN is provided
  // To get a token: sign in to the app, open DevTools → Application → Cookies
  // and copy the value of sb-{project-ref}-auth-token
  if (process.env.SCREENSHOT_SESSION_TOKEN) {
    const projectRef = new URL(NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;
    await page.setCookie({
      name: cookieName,
      value: process.env.SCREENSHOT_SESSION_TOKEN,
      domain: "localhost",
      path: "/",
    });
    console.log("  🔐  Session cookie set — authenticated screens will show logged-in state\n");
  }

  const screens = [];

  try {
    // ── Home ──────────────────────────────────────────────────────────────────
    console.log("🏠  Home screen");
    await waitForApp(page, `${BASE_URL}/`);
    await screenshot(page, "01-home");
    screens.push("01-home");

    // ── Search ────────────────────────────────────────────────────────────────
    console.log("🔍  Search screen");
    await waitForApp(page, `${BASE_URL}/search`);
    await screenshot(page, "02-search");
    screens.push("02-search");

    // ── Search — with city filter ─────────────────────────────────────────────
    console.log("🔍  Search — Cebu City filter");
    await waitForApp(page, `${BASE_URL}/search?city=Cebu+City&listingType=sale`);
    await screenshot(page, "03-search-cebu-city");
    screens.push("03-search-cebu-city");

    // ── Map ───────────────────────────────────────────────────────────────────
    console.log("🗺️   Map screen");
    await waitForApp(page, `${BASE_URL}/map`);
    // Extra wait for map tiles to load
    await new Promise((r) => setTimeout(r, 3_000));
    await screenshot(page, "04-map");
    screens.push("04-map");

    // ── Property detail (first property) ─────────────────────────────────────
    if (properties[0]) {
      console.log(`🏡  Property detail — ${properties[0].property_type}`);
      await waitForApp(page, `${BASE_URL}/property/${properties[0].id}`);
      await screenshot(page, "05-property-detail");
      screens.push("05-property-detail");
    }

    // ── Property detail (second property, different type) ────────────────────
    if (properties[1]) {
      console.log(`🏡  Property detail — ${properties[1].property_type}`);
      await waitForApp(page, `${BASE_URL}/property/${properties[1].id}`);
      await screenshot(page, "06-property-detail-2");
      screens.push("06-property-detail-2");
    }

    // ── Saved screen ──────────────────────────────────────────────────────────
    console.log("❤️   Saved screen");
    await waitForApp(page, `${BASE_URL}/saved`);
    await screenshot(page, "07-saved");
    screens.push("07-saved");

    // ── Auth screen ───────────────────────────────────────────────────────────
    console.log("🔑  Auth screen");
    await waitForApp(page, `${BASE_URL}/auth`);
    await screenshot(page, "08-auth");
    screens.push("08-auth");

    // ── Profile ───────────────────────────────────────────────────────────────
    console.log("👤  Profile screen");
    await waitForApp(page, `${BASE_URL}/profile`);
    await screenshot(page, "09-profile");
    screens.push("09-profile");

    // ── Agent Dashboard ───────────────────────────────────────────────────────
    console.log("📋  Agent dashboard");
    await waitForApp(page, `${BASE_URL}/agent/dashboard`);
    await screenshot(page, "10-agent-dashboard");
    screens.push("10-agent-dashboard");

  } finally {
    await browser.close();
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────");
  console.log(`✅  ${screens.length} screenshots saved to: ${OUTPUT_DIR}/`);
  console.log("\nFiles:");
  for (const name of screens) {
    console.log(`  📄  screenshots/${name}.png`);
  }
  console.log(
    "\nTip: Re-run this script after BH-22 (real Supabase data) and BH-26 (Leaflet map) are merged for best results.",
  );
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  if (err.message.includes("ECONNREFUSED")) {
    console.error("    Is the dev server running? Try: npm run dev");
  }
  process.exit(1);
});
