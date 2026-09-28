# FLOOR MANAGER — SRM Trichy (School of EEE)

> **"Which rooms are empty right now, and which fit my needs?"**  
> An ultra-fast, deterministic room availability engine and AI room finder engineered for SRM Trichy School of EEE.

---

## 1. Overview & System Goals

**Floor Manager** solves the daily campus problem of wandering through corridors, knocking on occupied lecture hall doors, or settling into a classroom only to be interrupted when a scheduled class arrives.

1. **The Floor Grid (`/grid`):** A live, floor-by-floor map of every room (FREE, FREE SOON, OCCUPIED, DATA CONFLICT, NO CLASSES), computed with minute-level precision from 12 department section timetables at any chosen date and time (08:00–18:00 IST).
2. **The AI Room Finder (`/finder`):** A natural language search bar where a student types:  
   `"I need an AC room on the ground floor for me and my team for the next 2 hours"`  
   and gets exact matching rooms with their continuous free availability windows.
3. **Data Transparency & Audit (`/data`):** An open engine view exposing raw source files, duplicate notices, unmapped spaces, and timetable clash detection.
4. **Admin Portal (`/admin`):** Full control over room physical inventory (floor, AC status, capacity, room type), section toggles (turn Year I on/off to isolate collisions), and strict half-day reservation mode.

---

## 2. Answers to the 3 Confirmation Questions & Core Assumptions

### Q1: Which room floors and AC rooms are real?
- **Current State:** The official timetable PDFs do not list physical infrastructure or AC status.
- **Engine Implementation:** In `data/rooms.json`, `ac` and `capacity` are initialized to `null`.
- **Integrity Guarantee:** The AI Room Finder and UI badges never fabricate data. When a student requests an AC room, matching ground-floor rooms are returned with the clear badge: **"AC STATUS UNVERIFIED"**. The admin portal allows facilities staff to update and verify rooms at any time.

### Q2: Should Year I be included?
- **Finding:** The Year I documents are labelled "2024-25", mix "Odd" and "Even" semester headers, use a different period timing grid (P2 09:55-10:45 instead of 09:50-10:40), and physically collide with Year II (e.g. IST 602 on Monday P1 is claimed by both I ECE-A and II BME).
- **Engine Implementation:** All 4 Year I sections are transcribed with `verified: false` and kept **disabled by default** in production. The engine features conflict detection: when Year I is toggled on in `/admin`, the purple **DATA CONFLICT** status immediately highlights IST-602. When disabled, II BME occupies the room cleanly.

### Q3: Is "ground floor" the 1xx rooms?
- **Building Floor Map:**
  - `1xx` rooms (`IST-107`, `IST-108`, `TB-106`, `WORKSHOP`) $\rightarrow$ **Floor 0 (Ground Floor)**
  - `2xx` rooms (`IST-201`, `IST-225`, `IST-227`) $\rightarrow$ **Floor 1 (First Floor)**
  - `3xx` rooms (`IST-309`) $\rightarrow$ **Floor 2 (Second Floor)**
  - `4xx` rooms (`IST-401`, `IST-411`, `IST-416`) $\rightarrow$ **Floor 3 (Third Floor)**
  - `5xx` rooms (`IST-502`, `IST-510`, `IST-518`, `IST-519`, `IST-520`) $\rightarrow$ **Floor 4 (Fourth Floor)**
  - `6xx` rooms (`IST-602`, `IST-609`, `IST-617`, `IST-618`, `IST-625`, `IST-626`) $\rightarrow$ **Floor 5 (Fifth Floor)**
  - `7xx` rooms (`IST-702`, `IST-710`) $\rightarrow$ **Floor 6 (Sixth Floor)**
  - Unmapped spaces (`CHE-LAB`, `YOGA-HALL`, `PPS-LAB-UNMAPPED`, `CDC-UNMAPPED`) $\rightarrow$ **Floor: null**

---

## 3. Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS + CSS variables with Neobrutalism design system
- **State Management:** Zustand (`lib/store.ts`)
- **Validation:** Zod schemas (`lib/schemas.ts`)
- **Dates & Timezone:** `date-fns` + `date-fns-tz` with `Asia/Kolkata` (IST)
- **AI Integration:** `@anthropic-ai/sdk` server-side (`/api/finder`) with automatic regex/rule-based fallback when offline or unconfigured
- **Testing:** Vitest test suite (`tests/engine.test.ts`) covering all 11 acceptance criteria
- **Icons:** `lucide-react`
- **Typography:** Space Grotesk (headings), Space Mono (times and rooms), Inter (body)

---

## 4. Design System

- **Color Tokens:**
  - Cream Background: `#FFF8E7`
  - Ink: `#0A0A0A`
  - White Cards: `#FFFFFF`
  - Yellow Accent: `#FFD93D`
  - Pink Accent: `#FF6B9D`
  - Blue Accent: `#4D96FF`
  - Green Accent: `#6BCB77`
  - Red Accent: `#FF3B30`
  - Purple Conflict: `#B983FF`
- **Room Status Visuals:**
  - `FREE`: Solid Green (`#6BCB77`)
  - `FREE SOON` (occupied within 30 min): Solid Yellow (`#FFD93D`) + single non-looping pulse
  - `OCCUPIED`: Solid Red (`#FF3B30`)
  - `DATA CONFLICT`: Purple with diagonal stripes (`#B983FF`)
  - `NO CLASSES`: Grey hatched pattern (`#E5E7EB`)
- **Borders & Shadows:** `border-[3px] border-black` everywhere, hard offset shadows (`4px 4px 0 #0A0A0A` buttons, `6px 6px 0 #0A0A0A` cards). Zero blur, zero gradients.
- **Interactions:** Hover translates `(-2px, -2px)` with shadow expansion; active/press translates `(4px, 4px)` with shadow collapse.

---

## 5. Timetable Data Model & Section Registry

Total of **12 unique sections** transcribed:

| Section | Year | Home Room | Home Half | Period Grid | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IV ECE-A** | 4 | IST-225 | FULL | Y2_4 (2026-27) | Enabled |
| **IV ECE-B** | 4 | IST-227 | FULL | Y2_4 (2026-27) | Enabled |
| **III ECE-A** | 3 | IST-518 | FN (Forenoon) | Y2_4 (2026-27) | Enabled |
| **III ECE-B** | 3 | IST-518 | AN (Afternoon) | Y2_4 (2026-27) | Enabled |
| **III ECE-DS** | 3 | IST-519 | FN (Forenoon) | Y2_4 (2026-27) | Enabled |
| **II ECE-DS A** | 2 | IST-416 | FN (Forenoon) | Y2_4 (2026-27) | Enabled |
| **II ECE-DS B** | 2 | IST-411 | AN (Afternoon) | Y2_4 (2026-27) | Enabled |
| **II BME** | 2 | IST-602 | FN (Forenoon) | Y2_4 (2026-27) | Enabled |
| **I ECE-A** | 1 | IST-602 | FULL | Y1 (2024-25) | Provisional (Disabled by default) |
| **I ECE-B & EEE** | 1 | IST-602 | FULL | Y1 (2024-25) | Provisional (Disabled by default) |
| **I ECE-DS** | 1 | IST-502 | FULL | Y1 (2024-25) | Provisional (Disabled by default) |
| **I Biotech / BME**| 1 | IST-702 | FULL | Y1 (2024-25) | Provisional (Disabled by default) |

---

## 6. Source-Data Checklist & Known Data Risks

As specified in PRD Section 12, the following conditions are monitored and handled by `validateDataset()`:

1. **Duplicate PDF:** `III_ECE_A.pdf` and `III_ECE_A (1).pdf` are identical. Only one is loaded.
2. **Year I Stale Sheets:** Labelled 2024-25 with alternating Odd/Even headers and shifted period times.
3. **IST-602 Clash:** Mon P1 (09:00-09:50) is claimed by both I ECE-A and II BME. Flags as `DATA CONFLICT`.
4. **CDC Room IST-625:** Utilized by multiple sections for Slot G at distinct non-overlapping periods.
5. **Parallel Labs:** `LAB@IST-108+IST-309` occupies both rooms simultaneously.
6. **III ECE-DS Fri P4 B-Proj:** Has no external room listed, so it is booked in home room IST-519.
7. **Blank Half-Days:** Default engine considers home rooms free during blank periods and external labs. Can be toggled to "Strict Reservation" in `/admin`.

---

## 7. Vitest Test Suite (All 11 Criteria Passed)

Run the test suite:
```bash
npm test
```

Results:
- **Test 1:** Mon 09:30 $\rightarrow$ `IST-108` & `IST-309` OCCUPIED (III ECE-B lab); `IST-518` OCCUPIED (III ECE-A slot E); `IST-411` FREE.
- **Test 2:** Mon 10:00 $\rightarrow$ `IST-225` FREE (IV ECE-A P2 blank); `IST-227` OCCUPIED (IV ECE-B slot A).
- **Test 3:** Mon 10:45 $\rightarrow$ `IST-227` FREE SOON (tea break, slot E starts at 10:50). At 10:50 OCCUPIED.
- **Test 4:** Thu 11:00 $\rightarrow$ `IST-108` OCCUPIED (IV ECE-B lab); `TB-106` OCCUPIED (II DS-B slot H).
- **Test 5:** Tue 14:30 $\rightarrow$ `IST-625` OCCUPIED (III ECE-A slot G).
- **Test 6:** Mon 09:30 Conflict $\rightarrow$ `IST-602` shows DATA CONFLICT when Year I is enabled, and OCCUPIED (no conflict) when Year I is disabled.
- **Test 7:** Weekend & Holiday $\rightarrow$ Returns NO CLASSES (all rooms free).
- **Test 8:** Mon 16:00 "next 2 hours" $\rightarrow$ Returns only partial matches with exact minutes available.
- **Test 9:** AI Parser $\rightarrow$ Extracts floor 0, AC true, duration 120 min, group size ~5, and flags unverified AC status.
- **Test 10:** Prompt Injection $\rightarrow$ Refuses malicious prompts and redirects off-topic questions.
- **Test 11:** Dataset Validation $\rightarrow$ Flags duplicate file, IST-602 clash, unmapped rooms, and missing metadata.

---

## 8. Running the Application

### Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Run Dataset Audit:
```bash
npm run validate
```

### Production Build:
```bash
npm run build
npm start
```
