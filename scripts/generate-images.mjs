/**
 * scripts/generate-images.mjs
 *
 * Generates realistic Cebu property photos using Gemini image generation.
 * Reads prompts from scripts/prompts.json (listings section).
 * Saves images to scripts/generated/ and writes a manifest.json.
 *
 * Usage:
 *   1. Add GEMINI_API_KEY to .env.local (get one free at aistudio.google.com)
 *   2. node scripts/generate-images.mjs
 *
 * Output: scripts/generated/{slug}-exterior.jpg, {slug}-living.jpg,
 *         {slug}-bedroom.jpg, {slug}-kitchen.jpg + manifest.json
 * Runtime: ~15–25 min for 76 images (rate-limited to avoid 429s)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "generated");
const PROMPTS_FILE = path.join(__dirname, "prompts.json");

// ─── Validate env ──────────────────────────────────────────────────────────────

if (!process.env.GEMINI_API_KEY) {
  console.error("❌  GEMINI_API_KEY is missing from .env.local");
  console.error("    Get a free key at https://aistudio.google.com/app/apikey");
  process.exit(1);
}

if (!fs.existsSync(PROMPTS_FILE)) {
  console.error(`❌  prompts.json not found at ${PROMPTS_FILE}`);
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Load prompts from JSON ────────────────────────────────────────────────────

const promptsData = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf-8"));
const LISTINGS = promptsData.listings;

// listings section: { [slug]: { exterior, living, bedroom, kitchen } }
const ANGLES = ["exterior", "living", "bedroom", "kitchen"];

// ─── Image generation ──────────────────────────────────────────────────────────

const MODEL_NAME = "gemini-2.5-flash-image";

async function generateImage(prompt, outputPath, retries = 3) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      });

      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

      if (!imagePart) {
        throw new Error("No image in response");
      }

      const raw = imagePart.inlineData.data;
      if (!raw || raw.length === 0) {
        throw new Error("Image data is empty (0 bytes from API)");
      }

      const buffer = Buffer.from(raw, "base64");
      if (buffer.length < 1024) {
        throw new Error(`Image suspiciously small (${buffer.length} bytes) — likely not a real image`);
      }

      fs.writeFileSync(outputPath, buffer);

      // Verify the file was actually written
      if (!fs.existsSync(outputPath)) {
        throw new Error("File disappeared immediately after writeFileSync!");
      }
      const writtenSize = fs.statSync(outputPath).size;
      if (writtenSize !== buffer.length) {
        throw new Error(`Size mismatch: wrote ${buffer.length} but file is ${writtenSize} bytes`);
      }

      return true;
    } catch (err) {
      const isLast = attempt === retries;
      const msg = err.message ?? String(err);

      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        const wait = attempt * 30_000; // 30s, 60s, 90s back-off
        console.warn(`    ⏳ Rate limited — waiting ${wait / 1000}s before retry ${attempt}/${retries}…`);
        await sleep(wait);
      } else if (isLast) {
        throw err;
      } else {
        console.warn(`    ⚠️  Attempt ${attempt} failed: ${msg} — retrying…`);
        await sleep(5_000);
      }
    }
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🏠  Bahay.ph — Gemini Image Generator (per-listing mode)\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const slugs = Object.keys(LISTINGS);
  const totalExpected = slugs.length * ANGLES.length;
  console.log(`📋  Listings loaded : ${slugs.length} from prompts.json`);
  console.log(`🖼️   Images to gen   : ${totalExpected} (${ANGLES.length} per listing)\n`);

  const manifest = {};
  let total = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    console.log(`\n📸  ${slug}`);
    const listing = LISTINGS[slug];

    for (const angle of ANGLES) {
      const prompt = listing[angle];
      if (!prompt) {
        console.log(`  ⚠️  No prompt for angle "${angle}" — skipping`);
        continue;
      }

      const filename = `${slug}-${angle}.jpg`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      // Skip if already generated (resume-friendly)
      if (fs.existsSync(outputPath)) {
        console.log(`  ⏭️  ${filename} — already exists, skipping`);
        manifest[filename] = { slug, angle, prompt, status: "skipped" };
        skipped++;
        continue;
      }

      process.stdout.write(`  ⚙️  Generating ${filename}…`);

      try {
        await generateImage(prompt, outputPath);
        process.stdout.write(" ✅\n");
        manifest[filename] = { slug, angle, prompt, status: "ok" };
        total++;
      } catch (err) {
        process.stdout.write(` ❌ ${err.message}\n`);
        manifest[filename] = { slug, angle, prompt, status: "error", error: err.message };
        failed++;
      }

      // Polite pause between requests (~8–10 img/min on paid tier)
      await sleep(7_000);
    }
  }

  // Write manifest
  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Final verification — are the files actually on disk?
  const filesOnDisk = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".jpg"));
  const totalSize = filesOnDisk.reduce((sum, f) => sum + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0);

  console.log("\n─────────────────────────────────────");
  console.log(`✅  Generated : ${total}`);
  console.log(`⏭️  Skipped   : ${skipped}`);
  console.log(`❌  Failed    : ${failed}`);
  console.log(`📁  On disk   : ${filesOnDisk.length} JPGs (${(totalSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`📄  Manifest  : ${manifestPath}`);

  if (filesOnDisk.length === 0 && total > 0) {
    console.error("\n⚠️  WARNING: Script reported success but no JPGs found on disk!");
    console.error("    Something on your system is deleting the files.");
    console.error("    Check antivirus / macOS security settings.");
    process.exit(1);
  }

  if (failed > 0) {
    console.warn(`\n⚠️  ${failed} image(s) failed. Re-run the script to retry — skipped files won't be regenerated.`);
  }

  console.log("\nNext step: node scripts/seed-database.mjs");
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  process.exit(1);
});
