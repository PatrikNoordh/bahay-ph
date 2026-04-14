/**
 * scripts/generate-images.mjs
 *
 * Generates realistic Cebu property photos using Gemini image generation.
 * Saves images to scripts/generated/ and writes a manifest.json.
 *
 * Usage:
 *   1. Add GEMINI_API_KEY to .env.local (get one free at aistudio.google.com)
 *   2. node scripts/generate-images.mjs
 *
 * Output: scripts/generated/{type}-{angle}-{n}.jpg + manifest.json
 * Runtime: ~10–20 min for full run (rate-limited to avoid 429s)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "generated");

// ─── Validate env ──────────────────────────────────────────────────────────────

if (!process.env.GEMINI_API_KEY) {
  console.error("❌  GEMINI_API_KEY is missing from .env.local");
  console.error("    Get a free key at https://aistudio.google.com/app/apikey");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Prompt definitions ────────────────────────────────────────────────────────

/**
 * Each property type gets:
 *   - exterior: 3 variants (primary image candidates)
 *   - interior: 3 angles × 1 variant each (living room, bedroom, kitchen/outdoor)
 *
 * Total: 5 types × 6 images = 30 generated files.
 * The seed script will assign 4 images per listing (1 exterior + 3 interiors),
 * reusing interior images across listings of the same type.
 */

const SUFFIX =
  "photorealistic, real estate listing photo, high resolution, natural lighting, no text overlays, no watermarks";

const PROMPTS = {
  house: {
    "exterior-1":
      `Exterior front view of a modern Filipino tropical house, white rendered walls, ` +
      `terracotta roof tiles, lush tropical garden, wooden front door, Cebu Philippines, ` +
      `golden hour afternoon lighting. ${SUFFIX}`,
    "exterior-2":
      `Side angle exterior of a contemporary Filipino family home, open lanai, ceiling fan, ` +
      `narra hardwood accents, manicured lawn, palm trees, Cebu Philippines, bright daylight. ${SUFFIX}`,
    "exterior-3":
      `Aerial view from slight elevation of a single-family house with private pool, ` +
      `tropical garden, Cebu Philippines residential neighbourhood, clear blue sky. ${SUFFIX}`,
    "interior-living":
      `Bright open-plan living room of a Filipino tropical home, rattan furniture, ` +
      `high ceiling with wooden beams, large windows overlooking garden, natural ventilation. ${SUFFIX}`,
    "interior-bedroom":
      `Master bedroom in a modern Filipino house, queen bed with white linens, ` +
      `air conditioning unit, wooden floor, sheer curtains with garden view, clean minimal decor. ${SUFFIX}`,
    "interior-kitchen":
      `Modern kitchen in a Filipino tropical house, white cabinets, granite countertop, ` +
      `open to dining area, indoor plants, natural light. ${SUFFIX}`,
  },

  condo: {
    "exterior-1":
      `Exterior of a modern condominium tower in Cebu City IT Park, glass facade, ` +
      `blue glass curtain wall, landscaped podium, night time with city lights. ${SUFFIX}`,
    "exterior-2":
      `Lobby entrance of a premium residential condominium Cebu City, marble floors, ` +
      `concierge desk, high ceilings, potted tropical plants, daytime. ${SUFFIX}`,
    "exterior-3":
      `Rooftop infinity pool and amenity deck of a high-rise condominium, ` +
      `city skyline and sea view Cebu Philippines, sunset. ${SUFFIX}`,
    "interior-living":
      `Modern condo living room Cebu City, city view through floor-to-ceiling windows, ` +
      `compact furniture, neutral tones, fully furnished, clean and bright. ${SUFFIX}`,
    "interior-bedroom":
      `Condo bedroom with city view, built-in wardrobe, air conditioning, ` +
      `double bed with white hotel-style linens, compact but well-designed. ${SUFFIX}`,
    "interior-kitchen":
      `Open kitchen in a Cebu condo unit, built-in appliances, breakfast bar, ` +
      `integrated refrigerator, white cabinets, compact and modern. ${SUFFIX}`,
  },

  lot: {
    "exterior-1":
      `Aerial drone photo of a cleared flat residential lot for sale Metro Cebu Philippines, ` +
      `corner lot, surrounding houses visible, bright daylight, property boundary markers. ${SUFFIX}`,
    "exterior-2":
      `Street-level view of a residential lot with concrete perimeter fence, ` +
      `Mandaue City Cebu Philippines, paved road in front, mature trees nearby, daytime. ${SUFFIX}`,
    "exterior-3":
      `Wide aerial view of a subdivision lot in Cebu Philippines, quiet neighbourhood, ` +
      `green surroundings, mountains in the background, clear sky. ${SUFFIX}`,
    "interior-living":
      `Surrounding neighbourhood of a lot for sale Cebu Philippines, well-maintained houses, ` +
      `wide road, trees lining the street, suburban feel, daytime. ${SUFFIX}`,
    "interior-bedroom":
      `Lot size marker and boundary posts on a cleared land parcel Cebu Philippines, ` +
      `flat terrain, neighbouring properties visible, sunny day. ${SUFFIX}`,
    "interior-kitchen":
      `Nearby amenities: mall, school, and church visible from a residential area ` +
      `Cebu Philippines, walkable neighbourhood, daytime aerial view. ${SUFFIX}`,
  },

  townhouse: {
    "exterior-1":
      `Row of modern Filipino townhouses, gated community Talisay Cebu, uniform facade, ` +
      `terracotta accents, covered garage, well-maintained landscaping, golden hour. ${SUFFIX}`,
    "exterior-2":
      `Front view single townhouse unit in a Cebu subdivision, 2-storey, ` +
      `painted white and beige, small garden, iron gate, daytime. ${SUFFIX}`,
    "exterior-3":
      `Aerial view of a Filipino townhouse development Cebu Philippines, ` +
      `new phase construction, landscaped common areas, perimeter wall, daylight. ${SUFFIX}`,
    "interior-living":
      `Townhouse living and dining area Cebu Philippines, open plan, tiled floor, ` +
      `staircase to second floor visible, natural light, modern furniture. ${SUFFIX}`,
    "interior-bedroom":
      `Second floor master bedroom Filipino townhouse, double bed, built-in closet, ` +
      `window overlooking subdivision, air conditioned, clean and bright. ${SUFFIX}`,
    "interior-kitchen":
      `Townhouse kitchen Cebu Philippines, granite countertop, overhead cabinets, ` +
      `small breakfast nook, tiled backsplash, natural light from window. ${SUFFIX}`,
  },

  commercial: {
    "exterior-1":
      `Ground-floor commercial shophouse unit Mandaue City Cebu, ` +
      `signage-ready facade, wide glass frontage, busy street, daytime. ${SUFFIX}`,
    "exterior-2":
      `Commercial building exterior Cebu Philippines, ground floor retail space, ` +
      `open frontage, parking area, main road frontage, midday lighting. ${SUFFIX}`,
    "exterior-3":
      `Mixed-use commercial strip Cebu City, occupied units with signage, ` +
      `active pedestrian street, daytime, tropical urban setting. ${SUFFIX}`,
    "interior-living":
      `Empty commercial retail space interior Cebu Philippines, polished concrete floor, ` +
      `high ceiling, large shopfront windows, ready for fit-out, daylight. ${SUFFIX}`,
    "interior-bedroom":
      `Open plan office or commercial space for lease Cebu Philippines, ` +
      `bare concrete ceiling, good natural light, column-free layout. ${SUFFIX}`,
    "interior-kitchen":
      `Back-of-house storage and utility area of a commercial unit Cebu Philippines, ` +
      `concrete walls, basic fittings, electrical panel, service entrance. ${SUFFIX}`,
  },
};

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
  console.log("🏠  Bahay.ph — Gemini Image Generator\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = {};
  const types = Object.keys(PROMPTS);
  let total = 0;
  let skipped = 0;
  let failed = 0;

  for (const type of types) {
    console.log(`\n📸  ${type.toUpperCase()}`);
    const angles = Object.keys(PROMPTS[type]);

    for (const angle of angles) {
      const filename = `${type}-${angle}.jpg`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      // Skip if already generated (resume-friendly)
      if (fs.existsSync(outputPath)) {
        console.log(`  ⏭️  ${filename} — already exists, skipping`);
        manifest[filename] = { prompt: PROMPTS[type][angle], status: "skipped" };
        skipped++;
        continue;
      }

      process.stdout.write(`  ⚙️  Generating ${filename}…`);

      try {
        await generateImage(PROMPTS[type][angle], outputPath);
        process.stdout.write(" ✅\n");
        manifest[filename] = { prompt: PROMPTS[type][angle], status: "ok" };
        total++;
      } catch (err) {
        process.stdout.write(` ❌ ${err.message}\n`);
        manifest[filename] = { prompt: PROMPTS[type][angle], status: "error", error: err.message };
        failed++;
      }

      // Polite pause between requests (free tier: ~10 img/min)
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

  console.log("\nNext step: node scripts/seed-database.mjs");
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  process.exit(1);
});
