/**
 * scripts/seed-database.mjs
 *
 * Uploads generated images to Supabase Storage and seeds the database with
 * 3 agents and 20 realistic Cebu property listings.
 *
 * Usage:
 *   1. Run generate-images.mjs first (needs scripts/generated/*.jpg)
 *   2. node scripts/seed-database.mjs
 *
 * Safe to re-run — skips agents/properties that already exist by name/title.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS (no auth.users required).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, "generated");

// ─── Validate env ──────────────────────────────────────────────────────────────

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log(`🔍  Looking for images in: ${GENERATED_DIR}`);
const jpgFiles = fs.existsSync(GENERATED_DIR)
  ? fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".jpg"))
  : [];
console.log(`    Found ${jpgFiles.length} JPG(s): ${jpgFiles.slice(0, 3).join(", ")}${jpgFiles.length > 3 ? "…" : ""}`);

if (jpgFiles.length === 0) {
  console.error("❌  No generated images found in scripts/generated/");
  console.error("    Run node scripts/generate-images.mjs first");
  process.exit(1);
}

// Service role client — bypasses RLS, safe for seed scripts only
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = "property-images";

// ─── Storage helpers ───────────────────────────────────────────────────────────

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log(`  ✅  Created storage bucket: ${BUCKET}`);
  } else {
    console.log(`  ⏭️  Bucket already exists: ${BUCKET}`);
  }
}

async function uploadImage(localPath, storagePath) {
  // Check if already uploaded
  const { data: existing } = await supabase.storage.from(BUCKET).list(path.dirname(storagePath));
  const filename = path.basename(storagePath);
  if (existing?.some((f) => f.name === filename)) {
    return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: false });

  if (error && !error.message.includes("already exists")) {
    throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

// ─── Image URL map ─────────────────────────────────────────────────────────────
// Returns an array of { filename, localPath } for a property's images.
// Checks for per-listing slug-based images first ({slug}-exterior.jpg, etc.)
// Falls back to type-based images ({type}-exterior-1.jpg, etc.) if not found.

function getLocalImages(type, slug) {
  // Per-listing angles (new unique images)
  const slugAngles = ["exterior", "living", "bedroom", "kitchen"];
  const slugImages = slugAngles
    .map((angle) => {
      const filename = `${slug}-${angle}.jpg`;
      const localPath = path.join(GENERATED_DIR, filename);
      return fs.existsSync(localPath) ? { filename, localPath } : null;
    })
    .filter(Boolean);

  if (slugImages.length > 0) {
    return slugImages;
  }

  // Fallback: type-based images (old shared images)
  const typeAngles = ["exterior-1", "exterior-2", "exterior-3", "interior-living", "interior-bedroom", "interior-kitchen"];
  return typeAngles
    .map((angle) => {
      const filename = `${type}-${angle}.jpg`;
      const localPath = path.join(GENERATED_DIR, filename);
      return fs.existsSync(localPath) ? { filename, localPath } : null;
    })
    .filter(Boolean);
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    _key: "maria",
    full_name: "Maria Reyes",
    phone: "09171234567",
    email: "maria.reyes@cebugrandrealty.com",
    company_name: "Cebu Grand Realty",
    years_experience: 12,
    is_verified: true,
    subscription_tier: "pro",
    user_id: null,
    avatar_url: null,
  },
  {
    _key: "carlo",
    full_name: "Carlo Fernandez",
    phone: "09281234567",
    email: "carlo@islandproperties.ph",
    company_name: "Island Properties Cebu",
    years_experience: 7,
    is_verified: true,
    subscription_tier: "starter",
    user_id: null,
    avatar_url: null,
  },
  {
    _key: "jasmine",
    full_name: "Jasmine Uy",
    phone: "09351234567",
    email: "jasmine.uy@jupremiumrealty.com",
    company_name: "JU Premium Realty",
    years_experience: 15,
    is_verified: true,
    subscription_tier: "agency",
    user_id: null,
    avatar_url: null,
  },
];

// 20 properties — mix of cities, types, prices, sale/rent
// _agent: "maria" | "carlo" | "jasmine"
// _imageType: property_type used for image lookup
const PROPERTIES = [
  // ── Cebu City (8) ──────────────────────────────────────────────────────────
  {
    _slug: "it-park-condo-2br",
    title: "Modern 2BR Condo, Cebu IT Park",
    description:
      "Sleek 2-bedroom condo on a high floor in the IT Park district. City views, gym, pool, 24/7 security. Ideal for professionals or investors. Walking distance to restaurants and tech offices.",
    price: 4800000,
    price_type: "sale",
    price_period: "total",
    property_type: "condo",
    bedrooms: 2,
    bathrooms: 1,
    floor_area: 52,
    lot_size: null,
    address: "Unit 18F, One Pacific Place, Archbishop Reyes Ave",
    city: "Cebu City",
    barangay: "Apas",
    latitude: 10.3316,
    longitude: 123.9049,
    status: "active",
    is_featured: false,
    _agent: "maria",
  },
  {
    _slug: "lahug-studio-condo",
    title: "Studio for Rent, Lahug Cebu City",
    description:
      "Cosy furnished studio in the Lahug residential area. Includes aircon, ref, and washing machine. Walking distance to Capitol and Cebu Doctors' Hospital. Utilities excluded.",
    price: 15000,
    price_type: "rent",
    price_period: "monthly",
    property_type: "condo",
    bedrooms: 0,
    bathrooms: 1,
    floor_area: 24,
    lot_size: null,
    address: "Salinas Drive, Lahug",
    city: "Cebu City",
    barangay: "Lahug",
    latitude: 10.3388,
    longitude: 123.8978,
    status: "active",
    is_featured: false,
    _agent: "carlo",
  },
  {
    _slug: "banilad-family-home",
    title: "3BR Family Home, Banilad",
    description:
      "Spacious 3-bedroom house in the quiet, established neighbourhood of Banilad. Covered garage, tiled garden lanai, and maid's quarters. Near Ateneo de Cebu and top private schools.",
    price: 9500000,
    price_type: "sale",
    price_period: "total",
    property_type: "house",
    bedrooms: 3,
    bathrooms: 2,
    floor_area: 180,
    lot_size: 240,
    address: "Banilad Road",
    city: "Cebu City",
    barangay: "Banilad",
    latitude: 10.3527,
    longitude: 123.9002,
    status: "active",
    is_featured: false,
    _agent: "carlo",
  },
  {
    _slug: "ayala-condo-1br",
    title: "Furnished 1BR Condo, Cebu Ayala Area",
    description:
      "Fully furnished 1-bedroom unit near Ayala Center Cebu. Move-in ready with fast WiFi, modern appliances, and access to rooftop pool and gym. Perfect for expats and young professionals.",
    price: 22000,
    price_type: "rent",
    price_period: "monthly",
    property_type: "condo",
    bedrooms: 1,
    bathrooms: 1,
    floor_area: 38,
    lot_size: null,
    address: "Cardinal Rosales Ave, Cebu Business Park",
    city: "Cebu City",
    barangay: "Cebu Business Park",
    latitude: 10.3179,
    longitude: 123.9055,
    status: "active",
    is_featured: true,
    _agent: "carlo",
  },
  {
    _slug: "talamban-corner-lot",
    title: "Corner Lot, Talamban Cebu City",
    description:
      "Prime 220 sqm corner lot in fast-developing Talamban. Flat terrain, clean title, and all utilities at the boundary. Residential or light commercial use. Near University of San Carlos.",
    price: 5200000,
    price_type: "sale",
    price_period: "total",
    property_type: "lot",
    bedrooms: null,
    bathrooms: null,
    floor_area: null,
    lot_size: 220,
    address: "Talamban, Cebu City",
    city: "Cebu City",
    barangay: "Talamban",
    latitude: 10.3705,
    longitude: 123.9193,
    status: "active",
    is_featured: false,
    _agent: "maria",
  },
  {
    _slug: "beverly-hills-luxury-house",
    title: "4BR Luxury House, Beverly Hills Cebu",
    description:
      "Prestigious 4-bedroom residence in Beverly Hills Subdivision. Private swimming pool, landscaped garden, 3-car garage, and entertainment deck. One of Cebu City's most exclusive addresses.",
    price: 22000000,
    price_type: "sale",
    price_period: "total",
    property_type: "house",
    bedrooms: 4,
    bathrooms: 4,
    floor_area: 350,
    lot_size: 500,
    address: "Beverly Hills Subdivision, Busay",
    city: "Cebu City",
    barangay: "Busay",
    latitude: 10.3774,
    longitude: 123.8819,
    status: "active",
    is_featured: true,
    _agent: "jasmine",
  },
  {
    _slug: "it-park-studio-condo",
    title: "Studio Condo for Sale, IT Park Cebu",
    description:
      "Affordable studio unit in a well-maintained building inside Cebu IT Park. Balcony with city views, shared pool and gym. Great entry-level investment — high rental demand from BPO workers.",
    price: 2800000,
    price_type: "sale",
    price_period: "total",
    property_type: "condo",
    bedrooms: 0,
    bathrooms: 1,
    floor_area: 22,
    lot_size: null,
    address: "Cebu IT Park, Apas",
    city: "Cebu City",
    barangay: "Apas",
    latitude: 10.3321,
    longitude: 123.9062,
    status: "active",
    is_featured: false,
    _agent: "carlo",
  },
  {
    _slug: "colon-commercial-space",
    title: "Commercial Space for Rent, Colon Street",
    description:
      "Ground-floor commercial unit on Cebu's historic Colon Street. 80 sqm, column-free layout, wide glass frontage, high pedestrian and vehicle traffic. Suitable for retail, food, or office.",
    price: 85000,
    price_type: "rent",
    price_period: "monthly",
    property_type: "commercial",
    bedrooms: null,
    bathrooms: 1,
    floor_area: 80,
    lot_size: null,
    address: "Colon Street, Downtown",
    city: "Cebu City",
    barangay: "Downtown",
    latitude: 10.2951,
    longitude: 123.8997,
    status: "active",
    is_featured: false,
    _agent: "jasmine",
  },

  // ── Lapu-Lapu City / Mactan (4) ────────────────────────────────────────────
  {
    _slug: "punta-engano-beachfront-villa",
    title: "Beachfront Villa, Punta Engano Mactan",
    description:
      "Stunning beachfront villa with direct ocean access and private pool. Wake up to panoramic views of the Cebu Strait. Open-plan living, high ceilings, fully furnished — perfect for families or as a premium rental investment.",
    price: 18500000,
    price_type: "sale",
    price_period: "total",
    property_type: "house",
    bedrooms: 4,
    bathrooms: 3,
    floor_area: 280,
    lot_size: 450,
    address: "Punta Engano Road, Punta Engano",
    city: "Lapu-Lapu City",
    barangay: "Punta Engano",
    latitude: 10.2927,
    longitude: 124.0044,
    status: "active",
    is_featured: true,
    _agent: "maria",
  },
  {
    _slug: "mactan-newtown-condo-3br",
    title: "3BR Condo, Mactan Newtown",
    description:
      "Bright 3-bedroom unit in the premium Mactan Newtown township. Ocean-view units available. Resort-style amenities: beach club, pools, and dining. Minutes from Mactan-Cebu International Airport.",
    price: 6800000,
    price_type: "sale",
    price_period: "total",
    property_type: "condo",
    bedrooms: 3,
    bathrooms: 2,
    floor_area: 78,
    lot_size: null,
    address: "Mactan Newtown, Basak",
    city: "Lapu-Lapu City",
    barangay: "Basak",
    latitude: 10.3012,
    longitude: 123.9718,
    status: "active",
    is_featured: false,
    _agent: "maria",
  },
  {
    _slug: "mactan-airport-lot",
    title: "Residential Lot Near Mactan Airport",
    description:
      "Strategically located 300 sqm residential lot, 5 minutes from Mactan-Cebu International Airport. Flat terrain, concrete perimeter fence, clean title. High value for OFW families.",
    price: 4200000,
    price_type: "sale",
    price_period: "total",
    property_type: "lot",
    bedrooms: null,
    bathrooms: null,
    floor_area: null,
    lot_size: 300,
    address: "Airport Road, Pajac",
    city: "Lapu-Lapu City",
    barangay: "Pajac",
    latitude: 10.3073,
    longitude: 123.9799,
    status: "active",
    is_featured: false,
    _agent: "maria",
  },
  {
    _slug: "mactan-vacation-condo",
    title: "Vacation Condo for Rent, Mactan Island",
    description:
      "Fully furnished 1-bedroom condo with ocean view on Mactan Island. Beachfront resort amenities, pool, and water sports. Available short-term and long-term. Great for expats and vacationers.",
    price: 35000,
    price_type: "rent",
    price_period: "monthly",
    property_type: "condo",
    bedrooms: 1,
    bathrooms: 1,
    floor_area: 45,
    lot_size: null,
    address: "Maribago, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    barangay: "Maribago",
    latitude: 10.2821,
    longitude: 124.0012,
    status: "active",
    is_featured: false,
    _agent: "carlo",
  },

  // ── Mandaue City (3) ───────────────────────────────────────────────────────
  {
    _slug: "bakilid-corner-lot",
    title: "Corner Lot, Bakilid Mandaue City",
    description:
      "Prime corner lot in a fast-developing residential area of Mandaue City. Flat terrain, ready for construction. Close to major roads, malls, and schools. Clean title, all utilities available.",
    price: 3800000,
    price_type: "sale",
    price_period: "total",
    property_type: "lot",
    bedrooms: null,
    bathrooms: null,
    floor_area: null,
    lot_size: 200,
    address: "Bakilid, Mandaue City",
    city: "Mandaue City",
    barangay: "Bakilid",
    latitude: 10.3595,
    longitude: 123.948,
    status: "active",
    is_featured: false,
    _agent: "carlo",
  },
  {
    _slug: "north-reclamation-townhouse",
    title: "2-Storey Townhouse, North Reclamation",
    description:
      "Brand new 3-bedroom townhouse in a secure Mandaue City development. Modern design, 2 parking slots, and a small backyard. Minutes from SM City Cebu and North Reclamation Area.",
    price: 5900000,
    price_type: "sale",
    price_period: "total",
    property_type: "townhouse",
    bedrooms: 3,
    bathrooms: 2,
    floor_area: 115,
    lot_size: 75,
    address: "North Reclamation Area, Mandaue City",
    city: "Mandaue City",
    barangay: "North Reclamation",
    latitude: 10.3515,
    longitude: 123.9312,
    status: "active",
    is_featured: false,
    _agent: "jasmine",
  },
  {
    _slug: "mandaue-warehouse-office",
    title: "Warehouse & Office for Rent, Mandaue",
    description:
      "Semi-industrial warehouse with mezzanine office, 400 sqm. High ceiling, roller door, 3-phase power. In a light industrial zone near the main highway. Ideal for logistics, manufacturing, or cold storage.",
    price: 120000,
    price_type: "rent",
    price_period: "monthly",
    property_type: "commercial",
    bedrooms: null,
    bathrooms: 2,
    floor_area: 400,
    lot_size: null,
    address: "National Highway, Tipolo",
    city: "Mandaue City",
    barangay: "Tipolo",
    latitude: 10.3641,
    longitude: 123.9488,
    status: "active",
    is_featured: false,
    _agent: "jasmine",
  },

  // ── Talisay City (2) ───────────────────────────────────────────────────────
  {
    _slug: "talisay-townhouse-3br",
    title: "3BR Townhouse, San Isidro Talisay City",
    description:
      "Newly built 3-bedroom townhouse in a quiet, secure subdivision in Talisay City. Modern design, covered parking, private backyard. Minutes from the South Road Properties expressway.",
    price: 6200000,
    price_type: "sale",
    price_period: "total",
    property_type: "townhouse",
    bedrooms: 3,
    bathrooms: 2,
    floor_area: 110,
    lot_size: 80,
    address: "San Isidro Village, San Isidro",
    city: "Talisay City",
    barangay: "San Isidro",
    latitude: 10.2449,
    longitude: 123.8418,
    status: "active",
    is_featured: true,
    _agent: "maria",
  },
  {
    _slug: "bulacao-house-2br",
    title: "2BR House, Bulacao Talisay City",
    description:
      "Affordable 2-bedroom bungalow on a 150 sqm lot in Bulacao. Tiled throughout, with a garden, storage room, and covered carport. Near South Bus Terminal and South Road Properties.",
    price: 4500000,
    price_type: "sale",
    price_period: "total",
    property_type: "house",
    bedrooms: 2,
    bathrooms: 1,
    floor_area: 85,
    lot_size: 150,
    address: "Bulacao, Talisay City",
    city: "Talisay City",
    barangay: "Bulacao",
    latitude: 10.2619,
    longitude: 123.8498,
    status: "active",
    is_featured: false,
    _agent: "jasmine",
  },

  // ── Cordova (2) ────────────────────────────────────────────────────────────
  {
    _slug: "cordova-tropical-house",
    title: "Modern Tropical House, Pilipog Cordova",
    description:
      "Brand new 3-bedroom modern tropical home in the heart of Cordova. Open-concept design, natural ventilation, native wood accents, spacious lanai. Walking distance to local markets and the beach.",
    price: 8500000,
    price_type: "sale",
    price_period: "total",
    property_type: "house",
    bedrooms: 3,
    bathrooms: 2,
    floor_area: 150,
    lot_size: 200,
    address: "Pilipog, Cordova",
    city: "Cordova",
    barangay: "Pilipog",
    latitude: 10.2456,
    longitude: 123.9587,
    status: "active",
    is_featured: false,
    _agent: "carlo",
  },
  {
    _slug: "lapu-lapu-seaview-condo",
    title: "2BR Condo with Sea View, Lapu-Lapu",
    description:
      "Sea-view 2-bedroom condo in a mid-rise development near Cordova-Lapu-Lapu boundary. Watch ferries cross the channel from your balcony. Good investment with high rental yield potential.",
    price: 5100000,
    price_type: "sale",
    price_period: "total",
    property_type: "condo",
    bedrooms: 2,
    bathrooms: 1,
    floor_area: 58,
    lot_size: null,
    address: "Gabi, Cordova",
    city: "Cordova",
    barangay: "Gabi",
    latitude: 10.2551,
    longitude: 123.9668,
    status: "active",
    is_featured: false,
    _agent: "jasmine",
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Bahay.ph — Database Seeder\n");

  // 1. Ensure storage bucket exists
  console.log("📦  Checking storage bucket…");
  await ensureBucket();

  // 2. Upload images — build URL map keyed by filename
  console.log("\n📸  Uploading images to Supabase Storage…");
  const jpgFiles = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".jpg"));
  const imageUrlMap = {};

  for (const filename of jpgFiles) {
    process.stdout.write(`  ⚙️  ${filename}…`);
    try {
      const localPath = path.join(GENERATED_DIR, filename);
      const url = await uploadImage(localPath, `seed/${filename}`);
      imageUrlMap[filename] = url;
      process.stdout.write(" ✅\n");
    } catch (err) {
      process.stdout.write(` ❌ ${err.message}\n`);
    }
  }

  // 3. Insert agents (skip if full_name already exists)
  console.log("\n👤  Seeding agents…");
  const agentIdMap = {};

  for (const agentData of AGENTS) {
    const { _key, ...agent } = agentData;

    const { data: existing } = await supabase
      .from("agents")
      .select("id")
      .eq("full_name", agent.full_name)
      .maybeSingle();

    if (existing) {
      agentIdMap[_key] = existing.id;
      console.log(`  ⏭️  ${agent.full_name} — already exists (${existing.id})`);
      continue;
    }

    const { data, error } = await supabase.from("agents").insert(agent).select("id").single();

    if (error) {
      console.error(`  ❌  Failed to insert ${agent.full_name}: ${error.message}`);
      continue;
    }

    agentIdMap[_key] = data.id;
    console.log(`  ✅  ${agent.full_name} — inserted (${data.id})`);
  }

  // 4. Insert properties + property_images
  console.log("\n🏠  Seeding properties…");
  let insertedCount = 0;
  let skippedCount = 0;

  for (const propData of PROPERTIES) {
    const { _agent, _slug, ...property } = propData;

    // Check if property already exists
    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("title", property.title)
      .maybeSingle();

    let propertyId;

    if (existing) {
      propertyId = existing.id;

      // Check if slug-based images are available on disk
      const localImages = getLocalImages(property.property_type, _slug);
      const hasSlugImages = localImages.length > 0 && localImages[0].filename.startsWith(_slug);

      if (!hasSlugImages) {
        // No new images ready — nothing to update
        console.log(`  ⏭️  "${property.title}" — already exists, no new images to apply`);
        skippedCount++;
        continue;
      }

      // New slug images are ready — replace old property_images rows
      const { error: delError } = await supabase
        .from("property_images")
        .delete()
        .eq("property_id", propertyId);

      if (delError) {
        console.warn(`  ⚠️  "${property.title}" — could not clear old images: ${delError.message}`);
        skippedCount++;
        continue;
      }

      const imageRows = localImages.map(({ filename }, idx) => ({
        property_id: propertyId,
        image_url: imageUrlMap[filename] ?? null,
        is_primary: idx === 0,
        sort_order: idx,
      }));

      const { error: imgError } = await supabase.from("property_images").insert(imageRows);
      if (imgError) {
        console.warn(`  ⚠️  "${property.title}" images failed: ${imgError.message}`);
      }

      console.log(`  🔄  "${property.title}" — images refreshed with ${imageRows.length} slug image(s)`);
      insertedCount++;
      continue;
    }

    // Property does not exist yet — insert it
    const agent_id = agentIdMap[_agent] ?? null;
    const { data: inserted, error } = await supabase
      .from("properties")
      .insert({ ...property, agent_id })
      .select("id")
      .single();

    if (error) {
      console.error(`  ❌  "${property.title}": ${error.message}`);
      continue;
    }

    propertyId = inserted.id;

    // Build image rows — per-listing slug images first, fallback to type-based
    const localImages = getLocalImages(property.property_type, _slug);

    if (localImages.length === 0) {
      console.log(`  ✅  "${property.title}" inserted — no images available`);
      insertedCount++;
      continue;
    }

    const imageRows = localImages.map(({ filename }, idx) => ({
      property_id: propertyId,
      image_url: imageUrlMap[filename] ?? null,
      is_primary: idx === 0,
      sort_order: idx,
    }));

    const { error: imgError } = await supabase.from("property_images").insert(imageRows);
    if (imgError) {
      console.warn(`  ⚠️  "${property.title}" images failed: ${imgError.message}`);
    }

    const imageSource = localImages[0].filename.startsWith(_slug) ? "slug" : "type-fallback";
    console.log(`  ✅  "${property.title}" — inserted with ${imageRows.length} image(s) [${imageSource}]`);
    insertedCount++;
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────");
  console.log(`✅  Properties inserted : ${insertedCount}`);
  console.log(`⏭️  Properties skipped  : ${skippedCount}`);
  console.log(`👤  Agents ready        : ${Object.keys(agentIdMap).length}`);
  console.log(`📸  Images uploaded     : ${Object.keys(imageUrlMap).length}`);
  console.log("\nNext step: start the dev server, then run node scripts/take-screenshots.mjs");
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  process.exit(1);
});
