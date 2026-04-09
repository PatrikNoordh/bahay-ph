CLAUDE.md — Bahay.ph
AI-Assisted Development Workflow
> This document defines how Claude Code should work in this repository.
> Claude Code works interactively with the developer — changes are reviewed in real time before committing.
***Project Overview
Bahay.ph is a Filipino real estate listing platform focused on the Cebu market.
Bahay means "home" in Filipino.
Mission: Be the trusted, verified property platform for Cebu — what Hemnet is to Sweden.
Starting focus: Cebu City, Cordova, Mandaue, Mactan, Lapu-Lapu City, Talisay City
Business model:
Buyers browse for free — always
Licensed brokers pay a monthly subscription to list properties
Only verified, licensed brokers can create listings — no random private sellers
Primary contact method: WhatsApp
***Tech Stack
Layer	Technology
Framework	Next.js 14+ (App Router)
Language	TypeScript (strict mode)
Styling	Tailwind CSS
Database	Supabase (PostgreSQL)
Auth	Supabase Auth
File storage	Supabase Storage (property photos)
Maps	Leaflet.js
Email	Resend
Deployment	Vercel
Version control	GitHub
Package manager	npm
***Design System
Single source of truth. Never hardcode colors outside these tokens.
--terra:        #C1440E   ← Primary — For Sale badges, CTAs
--terra-light:  #E07B3A   ← Warm accent
--terra-pale:   #FDF0E8   ← Hover backgrounds
--ocean:        #1A5FA8   ← For Rent badges
--green:        #1D9E75   ← New listing badges
--sand:         #F8F3EC   ← Page background
--sand-dark:    #EDE5D8   ← Dividers, hover
--narra:        #2C1A0E   ← Primary dark text
--muted:        #7A6A5E   ← Secondary text
--white:        #FFFFFF
Fonts: Playfair Display (headings) + DM Sans (body) via Google Fonts
Border radius: 14px cards, 20px hero, 12px buttons
Card shadow: 0 2px 16px rgba(44,26,14,0.08)
***App Structure
Screen	Route	Purpose
Home	`/`	Hero search, featured listings, area chips, listings grid
Search	`/search`	Filter pills, results grid
Map	`/map`	Leaflet map, price pins, card strip
Property Detail	`/property/[id]`	Full listing, agent card, WhatsApp CTA
Profile	`/profile`	Auth, saved listings, broker dashboard link
Agent Dashboard	`/agent/dashboard`	Broker listing management
***Database Schema
properties
id, created_at, title, description
price (₱), price_type (sale|rent), price_period (total|monthly)
property_type (house|condo|lot|townhouse|commercial)
bedrooms, bathrooms, floor_area, lot_size
address, city, barangay, latitude, longitude
status (active|sold|rented|inactive), is_featured
agent_id → agents.id
agents
id, created_at, full_name, phone, email
company_name, years_experience, avatar_url
is_verified (bool), subscription_tier (starter|pro|agency)
user_id → auth.users.id
property_images
id, property_id → properties.id
image_url, is_primary (bool), sort_order (int)
saved_properties
id, user_id → auth.users.id
property_id → properties.id, created_at
UNIQUE(user_id, property_id)
inquiries
id, created_at, property_id, agent_id
buyer_name, buyer_email, buyer_phone, message
status (new|read|replied)
***Folder Structure
bahay-ph/
├── app/
│   ├── page.tsx
│   ├── search/page.tsx
│   ├── map/page.tsx
│   ├── property/[id]/page.tsx
│   ├── profile/page.tsx
│   ├── agent/dashboard/page.tsx
│   └── api/
│       ├── listings/route.ts
│       ├── inquiries/route.ts
│       └── agents/route.ts
├── components/
│   ├── PropertyCard.tsx
│   ├── PropertyGrid.tsx
│   ├── SearchBar.tsx
│   ├── FilterTabs.tsx
│   ├── FilterPills.tsx
│   ├── BottomNav.tsx
│   ├── HeroSection.tsx
│   ├── AgentCard.tsx
│   └── MapView.tsx
├── lib/
│   ├── supabase.ts
│   ├── types.ts
│   └── utils.ts
├── hooks/
│   ├── useListings.ts
│   ├── useSavedProperties.ts
│   └── useAgent.ts
└── public/
    └── manifest.json
***Architecture Rules (STRICT)
Layer Flow
Page (Server Component) → fetches Supabase data directly
  → passes props to Client Components
  → Client Components handle interactivity and state
  → API routes (/app/api/*) handle mutations (POST, PATCH, DELETE)
Rules
Pages are Server Components by default — fetch Supabase data directly
Interactive components need 'use client' at top
Never fetch data inside a Client Component on initial load — pass as props
Use server Supabase client for Server Components and API routes
Use browser Supabase client for Client Components
Never expose service_role key client-side
RLS must be enabled on all tables
TypeScript strict mode — no any types
All DB types from lib/types.ts
Tailwind only — no inline styles except dynamic values
Mobile-first — base styles mobile, md: for larger screens
Max container: 420px mobile, fluid desktop
***How Claude Code Works Here
Read existing code before making changes
Show developer what will change before significant changes
Ask for clarification when task is ambiguous
Keep scope tight — only implement what is discussed
UI-only: use typed mock data + // TODO: connect to Supabase
Never add npm packages without explaining why and getting approval
Never touch .env.local or secrets
Never push or open PRs without explicit developer instruction
***Branch Naming
bahay/BH-<N>-short-description
Examples:
bahay/BH-01-project-setup
bahay/BH-07-property-detail
bahay/BH-10-agent-dashboard
***Commit Rules
All commits must start with [claude].
First commit on branch:
[claude] BH-<N> Title Case Description
Subsequent commits:
[claude] [<type>] imperative description
Types: feat fix style refactor chore docs perf test
Rules:
Imperative tense always
Under 72 characters
Never git add . or git add -A
Never --no-verify
***Pull Request Rules
Target branch is always main.
PR Title
[claude] BH-<N> Title Case Summary
PR Body Template (REQUIRED)
## BH-<N> Implementation Complete
Task: <Linear ticket URL>
### Summary
<One or two sentences.>
### What Was Done
1. **Database / Supabase** — <item or "Not touched">
2. **API Routes** — <item or "Not touched">
3. **Components** — <item or "Not touched">
4. **Pages** — <item or "Not touched">
### Acceptance Criteria Coverage
- [ ] AC1
- [ ] AC2
### Manual Test Steps
1.
2.
### Notes / Tradeoffs
- <Placeholders? TODOs? New packages? Schema changes?>
***Validation Commands
npm run lint      # Must pass — fix all errors before committing
npm run build     # Must succeed — no TypeScript errors
***Claude Code Restrictions
Must NOT:
Change Supabase RLS without explicit instruction
Add npm packages without approval
Hardcode API keys or secrets anywhere
Push or open PRs without explicit instruction
Take destructive actions without confirmation
Modify .env.local
Deploy to Vercel manually
***Environment Variables (.env.local — never committed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
***Pre-Merge Checklist
npm run lint passes
npm run build passes
Server/Client Component split correct
No hardcoded hex colors
No any types
Mobile layout tested at 375px
No secrets in code
RLS not changed without discussion
New packages approved
Commits follow [claude] format
PR template filled out
***Key Business Rules — Never Violate
Buyers never pay — no payment UI for buyers
Only verified brokers list — is_verified = true required
WhatsApp is primary contact — main CTA opens wa.me/ link
Philippine Peso only — ₱ with .toLocaleString('en-PH')
Cebu focus — default search is Metro Cebu
Quality over quantity — no unverified listings

