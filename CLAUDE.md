# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orbit Tracker is a space data visualization app that unifies fragmented public space APIs into a clean, real-time visual experience. The core insight is that the data exists but is extremely fragmented — a complete picture of a single launch requires hitting multiple separate APIs. This app stitches them together.

## Features Being Built

### 1. Follow a Satellite
Pick any payload from a launch and track it in real-time on a 3D globe. Shows orbital parameters, predicts when it passes over the user's location, and links back to the original launch mission. Narrative arc: launch → deploy → track.

### 2. Launch → Orbit Lineage
A graph/timeline view connecting rockets → missions → payloads → current orbital position. For Starlink, this means showing all 6,000+ satellites as a constellation with their launch batch and deployment history.

## Planned Features (Future)
- Rocket reuse tracker (SpaceX booster core flights, turnaround times, landing outcomes)
- Space situational awareness dashboard (debris, active satellites, conjunction events over time)

## Tech Stack

- **Framework**: Next.js (TypeScript)
- **3D Globe**: CesiumJS — built-in SGP4 propagation, coordinate transforms, and time-dynamic rendering. The standard for orbital visualization.
- **Database**: SQLite (local dev) → AWS RDS Postgres (production). Space-track.org credentials and cached orbital/launch data will be stored server-side.
- **ORM**: Prisma (schema-first, handles SQLite → Postgres migration cleanly)
- **API layer**: Next.js API routes (server-side proxying for APIs that require auth, e.g. space-track.org)

## Data Sources

### Launch Data
- **Launch Library 2** (TheSpaceDevs) — rocket configurations, reusable first stages (Falcon 9 cores with serial numbers and flight counts), spacecraft configurations, launch locations, astronauts, space stations, docking events. Free, no auth required.
- **r/SpaceX Community API** — open source REST API covering SpaceX launches, rockets, cores, capsules, Starlink, launchpads, and landing pad data. Fully free, no auth.

### Orbital Data
- **CelesTrak** — 501(c)(3) non-profit redistributing US Space Force tracking data. Covers 63,000+ known objects in orbit. Query by catalog number, satellite name, international designator, or pre-defined groups (e.g. Starlink constellation). Data available in TLE, XML, JSON, and CSV formats.
- **space-track.org** — the authoritative source (18th Space Control Squadron, US Space Force). Required for conjunction/close-approach events. Requires free account registration.
- **TLE format** — Two-Line Element sets are the standard for orbital state. Combined with a timestamp and the SGP4 propagation model, they answer "where will this object be at any point in time?"

### NASA
- **api.nasa.gov** — clearinghouse for NASA APIs: planetary data, imagery, near-Earth objects, mission telemetry.
