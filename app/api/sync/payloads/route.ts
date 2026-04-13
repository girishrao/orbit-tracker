import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Syncs payloads by linking launches to orbital objects:
// 1. Fetches successful launches from LL2 that have a launch_designator
// 2. Queries CelesTrak GP catalog by international designator to find all objects from that launch
// 3. Creates Satellite records (with TLE) and Payload records bridging Launch <-> Satellite
//
// This is the join nobody else publishes cleanly.
//
// Query params:
//   ?limit=50     max launches to process (default 50)
//   ?months=6     how far back to look (default 6)
//   ?launch=UUID  sync a specific launch by ID

const LL2_BASE =
  process.env.NODE_ENV === "development"
    ? "https://lldev.thespacedevs.com/2.3.0"
    : "https://ll.thespacedevs.com/2.3.0";

const CELESTRAK_GP = "https://celestrak.org/NORAD/elements/gp.php";

interface CelestrakGP {
  OBJECT_NAME: string;
  OBJECT_ID: string; // international designator e.g. "2023-014A"
  NORAD_CAT_ID: number;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

// Fetch TLE data for all objects with a given international designator
async function fetchObjectsByDesignator(
  intdes: string
): Promise<
  { noradId: number; name: string; objectId: string; tle1: string; tle2: string }[]
> {
  // Fetch TLE format (3-line: name, tle1, tle2)
  const res = await fetch(`${CELESTRAK_GP}?INTDES=${intdes}&FORMAT=TLE`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const text = await res.text();
  const lines = text.trim().split("\n").map((l) => l.trim());
  const objects: { noradId: number; name: string; objectId: string; tle1: string; tle2: string }[] = [];

  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i];
    const tle1 = lines[i + 1];
    const tle2 = lines[i + 2];

    if (!tle1?.startsWith("1 ") || !tle2?.startsWith("2 ")) continue;

    const noradId = parseInt(tle2.substring(2, 7).trim(), 10);
    if (isNaN(noradId)) continue;

    // Extract international designator from TLE line 1 (cols 10-17)
    const objectId = `${intdes}${name.includes(intdes) ? "" : ""}`;

    objects.push({ noradId, name, objectId: objectId, tle1, tle2 });
  }

  // Also fetch JSON format for the object IDs
  const jsonRes = await fetch(`${CELESTRAK_GP}?INTDES=${intdes}&FORMAT=json`, {
    next: { revalidate: 3600 },
  });
  if (jsonRes.ok) {
    const gpData: CelestrakGP[] = await jsonRes.json();
    const gpMap = new Map(gpData.map((gp) => [gp.NORAD_CAT_ID, gp]));

    for (const obj of objects) {
      const gp = gpMap.get(obj.noradId);
      if (gp) obj.objectId = gp.OBJECT_ID;
    }
  }

  return objects;
}

// Fetch launches from LL2 that have launch designators
async function fetchLaunchesWithDesignators(
  limit: number,
  months: number,
  specificLaunchId?: string
): Promise<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any[]
> {
  if (specificLaunchId) {
    const res = await fetch(
      `${LL2_BASE}/launches/${encodeURIComponent(specificLaunchId)}/?format=json&mode=detailed`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.launch_designator ? [data] : [];
  }

  const now = new Date();
  const since = new Date(now);
  since.setMonth(since.getMonth() - months);

  const url = new URL(`${LL2_BASE}/launches/`);
  url.searchParams.set("format", "json");
  url.searchParams.set("mode", "list");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("ordering", "-net");
  url.searchParams.set("net__gte", since.toISOString());
  url.searchParams.set("net__lte", now.toISOString());
  url.searchParams.set("status", "3"); // Success only (they have designators)

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results ?? []).filter((l: any) => l.launch_designator);
}

export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? 50), 200);
  const months = Number(params.get("months") ?? 6);
  const specificLaunchId = params.get("launch") ?? undefined;

  try {
    const launches = await fetchLaunchesWithDesignators(limit, months, specificLaunchId);

    const stats = {
      launchesProcessed: 0,
      satellitesCreated: 0,
      payloadsCreated: 0,
      skippedNoObjects: 0,
    };

    for (const launch of launches) {
      const intdes = launch.launch_designator;
      if (!intdes) continue;

      // Check if we already have a launch record
      const dbLaunch = await db.launch.findUnique({ where: { id: launch.id } });
      if (!dbLaunch) {
        // Launch not in DB yet — the /api/sync/launches route should be run first
        // But create a minimal record so payloads can reference it
        await db.launch.create({
          data: {
            id: launch.id,
            name: launch.name ?? "Unknown",
            net: new Date(launch.net),
            rocketName: launch.rocket?.configuration?.name ?? "Unknown",
            status: launch.status?.name ?? "Success",
          },
        });
      }

      // Fetch all orbital objects from this launch via CelesTrak
      const objects = await fetchObjectsByDesignator(intdes);
      if (objects.length === 0) {
        stats.skippedNoObjects++;
        stats.launchesProcessed++;
        continue;
      }

      for (const obj of objects) {
        // Upsert Satellite with TLE and link to launch
        const satellite = await db.satellite.upsert({
          where: { noradId: obj.noradId },
          update: {
            name: obj.name,
            tle1: obj.tle1,
            tle2: obj.tle2,
            intlDesignator: obj.objectId,
            launchId: launch.id,
          },
          create: {
            noradId: obj.noradId,
            name: obj.name,
            tle1: obj.tle1,
            tle2: obj.tle2,
            intlDesignator: obj.objectId,
            launchId: launch.id,
          },
        });
        stats.satellitesCreated++;

        // Determine object type from name for match confidence
        const nameUpper = obj.name.toUpperCase();
        const isDebris = nameUpper.includes(" DEB") || nameUpper.includes("DEBRIS");
        const isRocketBody = nameUpper.includes(" R/B") || nameUpper.startsWith("FALCON 9");
        const objectType = isDebris ? "DEB" : isRocketBody ? "R/B" : "PAY";

        // Create Payload record (only for payloads, not debris/rocket bodies)
        if (objectType === "PAY") {
          // Check if payload already exists for this satellite
          const existing = await db.payload.findUnique({
            where: { satelliteId: satellite.id },
          });

          if (!existing) {
            await db.payload.create({
              data: {
                name: obj.name,
                type: "Satellite",
                launchId: launch.id,
                satelliteId: satellite.id,
                intlDesignator: obj.objectId,
                matchConfidence: "designator_match",
                matchedAt: new Date(),
              },
            });
            stats.payloadsCreated++;
          }
        }
      }

      stats.launchesProcessed++;

      // Small delay between launches to be respectful to CelesTrak
      await new Promise((r) => setTimeout(r, 500));
    }

    // Record sync
    await db.dataSync.upsert({
      where: { source_entityType: { source: "celestrak_payloads", entityType: "designator_match" } },
      update: {
        lastSyncAt: new Date(),
        recordCount: stats.payloadsCreated,
        status: "ok",
        errorMessage: null,
      },
      create: {
        source: "celestrak_payloads",
        entityType: "designator_match",
        lastSyncAt: new Date(),
        recordCount: stats.payloadsCreated,
        status: "ok",
      },
    });

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("Payload sync failed:", error);
    return NextResponse.json(
      { error: "Payload sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}
