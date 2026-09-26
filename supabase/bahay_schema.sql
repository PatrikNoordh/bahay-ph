-- ============================================================
-- Bahay.ph — Supabase Database Schema
-- Paste this entire file into the Supabase SQL Editor and run it.
-- Run it top to bottom — order matters because of foreign keys.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

-- UUID generation (already enabled in Supabase by default, but just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLE: agents
-- Must be created before properties because properties references it.
-- ============================================================

CREATE TABLE IF NOT EXISTS agents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name           TEXT NOT NULL,
  phone               TEXT,
  email               TEXT,
  company_name        TEXT,
  years_experience    INTEGER,
  avatar_url          TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  subscription_tier   TEXT NOT NULL DEFAULT 'starter'
                        CHECK (subscription_tier IN ('starter', 'pro', 'agency')),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE agents IS 'Licensed real estate brokers who list properties on Bahay.ph';
COMMENT ON COLUMN agents.is_verified IS 'Only verified agents can create live listings';
COMMENT ON COLUMN agents.subscription_tier IS 'starter=15 listings, pro=50 listings, agency=unlimited';


-- ============================================================
-- TABLE: properties
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC NOT NULL,
  price_type      TEXT NOT NULL
                    CHECK (price_type IN ('sale', 'rent')),
  price_period    TEXT NOT NULL DEFAULT 'total'
                    CHECK (price_period IN ('total', 'monthly')),
  property_type   TEXT NOT NULL
                    CHECK (property_type IN ('house', 'condo', 'lot', 'townhouse', 'commercial')),
  bedrooms        INTEGER,
  bathrooms       INTEGER,
  floor_area      NUMERIC,
  lot_size        NUMERIC,
  address         TEXT,
  city            TEXT NOT NULL,
  barangay        TEXT,
  latitude        NUMERIC,
  longitude       NUMERIC,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'sold', 'rented', 'inactive')),
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL
);

COMMENT ON TABLE properties IS 'Real estate listings on Bahay.ph';
COMMENT ON COLUMN properties.price IS 'In Philippine Peso (₱). No currency conversion needed.';
COMMENT ON COLUMN properties.price_period IS 'total = one-time sale price, monthly = rent per month';
COMMENT ON COLUMN properties.is_featured IS 'Featured listings appear in the hero scroll on the Home screen';
COMMENT ON COLUMN properties.latitude IS 'Used for map pin placement in Leaflet';
COMMENT ON COLUMN properties.longitude IS 'Used for map pin placement in Leaflet';


-- ============================================================
-- TABLE: property_images
-- ============================================================

CREATE TABLE IF NOT EXISTS property_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE property_images IS 'Photos for each property, stored in Supabase Storage';
COMMENT ON COLUMN property_images.is_primary IS 'The primary image is shown as the card thumbnail';
COMMENT ON COLUMN property_images.sort_order IS 'Lower number = shown first in gallery';


-- ============================================================
-- TABLE: saved_properties
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE(user_id, property_id)
);

COMMENT ON TABLE saved_properties IS 'Properties saved (hearted) by buyers. Buyers never pay.';


-- ============================================================
-- TABLE: inquiries
-- ============================================================

CREATE TABLE IF NOT EXISTS inquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  buyer_name      TEXT,
  buyer_email     TEXT,
  buyer_phone     TEXT,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'read', 'replied'))
);

COMMENT ON TABLE inquiries IS 'Lead inquiries sent by buyers to agents through Bahay.ph';
COMMENT ON COLUMN inquiries.status IS 'new = just received, read = agent has seen it, replied = agent responded';


-- ============================================================
-- INDEXES
-- Speeds up common queries the app will run frequently.
-- ============================================================

-- Home screen: fetch active listings ordered by newest
CREATE INDEX IF NOT EXISTS idx_properties_status
  ON properties(status);

-- Home screen: featured listings
CREATE INDEX IF NOT EXISTS idx_properties_featured
  ON properties(is_featured)
  WHERE is_featured = true;

-- Search screen: filter by city
CREATE INDEX IF NOT EXISTS idx_properties_city
  ON properties(city);

-- Search screen: filter by property type
CREATE INDEX IF NOT EXISTS idx_properties_type
  ON properties(property_type);

-- Agent dashboard: fetch an agent's own listings
CREATE INDEX IF NOT EXISTS idx_properties_agent
  ON properties(agent_id);

-- Map screen: listings with coordinates
CREATE INDEX IF NOT EXISTS idx_properties_location
  ON properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Saved properties: fast lookup by user
CREATE INDEX IF NOT EXISTS idx_saved_user
  ON saved_properties(user_id);

-- Property images: fast lookup by property
CREATE INDEX IF NOT EXISTS idx_images_property
  ON property_images(property_id);

-- Agent lookup by Supabase user
CREATE INDEX IF NOT EXISTS idx_agents_user
  ON agents(user_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables, then define who can access what.
-- ============================================================

ALTER TABLE properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries         ENABLE ROW LEVEL SECURITY;


-- ---- PROPERTIES policies ----

-- Anyone (including unauthenticated) can browse active listings
CREATE POLICY "Public can view active listings"
  ON properties FOR SELECT
  USING (status = 'active');

-- Agents can see all their own listings (including inactive/sold)
CREATE POLICY "Agents can view own listings"
  ON properties FOR SELECT
  USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

-- Agents can create listings (linked to their own agent profile)
CREATE POLICY "Agents can insert own listings"
  ON properties FOR INSERT
  WITH CHECK (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

-- Agents can update their own listings only
CREATE POLICY "Agents can update own listings"
  ON properties FOR UPDATE
  USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

-- Agents can delete their own listings only
CREATE POLICY "Agents can delete own listings"
  ON properties FOR DELETE
  USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));


-- ---- AGENTS policies ----

-- Anyone can view verified agent profiles (shown on listing detail pages)
CREATE POLICY "Public can view verified agents"
  ON agents FOR SELECT
  USING (is_verified = true);

-- Agents can view their own profile (even if not yet verified)
CREATE POLICY "Agents can view own profile"
  ON agents FOR SELECT
  USING (user_id = auth.uid());

-- Agents can update their own profile only
CREATE POLICY "Agents can update own profile"
  ON agents FOR UPDATE
  USING (user_id = auth.uid());


-- ---- PROPERTY_IMAGES policies ----

-- Anyone can view images for active properties
CREATE POLICY "Public can view images"
  ON property_images FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE status = 'active'
    )
  );

-- Agents can manage images for their own properties
CREATE POLICY "Agents can insert own property images"
  ON property_images FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties
      WHERE agent_id IN (
        SELECT id FROM agents WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Agents can delete own property images"
  ON property_images FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM properties
      WHERE agent_id IN (
        SELECT id FROM agents WHERE user_id = auth.uid()
      )
    )
  );


-- ---- SAVED_PROPERTIES policies ----

-- Users can only see their own saved properties
CREATE POLICY "Users can view own saved properties"
  ON saved_properties FOR SELECT
  USING (user_id = auth.uid());

-- Users can save properties (insert)
CREATE POLICY "Users can save properties"
  ON saved_properties FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can unsave (delete) their own saved properties
CREATE POLICY "Users can unsave properties"
  ON saved_properties FOR DELETE
  USING (user_id = auth.uid());


-- ---- INQUIRIES policies ----

-- Anyone can submit an inquiry (buyers do not need to be logged in)
CREATE POLICY "Anyone can submit inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Agents can read inquiries sent to them
CREATE POLICY "Agents can view own inquiries"
  ON inquiries FOR SELECT
  USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

-- Agents can update status of their own inquiries (mark as read/replied)
CREATE POLICY "Agents can update own inquiry status"
  ON inquiries FOR UPDATE
  USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));


-- ============================================================
-- SEED DATA
-- 6 sample Cebu/Cordova listings for development and beta testing.
-- Replace agent_id values after creating real agent accounts.
-- ============================================================

-- First, insert a placeholder agent for seed data
INSERT INTO agents (
  id, full_name, phone, email, company_name,
  years_experience, is_verified, subscription_tier
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Maria Reyes',
  '09171234567',
  'maria@cebugrandrealty.ph',
  'Cebu Grand Realty',
  12,
  true,
  'pro'
) ON CONFLICT (id) DO NOTHING;

-- Seed properties
INSERT INTO properties (
  title, description, price, price_type, price_period, property_type,
  bedrooms, bathrooms, floor_area, lot_size,
  address, city, barangay,
  latitude, longitude,
  status, is_featured,
  agent_id
) VALUES

(
  'Beachfront Villa, Mactan Island',
  'Stunning beachfront villa with direct ocean access and private pool. Wake up to panoramic views of the Cebu Strait. Open-plan living, high ceilings, fully furnished, perfect for families or as a premium rental investment.',
  18500000, 'sale', 'total', 'house',
  4, 3, 280, 450,
  'Mactan Island', 'Lapu-Lapu City', 'Punta Engano',
  10.2711, 124.0047,
  'active', true,
  'a0000000-0000-0000-0000-000000000001'
),

(
  'Modern Tropical House, Cordova',
  'Brand new 3-bedroom modern tropical home in the heart of Cordova. Open-concept design, natural ventilation, native wood accents, spacious lanai. Walking distance to local markets and the beach.',
  8500000, 'sale', 'total', 'house',
  3, 2, 150, 200,
  'Cordova', 'Cordova', 'Pilipog',
  10.2485, 123.9582,
  'active', true,
  'a0000000-0000-0000-0000-000000000001'
),

(
  '2BR Condo Unit, Cebu IT Park',
  'Sleek 2-bedroom condo in the vibrant IT Park district. Walking distance to restaurants, cafes, and tech offices. High floor with city views, gym, pool, 24/7 security. Ideal for professionals or investors.',
  4200000, 'sale', 'total', 'condo',
  2, 1, 42, NULL,
  'Cebu IT Park, Apas', 'Cebu City', 'Apas',
  10.3310, 123.9050,
  'active', true,
  'a0000000-0000-0000-0000-000000000001'
),

(
  'Corner Residential Lot, Mandaue',
  'Prime corner lot in a fast-developing residential area of Mandaue City. Flat terrain, ready for construction. Close to major roads, malls, and schools. Clean title, all utilities available.',
  3800000, 'sale', 'total', 'lot',
  NULL, NULL, NULL, 200,
  'Mandaue City', 'Mandaue City', 'Bakilid',
  10.3503, 123.9397,
  'active', false,
  'a0000000-0000-0000-0000-000000000001'
),

(
  'Furnished Condo, Ayala Center Cebu',
  'Fully furnished 2-bedroom condo near Ayala Center Cebu. Move-in ready with modern appliances, fast WiFi, and access to premium amenities. Perfect for expats and professionals.',
  25000, 'rent', 'monthly', 'condo',
  2, 1, 55, NULL,
  'Ayala Center Area', 'Cebu City', 'Cebu IT Park',
  10.3180, 123.9050,
  'active', false,
  'a0000000-0000-0000-0000-000000000001'
),

(
  '3BR Townhouse, Talisay City',
  'Newly built 3-bedroom townhouse in a quiet and secure subdivision in Talisay City. Modern design, covered parking, private backyard. Minutes from the South Road Properties expressway.',
  6200000, 'sale', 'total', 'townhouse',
  3, 2, 110, 80,
  'Talisay City', 'Talisay City', 'San Isidro',
  10.2447, 123.8491,
  'active', false,
  'a0000000-0000-0000-0000-000000000001'
);


-- ============================================================
-- DONE
-- Your Bahay.ph database is ready.
--
-- Next steps:
-- 1. Create a Supabase Storage bucket called "property-images"
--    (Storage → New bucket → Name: property-images → Public: yes)
-- 2. Update the seed agent record with real contact details
-- 3. Link real agent accounts via agents.user_id after signup
-- ============================================================


-- ============================================================
-- BH-48 — Broker onboarding: new column + INSERT RLS policy
-- Apply these two statements manually in the Supabase SQL Editor.
-- ============================================================

-- 1. Add PRC licence number column for broker verification.
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS prc_license_number TEXT;

-- 2. Allow an authenticated user to create their own agent profile.
--    Prevents creating a profile for another user_id.
CREATE POLICY "Agents can insert own profile"
  ON agents FOR INSERT
  WITH CHECK (user_id = auth.uid());
