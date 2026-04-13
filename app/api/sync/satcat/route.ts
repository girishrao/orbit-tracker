import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Bulk-updates Satellite records with SATCAT metadata from CelesTrak.
// Only updates satellites already in the database (from payload sync).
// Adds: objectType, opsStatusCode, owner, launchDate, launchSiteCode,
//        decayDate, period, inclination, apogee, perigee, radarCrossSection

const SATCAT_CSV_URL = "https://celestrak.org/pub/satcat.csv";

export async function POST() {
  try {
    // Get all satellite NORAD IDs we have
    const satellites = await db.satellite.findMany({
      select: { id: true, noradId: true },
    });

    if (satellites.length === 0) {
      return NextResponse.json({ ok: true, stats: { updated: 0, total: 0 } });
    }

    const noradMap = new Map(satellites.map((s) => [String(s.noradId), s.id]));

    // Fetch SATCAT CSV
    const res = await fetch(SATCAT_CSV_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `SATCAT CSV returned ${res.status}` },
        { status: 502 }
      );
    }

    const csv = await res.text();
    const lines = csv.split("\n");
    const header = lines[0].split(",");
    const idx = (col: string) => header.indexOf(col);

    const catIdx = idx("NORAD_CAT_ID");
    const nameIdx = idx("OBJECT_NAME");
    const typeIdx = idx("OBJECT_TYPE");
    const statusIdx = idx("OPS_STATUS_CODE");
    const ownerIdx = idx("OWNER");
    const launchDateIdx = idx("LAUNCH_DATE");
    const launchSiteIdx = idx("LAUNCH_SITE");
    const decayDateIdx = idx("DECAY_DATE");
    const periodIdx = idx("PERIOD");
    const inclinationIdx = idx("INCLINATION");
    const apogeeIdx = idx("APOGEE");
    const perigeeIdx = idx("PERIGEE");
    const rcsIdx = idx("RCS_SIZE");

    let updated = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const noradId = cols[catIdx]?.trim();
      if (!noradId || !noradMap.has(noradId)) continue;

      const dbId = noradMap.get(noradId)!;
      const parseDate = (s: string | undefined) => {
        if (!s?.trim()) return null;
        const d = new Date(s.trim());
        return isNaN(d.getTime()) ? null : d;
      };
      const parseFloat_ = (s: string | undefined) => {
        if (!s?.trim()) return null;
        const n = parseFloat(s.trim());
        return isNaN(n) ? null : n;
      };

      await db.satellite.update({
        where: { id: dbId },
        data: {
          objectType: cols[typeIdx]?.trim() || null,
          opsStatusCode: cols[statusIdx]?.trim() || null,
          owner: cols[ownerIdx]?.trim() || null,
          launchDate: parseDate(cols[launchDateIdx]),
          launchSiteCode: cols[launchSiteIdx]?.trim() || null,
          decayDate: parseDate(cols[decayDateIdx]),
          period: parseFloat_(cols[periodIdx]),
          inclination: parseFloat_(cols[inclinationIdx]),
          apogee: parseFloat_(cols[apogeeIdx]),
          perigee: parseFloat_(cols[perigeeIdx]),
          radarCrossSection: parseFloat_(cols[rcsIdx]),
          satcatUpdatedAt: new Date(),
        },
      });
      updated++;
    }

    // Record sync
    await db.dataSync.upsert({
      where: { source_entityType: { source: "celestrak_satcat", entityType: "bulk" } },
      update: {
        lastSyncAt: new Date(),
        recordCount: updated,
        status: "ok",
        errorMessage: null,
      },
      create: {
        source: "celestrak_satcat",
        entityType: "bulk",
        lastSyncAt: new Date(),
        recordCount: updated,
        status: "ok",
      },
    });

    return NextResponse.json({
      ok: true,
      stats: { updated, total: satellites.length },
    });
  } catch (error) {
    console.error("SATCAT sync failed:", error);
    return NextResponse.json(
      { error: "SATCAT sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}
