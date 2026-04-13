❯ what unique data do i have here so far that other trackers or sites don't aggregate or display today?                                                                                            
                                                                                                                                                                                                 
⏺ Honest answer: as of right now, nothing unique. Everything currently in the app is already aggregated and displayed better elsewhere:                                                            
                                                                                                                                                                                                 
  ┌───────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────┐                                                                 
  │             What you have             │                              Who already does it better                              │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤                                                                 
  │ 3D globe with SGP4 satellite tracking │ satellitemap.space, keeptrack.space, stuffin.space                                   │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ TLE fetch from CelesTrak              │ celestrak.org itself, n2yo.com                                                       │                                                                 
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤                                                                 
  │ Next-pass prediction from geolocation │ heavens-above.com, n2yo.com                                                          │                                                                 
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤                                                                 
  │ Launch list from Launch Library 2     │ nextspaceflight.com, rocketlaunch.live, spacelaunchnow.me (all use the same LL2 API) │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤                                                                 
  │ Orbital parameters panel              │ n2yo, heavens-above, celestrak SATCAT                                                │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤                                                                 
  │ Mission info from LL2                 │ nextspaceflight.com                                                                  │
  └───────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘                                                                 
                                                            
  The CLAUDE.md thesis — "the data is fragmented, stitching it together is the product" — is still valid, but the stitching is where uniqueness would come from, and you haven't built those joins 
  yet. Specifically, the things no single site currently shows together that your schema is positioned for:
                                                                                                                                                                                                   
  1. Launch → Orbit Lineage (the Feature 2 you haven't built). Click a Falcon 9 launch from 2021 → see every Starlink payload it deployed → see each one's current position, altitude, and whether 
  it's been deorbited. Nextspaceflight shows the launch; Celestrak shows the orbit; nobody links them payload-by-payload with live state.
  2. Booster core ↔ landing ↔ reuse graph. LL2 exposes Falcon 9 core serial numbers and flight counts. r/SpaceX API has landing pad outcomes. Nobody renders "B1062: 23 flights, these missions,   
  these landings, current status" as a first-class visual. Flightclub.io comes closest but focuses on trajectories, not reuse history.                                                             
  3. Deployment batch visualization for megaconstellations. "Show me Starlink Group 6-31 as a cluster, drifting apart over time since deployment." Celestrak has the group filter; none of the 3D
  trackers animate the dispersal from a specific launch batch.                                                                                                                                     
  4. "Where is the payload from this launch right now" as the default UX. Every launch site ends the story at T+0. You could start it there.
  5. Conjunction/close-approach history tied to a specific satellite's mission page (once you wire space-track.org). Space-track has the CDMs; nobody ties them back to the human-readable launch  
  narrative.                                                                                                                                                                                       
                                                                                                                                                                                                   
  So: the database schema (Launch ↔ Satellite FK) is the beginning of something differentiated, but right now the app is a competent re-implementation of existing tools. The unique value shows up
   the moment you land Feature 2 — specifically the payload-to-NORAD name matching, because that join is the thing nobody else publishes.
                                                                                                                                                                                                   
  If you want a single concrete next step that would immediately give you something no other site shows: pick one recent Starlink launch, resolve its payloads to NORAD IDs via CelesTrak, and     
  render the batch as a drifting cluster on the globe with a "days since deployment" scrubber. That view does not exist anywhere I know of.


 Compare the feature set here to FlightRadar24. What is FlightRadar24's business model and usage model?                                                                                           
                                                                                                          
⏺ FlightRadar24 — the analog                                                                                                                                                                       
                                                                                                                                                                                                   
  FR24 is the closest business model analog for what Orbit Tracker could become, just for planes instead of satellites.                                                                            
                                                                                                                                                                                                   
  What FR24 does                                                                                                                                                                                   
                                                                                                                                                                                                   
  - Real-time position of ~200,000 flights/day on a 2D map
  - Click any aircraft → flight history, route, altitude profile, speed, aircraft type, registration, airline, origin/destination                                                                  
  - Playback: scrub backward in time to replay any flight   
  - Airport dashboards: arrivals/departures, delays, runway usage                                                                                                                                  
  - Aircraft-level history: "this specific 737 (reg. N12345) flew these routes over the past year"
  - Fleet tracking: all aircraft for a given airline                                                                                                                                               
  - ADS-B coverage map (crowdsourced receiver network)                                                                                                                                             
                                                                                                                                                                                                   
  Business model                                                                                                                                                                                   
                                                                                                                                                                                                   
  ┌──────────┬─────────┬──────────────────────────────────────────────────────────┐                                                                                                                
  │   Tier   │  Price  │                     What it unlocks                      │                                                                                                                
  ├──────────┼─────────┼──────────────────────────────────────────────────────────┤                                                                                                                
  │ Free     │ $0      │ Live map, basic flight info, 7-day history               │
  ├──────────┼─────────┼──────────────────────────────────────────────────────────┤
  │ Silver   │ ~$2/mo  │ 90-day history, more filters, alerts                     │
  ├──────────┼─────────┼──────────────────────────────────────────────────────────┤
  │ Gold     │ ~$4/mo  │ 365-day history, detailed aircraft info, weather overlay │
  ├──────────┼─────────┼──────────────────────────────────────────────────────────┤                                                                                                                
  │ Business │ ~$50/mo │ Full API access, fleet tracking, airport analytics       │                                                                                                                
  └──────────┴─────────┴──────────────────────────────────────────────────────────┘   


Revenue also comes from:                                  
  - Data licensing to airlines, airports, aviation analytics firms, insurance, media (this is the real money — reportedly the majority of revenue)                                                 
  - ADS-B receiver program: users host $20 receivers at home, feed data to FR24, get a free Business subscription in return. This is their moat — 35,000+ ground stations worldwide, crowdsourced
  infrastructure they don't pay for                                                                                                                                                                
  - Media/embed licensing: every time CNN shows a flight path, that's FR24
                                                                                                                                                                                                   
  FR24 was acquired in 2023 for reportedly ~$1B+. ~50M monthly users.
                                                                                                                                                                                                   
  Comparison to Orbit Tracker                               
                                                                                                                                                                                                   
  ┌─────────────────────────────┬─────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┐                                                 
  │          Dimension          │                 FlightRadar24 (planes)                  │              Orbit Tracker (satellites)              │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤                                                 
  │ Data source                 │ ADS-B receivers (crowdsourced) + FAA/Eurocontrol feeds  │ TLEs from CelesTrak/space-track (government, free)   │
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Update frequency            │ Every 1-2 seconds                                       │ TLEs update every few hours; SGP4 propagates between │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Object count                │ ~15,000 airborne at once                                │ ~10,000 active satellites, 63,000 tracked objects    │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤                                                 
  │ Object identity             │ Rich — tail number, airline, route, airport             │ Sparse — NORAD ID, name, sometimes nothing else      │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤                                                 
  │ "Click to learn more" depth │ Deep — aircraft history, photos, airline, airport stats │ Shallow today — that's the gap to fill               │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ History/playback            │ Core feature, key monetization lever                    │ Not built                                            │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Entity relationships        │ Aircraft → flights → routes → airports → airlines       │ Launch → mission → payload → orbit (your Feature 2)  │                                                 
  ├─────────────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Data moat                   │ 35,000 crowdsourced receivers                           │ None yet — same public APIs anyone can hit           │                                                 
  └─────────────────────────────┴─────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘
                                                                                                                                                                                                   
  Key takeaways for Orbit Tracker                           
                                                                                                                                                                                                   
  1. FR24's free tier hooks users with the live map, then monetizes historical depth. The equivalent for you: the 3D globe is the hook, but the "click a satellite → see its full launch-to-now
  story" is the depth nobody else provides.                                                                                                                                                        
  2. The entity graph is the product. FR24 isn't just dots on a map — it's aircraft → registration → operator → route history → airport. Your equivalent is launch → booster → mission → payload →
  orbit → conjunction events. That graph is what makes FR24 worth $1B, not the map itself.                                                                                                         
  3. FR24's moat is crowdsourced data they own. You don't have that. But there's a possible angle: the linkage between launch data (LL2) and orbital data (CelesTrak) is non-trivial and nobody
  publishes it as a clean dataset. If you build and maintain a high-quality payload-to-NORAD mapping table, that becomes a data asset.                                                             
  4. FR24 monetizes B2B data licensing more than consumer subscriptions. The space equivalent would be selling structured launch-orbit lineage data to satellite operators, insurers, or space     
  situational awareness firms — but that's a much smaller market today.
  5. Playback/history is where money lives. "Where was this satellite 6 months ago" or "show me all Starlink deployments animating over 2024" would be your equivalent of FR24's flight playback — 
  and it's achievable with historical TLEs from space-track.org.
                                                                                   


⏺ Good — I have a comprehensive picture of the current data model and a full schema design. Let me write up the plan.                                                                              
                                                                                                                                                                                                   
⏺ Updated plan                                                                                                                                                                                     
  ⎿  /plan to preview                                                                                                                                                                              
                                                                                                                                                                                                   
⏺ Here's the summary of the plan:                                                                                                                                                                  
                                                                                                                                                                                                   
  14 models replacing the current 2, organized into 5 groups:                                                                                                                                      
                                                                                                                                                                                                   
  1. Organizations & Hardware — Agency, RocketConfig, Core, CoreFlight (booster reuse tracking)                                                                                                    
  2. Launches & Missions — Launch (expanded), LaunchPad, Program, + two M:N join tables                                                                                                            
  3. Payloads — the critical new model that bridges LL2 launch data to NORAD orbital objects (the join nobody else publishes)                                                                      
  4. Orbital Objects — Satellite (expanded with SATCAT metadata, Starlink fields, operator FK)                                                                                                     
  5. History & Awareness — TleSnapshot (playback), Conjunction (CDMs), DataSync (cache management)                                                                                                 
                                                                                                                                                                                                   
  Migration is fully additive — no data loss, no breaking changes. Existing inline fields (rocketName, padName, etc.) stay as denormalized cache while normalized relations provide the full       
  picture.                                                                                                                                                                                         
                                                                                                                                                                                                   
  Implementation scope for now: just the schema migration + Prisma client regeneration. Existing API routes keep working. Backfill and new features build on top later.                            
   
Here is Claude's plan:                                                                                                                                                                            
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Data Model Redesign — "FlightRadar24 for Space"                                                                                                                                                   
                                                        
 Context

 The current schema has 2 models (Launch, Satellite) with a simple FK between them. This was enough to ship the "Follow a Satellite" feature, but the product roadmap requires a much richer
 entity graph: launch lineage, booster reuse tracking, historical playback, conjunction events, and operator/fleet views. The goal is to design this schema now so all future features build on a
 solid foundation.

 Schema Design — 14 Models

 Organizations & Hardware

 - Agency — launch service providers and satellite operators (source: LL2 /agencies)
 - RocketConfig — rocket families/variants e.g. "Falcon 9 Block 5" (source: LL2 /config/launcher/)
 - Core — individual reusable boosters e.g. B1062 (sources: LL2 launcher_stage + r/SpaceX /cores)
 - CoreFlight — join table: one flight of one core on one launch, with landing outcome and turnaround time

 Launches & Missions

 - Launch — expanded from current model; adds FKs to Agency, RocketConfig, LaunchPad; adds SpaceX cross-refs, window/probability, imagery
 - LaunchPad — launch and landing sites (source: LL2 /pad)
 - Program — space programs like ISS, Commercial Crew (source: LL2 /program)
 - LaunchProgram — M:N join: Launch <-> Program
 - ProgramAgency — M:N join: Program <-> Agency

 The Critical Join: Payloads

 - Payload — bridges LL2 launch data to orbital objects. Links a spacecraft/payload from LL2 to a Satellite by NORAD ID. Stores match confidence and international designator. This is the entity
 nobody else publishes cleanly.

 Orbital Objects

 - Satellite — expanded from current model; adds SATCAT metadata (objectType, opsStatus, owner, inclination, apogee, perigee, decay date, RCS), TLE epoch, SpaceX Starlink fields, operator FK to
 Agency

History & Awareness

 - TleSnapshot — historical TLE archive for playback (source: space-track.org /gp_history, periodic CelesTrak captures). Unique on (noradId, epoch).
 - Conjunction — close-approach events between two objects (source: space-track.org CDMs). Links to both primary and secondary Satellite records.

 Infrastructure

 - DataSync — tracks last sync time, record count, status, and next sync time per data source. Prevents redundant API calls and manages rate limits.

 Key Relationships

 Agency ──1:N──> Launch (as LSP)
 Agency ──1:N──> Satellite (as operator)
 Agency ──M:N──> Program

 RocketConfig ──1:N──> Launch
 RocketConfig ──1:N──> Core
 Core ──1:N──> CoreFlight ──N:1──> Launch

 Launch ──1:N──> Payload ──1:1──> Satellite   (the lineage join)
 Launch ──1:N──> Satellite                     (backward compat simple FK)
 Launch ──M:N──> Program
 Launch ──N:1──> LaunchPad

 Satellite ──1:N──> TleSnapshot
 Satellite ──1:N──> Conjunction (as primary or secondary)


 Migration Strategy (additive, no data loss)

 All changes are additive — new nullable columns on existing tables, new tables.

 Phase 1 — Expand Satellite: add SATCAT fields (objectType, opsStatus, owner, inclination, apogee, perigee, decayDate, RCS, intlDesignator, tleEpoch, spxId, spxVersion, agencyId). All nullable.

 Phase 2 — Create new tables: Agency, RocketConfig, Core, CoreFlight, LaunchPad, Program, LaunchProgram, ProgramAgency, Payload, TleSnapshot, Conjunction, DataSync.

 Phase 3 — Expand Launch: add nullable FKs (rocketConfigId, agencyId, padId) and new fields (statusAbbrev, windowStart/End, probability, webcastLive, imageUrl, slug, spxFlightNumber, spxId).

 Phase 4 — Backfill: sync scripts populate new tables from LL2/CelesTrak/SpaceX APIs, then update FKs on existing rows. Existing inline fields (rocketName, padName, etc.) remain as denormalized
 cache.

 Files to Modify

 ┌────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────┐
 │                File                │                                     Change                                     │
 ├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
 │ prisma/schema.prisma               │ Replace with full 14-model schema                                              │
 ├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
 │ prisma/migrations/                 │ New migration generated by prisma migrate dev                                  │
 ├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
 │ app/api/launches/route.ts          │ After upsert, also create/link Agency + RocketConfig from LL2 response         │
 ├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
 │ app/api/tle/route.ts               │ After satellite upsert, create TleSnapshot if epoch changed                    │
 ├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
 │ app/api/satellites/satcat/route.ts │ Upsert SATCAT fields onto Satellite model instead of just returning parsed CSV │
 ├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
 │ lib/db.ts                          │ No change needed (Prisma client regenerates)                                   │
 └────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────┘

 Verification

 1. npx prisma migrate dev — migration applies cleanly
 2. npx prisma generate — client regenerates with all new models
 3. npm run dev — app starts, existing launch timeline and satellite tracking still work
 4. Existing API routes return same response shape (backward compat fields preserved)

 What This Enables (not building now, just schema-ready)

 - Launch Lineage: Payload model bridges Launch → Satellite with match confidence
 - Booster Reuse: Core + CoreFlight gives full flight history, landing outcomes, turnaround times
 - Playback: TleSnapshot gives historical position reconstruction via SGP4
 - Conjunction Awareness: Conjunction model links CDMs to satellite mission narratives
 - Fleet/Operator Views: Agency → Satellite relation enables "all satellites for SpaceX/OneWeb/etc."
 - Constellation Batches: Satellite.launchId + Satellite.intlDesignator groups deployment cohorts

The app is ready to test right now. I already ran all three syncs during development, so your local dev.db has real data:

  - 20 launches with full entity graphs (agencies, rocket configs, pads, cores)
  - 93 satellites linked to 92 payloads across 5 launches
  - SATCAT metadata enriched on all 100 satellites

  Just npm run dev and the existing UI works as before. The new data is in the DB but nothing in the frontend consumes the new relationships yet — that's the next step (Launch → Orbit Lineage
  UI).

  For future use (fresh DB, or to pull more data), the sync order matters:

  # 1. Launches first (creates Agency, RocketConfig, Core, etc.)
  curl -X POST "http://localhost:3000/api/sync/launches?limit=100&months=6&status=3"

  # 2. Payloads second (needs launches to exist)
  curl -X POST "http://localhost:3000/api/sync/payloads?limit=50&months=6"

  # 3. SATCAT third (enriches satellites from step 2)
  curl -X POST "http://localhost:3000/api/sync/satcat"


Here's the data model — 14 models in 5 groups:

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                           ORGANIZATIONS                                     │
  │                                                                             │
  │  ┌──────────────┐                                                           │
  │  │   Agency      │  SpaceX, NASA, ULA, Roscosmos...                        │
  │  │──────────────│                                                           │
  │  │ id (PK)      │                                                           │
  │  │ name         │                                                           │
  │  │ abbrev       │                                                           │
  │  │ type         │  "Commercial", "Government"                               │
  │  │ countryCode  │                                                           │
  │  │ logoUrl      │                                                           │
  │  └──────┬───────┘                                                           │
  │         │ 1:N                                                               │
  │         ▼                                                                   │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                        ROCKETS & BOOSTERS                                   │
  │                                                                             │
  │  ┌──────────────────┐         ┌──────────────┐       ┌──────────────────┐  │
  │  │  RocketConfig     │────1:N──│    Core       │──1:N──│   CoreFlight     │  │
  │  │──────────────────│         │──────────────│       │──────────────────│  │
  │  │ id (PK)          │         │ id (PK)      │       │ id (PK, auto)    │  │
  │  │ name             │         │ serialNumber │       │ coreId (FK)      │  │
  │  │ family           │         │ status       │       │ launchId (FK)    │  │
  │  │ variant          │         │ totalFlights │       │ flightNumber     │  │
  │  │ reusable         │         │ reuseCount   │       │ landingAttempt   │  │
  │  │ leoCapacityKg    │         │ block        │       │ landingSuccess   │  │
  │  │ thrustKn         │         │ spxId        │       │ landingType      │  │
  │  │ totalLaunchCount │         └──────────────┘       │ landingLocation  │  │
  │  └────────┬─────────┘                                │ turnaroundDays   │  │
  │           │ 1:N                                      └────────┬─────────┘  │
  │           ▼                                                   │ N:1        │
  ├───────────────────────────────────────────────────────────────┼────────────┤
  │                           LAUNCHES                            │            │
  │                                                               ▼            │
  │  ┌────────────────────────────────────────────┐     ┌──────────────────┐  │
  │  │                 Launch                      │     │   LaunchPad      │  │
  │  │────────────────────────────────────────────│     │──────────────────│  │
  │  │ id (PK, LL2 UUID)                          │     │ id (PK)          │  │
  │  │ name                                       │◄────│ name             │  │
  │  │ net (launch time)                          │ N:1 │ latitude         │  │
  │  │ rocketName (denorm)                        │     │ longitude        │  │
  │  │ status / statusAbbrev                      │     │ locationName     │  │
  │  │ padName, padLat, padLon (denorm)           │     └──────────────────┘  │
  │  │ missionName, missionDescription, orbit     │                           │
  │  │ windowStart, windowEnd, probability        │     ┌──────────────────┐  │
  │  │ imageUrl, slug                             │     │    Program        │  │
  │  │ rocketConfigId (FK) ─────────────────────┐ │     │──────────────────│  │
  │  │ agencyId (FK) ───────────────────────────┤ │ M:N │ id (PK)          │  │
  │  │ padId (FK) ──────────────────────────────┤ │◄────│ name             │  │
  │  │ spxFlightNumber, spxId                   │ │     │ description      │  │
  │  └──────┬──────────┬────────────────────────┘ │     └──────────────────┘  │
  │         │ 1:N      │ 1:N                      │     (via LaunchProgram)   │
  │         ▼          ▼                          │     (via ProgramAgency)   │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                    THE CRITICAL JOIN: PAYLOADS                              │
  │                                                                             │
 │  ┌──────────────────────┐                                                   │
  │  │      Payload          │  Bridges launch data ↔ orbital objects           │
  │  │──────────────────────│                                                   │
  │  │ id (PK, auto)        │                                                   │
  │  │ name                 │                                                   │
  │  │ type                 │  "Satellite", "Capsule", "Probe"                  │
  │  │ launchId (FK) ───────│──── N:1 to Launch                                │
  │  │ satelliteId (FK) ────│──── 1:1 to Satellite  ◄── THE JOIN               │
  │  │ intlDesignator       │  "2023-014A"                                      │
  │  │ matchConfidence      │  "designator_match", "name_match", "exact"        │
  │  │ matchedAt            │                                                   │
  │  └──────────────────────┘                                                   │
  │                                                                             │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                      ORBITAL OBJECTS                                        │
  │                                                                             │
  │  ┌──────────────────────────────────────────┐                               │
  │  │              Satellite                    │                               │
  │  │──────────────────────────────────────────│                               │
  │  │ id (PK, auto)                            │                               │
  │  │ noradId (unique)                         │  NORAD catalog number         │
  │  │ name                                     │                               │
  │  │ tle1, tle2                               │  Latest TLE (CelesTrak)       │
  │  │ tleEpoch                                 │                               │
  │  │ intlDesignator                           │  "2023-014A" (SATCAT)         │
  │  │ objectType                               │  "PAY", "R/B", "DEB"         │
  │  │ opsStatusCode                            │  "+", "-", "D", "?"          │
  │  │ owner                                    │  "US", "CIS", "PRC"          │
  │  │ launchDate, decayDate                    │                               │
  │  │ period, inclination, apogee, perigee     │  Orbital elements (SATCAT)    │
  │  │ radarCrossSection                        │                               │
  │  │ spxId, spxVersion                        │  Starlink-specific            │
  │  │ launchId (FK) ── N:1 to Launch           │  Backward compat              │
  │  │ agencyId (FK) ── N:1 to Agency           │  Operator                     │
  │  └──────┬───────────────────┬───────────────┘                               │
  │         │ 1:N               │ 1:N                                           │
  │         ▼                   ▼                                               │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                    HISTORY & AWARENESS                                      │
  │                                                                             │
  │  ┌──────────────────┐       ┌──────────────────────────────┐               │
  │  │   TleSnapshot     │       │        Conjunction            │               │
  │  │──────────────────│       │──────────────────────────────│               │
  │  │ id (PK, auto)    │       │ id (PK, auto)                │               │
  │  │ satelliteId (FK)  │       │ cdmId (unique)               │               │
  │  │ noradId (denorm)  │       │ tca (closest approach time)  │               │
  │  │ epoch             │       │ missDistance (meters)         │               │
  │  │ tle1, tle2        │       │ collisionProbability         │               │
  │  │ source            │       │ primarySatelliteId (FK)      │               │
  │  │ fetchedAt         │       │ secondarySatelliteId (FK)    │               │
  │  └──────────────────┘       │ primaryObjectType            │               │
  │  For playback:               │ secondaryObjectType           │               │
  │  "where was this sat         └──────────────────────────────┘               │
  │   6 months ago?"            From space-track.org CDMs                       │
  │                                                                             │
  │  ┌──────────────────┐                                                       │
  │  │    DataSync       │  Cache/rate-limit management                         │
  │  │──────────────────│                                                       │
  │  │ source           │  "ll2_launches", "celestrak_satcat", etc.            │
  │  │ lastSyncAt       │                                                       │
  │  │ recordCount      │                                                       │
  │  │ status           │  "ok", "error", "rate_limited"                       │
  │  └──────────────────┘                                                       │
  └─────────────────────────────────────────────────────────────────────────────┘

  The key data flow:

  LL2 launch ──► Agency, RocketConfig, LaunchPad, Core, CoreFlight
       │
       │ launch_designator (e.g. "2026-070")
       ▼
  CelesTrak ──► Satellite (TLE + NORAD ID)
       │              │
       │              ▼
       └──────► Payload (the bridge: Launch ↔ Satellite)
                      │
  SATCAT CSV ──► Satellite enrichment (objectType, owner, orbital elements)
                      │
  TLE refresh ──► TleSnapshot (historical archive for playback)

  The Payload model in the middle is what makes this different from every other tracker — it's the published, confidence-scored link between "this rocket launched on this date" and "these
  specific objects are now in orbit at these positions."


