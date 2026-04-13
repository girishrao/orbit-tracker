---
name: Project Architecture
description: Current state of Orbit Tracker — 3 views (Globe, All, Launches), 7 API routes, satellite tracking and launch lineage features implemented
type: project
---

## Current State (as of 2026-04-03)

Scaffold is complete AND core features are substantially built. The app has 3 views:

1. **Globe view** — satellite search (CelesTrak), real-time SGP4 tracking on 3D globe, 90-min ground track, orbital info panel (elements + next pass + SATCAT metadata + LL2 mission description)
2. **All view** — constellation visualization of up to 1000 recently-launched objects as a point cloud with orbit arcs, clickable for details
3. **Launches view** — timeline of ~50 launches (±3 months) from Launch Library 2, expandable lineage detail (rocket → booster → mission → program), cross-links to Globe view satellite search

**7 API routes:**
- `/api/tle` — TLE by NORAD ID (CelesTrak → SQLite upsert)
- `/api/satellites/search` — name search (CelesTrak GP)
- `/api/satellites/constellation` — bulk TLE (last-30-days, up to 1000)
- `/api/satellites/satcat` — SATCAT CSV metadata lookup
- `/api/launches` — LL2 launch list + SQLite cache/fallback
- `/api/launches/[id]` — LL2 launch detail
- `/api/mission/search` — LL2 mission search

**Not yet built:** rocket reuse tracker, space situational awareness dashboard, space-track.org auth integration, persistent launch↔satellite linking (FK exists in schema but unused).

**Why:** This corrects earlier memory that said only the scaffold was done — both "Follow a Satellite" and "Launch → Orbit Lineage" are substantially implemented.
**How to apply:** Don't re-implement existing features. Focus on gaps listed above.
