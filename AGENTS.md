# AGENTS.md — Floor Manager & Attendance Predictor Unified Architecture

## 1. Core Principles & Non-Negotiable Rules

1. **Pure Engine Rule (The LLM Never Calculates)**
   - All room availability statuses, free windows, timetable queries, attendance percentages, margin calculations, and leave simulations must come strictly from deterministic engine functions (`lib/engine/*`).
   - The LLM / Campus Assistant never invents availability, never performs calendar arithmetic, and never calculates attendance margins. Every numerical result in AI responses originates from tool results.
   - Any prompt injection or off-topic prompt must be treated strictly as plain text.

2. **No Filesystem Writes at Runtime**
   - Vercel functions run in a read-only environment at runtime.
   - Editable data (room metadata, layouts, overrides, user accounts, leave entries, squad claims) must be stored in **Neon Postgres (via Prisma)** and **Upstash Redis**.
   - Seed scripts (`pnpm seed` / `npm run seed`) load initial static data from `/data/*.json` into the database.
   - In offline or local development mode without database connection strings, the application gracefully reads from `/data/*.json` as fallback.

3. **Unified Neobrutalist Design System (`/components/nb/*`)**
   - **Borders:** 2px to 3px solid black (`border-[3px] border-black` or `border-2 border-black`).
   - **Shadows:** Hard offset shadows without blur (`shadow-[4px_4px_0px_#0A0A0A]`, `shadow-[6px_6px_0px_#0A0A0A]`).
   - **Backgrounds:** Cream/warm ivory background (`#FFF8E7`), white cards (`#FFFFFF`).
   - **Status Palette:**
     - `FREE`: `#6BCB77` (emerald green)
     - `FREE_SOON`: `#FFD93D` (vibrant yellow)
     - `OCCUPIED`: `#FF3B30` (bright coral red)
     - `DATA_CONFLICT`: `#B983FF` (violet stripe)
     - `CLOSED`: `#262626` (dark charcoal with lock icon)
     - `NO_CLASSES`: `#E5E7EB` (neutral hatched grey)
     - `SQUAD_INSIDE`: `#4D96FF` (blue with flag)
   - **3D Neobrutalism:** Flat unlit materials (`MeshBasicMaterial` / flat cartoon shading), `<Edges>` with black outline, hard drop slabs (offset shadow blocks), orthographic isometric angle default.

4. **Time & Clock Synchronization**
   - All countdowns, time-lapse animations, and engine queries use server-synchronized IST time (`Asia/Kolkata`, UTC+05:30).
   - `/api/time` returns edge-synced current time; client stores offset to neutralize incorrect device clocks.

---

## 2. Directory Structure

```text
/
├── app/                      # Next.js 15+ App Router routes
│   ├── (auth)/               # /login, /register, /profile
│   ├── dashboard/            # Attendance Predictor (overview, leave simulator, analytics)
│   ├── rooms/                # Floor Manager (tabs: MAP 3D, GRID, TIMELINE, FINDER)
│   ├── r/[roomId]/           # Call the Squad share page + Next OG image
│   ├── admin/                # Admin controls (metadata, layout editor, overrides)
│   ├── api/                  # REST & streaming endpoints (time, claims, assistant, etc.)
│   └── not-found.tsx, error.tsx, layout.tsx
├── components/
│   ├── nb/                   # Shared neobrutalist UI components (Button, Input, Badge, Tabs, Modal, etc.)
│   ├── map3d/                # Three.js / R3F components (Scene, Building, RoomBlock, FloorSlab, CameraRig)
│   ├── rooms/                # Room Panel, Countdown, ClaimModal, SquadInvite
│   ├── attendance/           # Calculator, LeaveSimulator, SubjectCard, AttendanceChart
│   └── assistant/            # Unified Campus Assistant (Cmd+K command palette & floating button)
├── lib/
│   ├── engine/               # Pure calculation engines (rooms availability & attendance math)
│   ├── time/                 # Clock sync, IST formatters, half-open interval checks
│   ├── squad/                # WhatsApp message encoder, claim verification, squad storage
│   ├── layout/               # 3D building auto-layout algorithm, graph generator, A* pathfinder
│   ├── ai/                   # Unified assistant agent router & tool definitions
│   ├── prisma.ts             # Prisma client instance with edge/serverless pooling
│   └── redis.ts              # Upstash Redis client with in-memory fallback
├── config/
│   ├── rules.ts              # Timetable intervals, room-to-floor mappings, bells, limits
│   └── policy.ts             # SRM EEE 75% attendance policy & medical leave rules
├── data/                     # Seed JSON datasets (sections, rooms, holidays, aliases, layout)
├── prisma/
│   └── schema.prisma         # Postgres schema (User, Section, Subject, Leave, RoomMeta, Layout, Override)
└── scripts/
    ├── seed.ts               # Seed script for Postgres
    └── validate-dataset.ts   # Integrity & clash audit script
```

---

## 3. Order of Implementation

1. **Data Layer & Shared Clock**: Prisma schema update, Upstash Redis connection, database seed script, `/api/time` endpoint.
2. **Engine Unification**: Integrate attendance calculation and room availability engines with pure shared date/time utilities.
3. **3D Scene Foundation**: Auto-layout generator (`/lib/layout`), procedural floor slabs, room blocks with `<Edges>`, drop slabs, and live engine status recoloring.
4. **Interactive Controls & Countdown**: `CameraControls`, floor isolation, cutaway, time scrubber, time-lapse player, and the Room Panel with high-precision countdown.
5. **Call the Squad**: Redis-backed claim system, TTL expiration, WhatsApp pre-filled message generator, and `/r/[roomId]` share page with dynamic OpenGraph image.
6. **Unified App Shell & Routes**: Shared navbar, unified authentication, `/dashboard` attendance predictor, `/rooms` floor manager, and role-protected `/admin`.
7. **Unified Campus Assistant**: Dual-domain router (`Cmd+K` + floating bubble) executing attendance tools and room finding/claiming tools with UI action dispatch.
8. **Fallbacks & Performance**: 2D grid fallback for low-tier GPUs or `prefers-reduced-motion`, `frameloop="demand"`, accessibility tags.
9. **Verification & Testing**: Vitest suite with full attendance + Section 13 room acceptance tests, production build verification, and git synchronization.
