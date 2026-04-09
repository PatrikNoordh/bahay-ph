# Bahay.ph — Ticket Templates

Use these templates when creating tickets in Linear.
Ticket IDs use the `BH-` prefix. Team: **Bahay**. Project: **Bahay.ph**.

---

## Terminology

| Word | Use it when |
|------|-------------|
| `ticket` | Any unit of work (not "issue" or "task") |
| `feature` | New user-facing screen, component, or flow |
| `bug` | Something broken or behaving incorrectly |
| `chore` | Technical work, no direct user-visible change |
| `spike` | Time-boxed investigation with a written output |

---

## Bahay.ph Modules

Every ticket must reference one module:

| Module | What it covers |
|--------|---------------|
| `home` | Hero, search bar, featured listings, area chips, new listings grid, filter tabs |
| `search` | Search input, filter pills, results grid, results count |
| `map` | Leaflet map, price pins, bottom card strip |
| `detail` | Property detail page, specs, description, features, agent card, WhatsApp CTA |
| `profile` | Sign in/up, saved properties, user account |
| `agent-dashboard` | Broker listing management, add/edit/delete, lead inbox |
| `auth` | Supabase auth, session management, protected routes |
| `db` | Supabase schema, RLS policies, migrations, seed data |
| `infra` | Vercel, environment variables, deployment, PWA |
| `shared` | Reusable components (PropertyCard, BottomNav, Badge, etc.) |

---

## Feature Ticket Template

```markdown
### Context
<Why does this feature exist? What user problem does it solve?>

### Acceptance Criteria
- [ ] AC1: <Specific, testable outcome>
- [ ] AC2: <Specific, testable outcome>
- [ ] AC3: <Specific, testable outcome>

### Scope Boundary
In scope:
- <What is included>

Out of scope:
- <What is explicitly not included>

### Design Reference
- Follows Bahay.ph design system: #C1440E terra, #F8F3EC sand, DM Sans + Playfair Display
- Screen: <Home / Search / Map / Detail / Profile / Agent Dashboard>
- Mobile-first, 420px max container

### Technical Notes
- Module: <module>
- Layer: <UI only / Full stack / DB only>
- Data source: <Mock data + TODO markers / Supabase direct / API route>
- New Supabase table/column: <Yes — describe / No>
- New npm package: <Yes — name and reason / No>
- Dependencies: <BH-XX or "none">

### Edge Cases
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Mobile at 375px
- [ ] <Feature-specific edge case>
```

---

## Bug Ticket Template

```markdown
### What Happens
<Actual behaviour>

### What Should Happen
<Expected behaviour>

### Steps to Reproduce
1. <Step 1>
2. <Step 2>
3. <Step 3>

### Environment
- Device: <e.g. Samsung Galaxy A series, iPhone SE>
- Browser: <e.g. Chrome Android, Safari iOS>
- Route: <e.g. /property/123>

### Logs / Screenshots
<Console errors or "Not yet captured">

### Related Tickets
<BH-XX or "none">
```

---

## Chore Ticket Template

```markdown
### Context
<Why is this work needed? What does it enable?>

### Done When
- [ ] <Concrete, verifiable outcome>
- [ ] <Concrete, verifiable outcome>

### Technical Notes
- <Details, constraints, docs links>
- Touches Supabase RLS: <Yes / No>
- New npm packages: <Yes — name and reason / No>
```

---

## Spike Ticket Template

```markdown
### Question to Answer
<Specific question this spike must resolve>

### Time Box
<e.g. 2 hours>

### Output
- [ ] Written findings as comment on this ticket
- [ ] Recommendation with pros/cons
- [ ] Follow-up tickets created
```

---

## Phase 1 MVP Backlog

| ID | Title | Type | Module | Priority |
|----|-------|------|--------|----------|
| BH-01 | Set up Next.js project with TypeScript, Tailwind, Supabase | chore | infra | High |
| BH-02 | Create Supabase database schema | chore | db | High |
| BH-03 | Build PropertyCard component | feature | shared | High |
| BH-04 | Build Home screen | feature | home | High |
| BH-05 | Build BottomNav and routing | feature | shared | High |
| BH-06 | Build Search screen | feature | search | High |
| BH-07 | Build Property Detail page | feature | detail | High |
| BH-08 | Build Map screen with Leaflet | feature | map | Medium |
| BH-09 | Implement Supabase Auth | feature | auth | Medium |
| BH-10 | Build Agent Dashboard | feature | agent-dashboard | Medium |
| BH-11 | Agent photo upload via Supabase Storage | feature | agent-dashboard | Medium |
| BH-12 | Build Saved Properties screen | feature | profile | Medium |
| BH-13 | Set up Vercel deployment with GitHub auto-deploy | chore | infra | High |
| BH-14 | Configure Supabase RLS policies | chore | db | High |
| BH-15 | Add PWA manifest | chore | infra | Low |

---

## Quality Check

Good ticket:
- Clear imperative title with BH-N prefix
- Measurable acceptance criteria
- Module and layer specified
- Notes if Supabase schema changes needed
- Mobile edge cases listed
- Someone new to the project could build it and know when it's done

Bad ticket:
- "Make the search better"
- No acceptance criteria
- No module tag
- No mobile consideration
