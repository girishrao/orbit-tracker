import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const CELESTRAK_GP_URL = "https://celestrak.org/NORAD/elements/gp.php";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Missing or invalid 'id' query parameter (NORAD catalog number)" },
      { status: 400 }
    );
  }

  const noradId = Number(id);

  try {
    // Fetch TLE from CelesTrak
    const res = await fetch(`${CELESTRAK_GP_URL}?CATNR=${noradId}&FORMAT=TLE`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `CelesTrak returned status ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const lines = text.trim().split("\n").map((l) => l.trim());

    if (lines.length < 3 || !lines[1].startsWith("1 ") || !lines[2].startsWith("2 ")) {
      return NextResponse.json(
        { error: "No TLE data found for this NORAD ID" },
        { status: 404 }
      );
    }

    const name = lines[0];
    const tle1 = lines[1];
    const tle2 = lines[2];

    // Parse TLE epoch from line 1 (cols 18-32: YY + day-of-year fraction)
    const epochYear = parseInt(tle1.substring(18, 20), 10);
    const epochDay = parseFloat(tle1.substring(20, 32));
    const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear;
    const tleEpoch = new Date(Date.UTC(fullYear, 0, 1));
    tleEpoch.setTime(tleEpoch.getTime() + (epochDay - 1) * 86400000);

    // Upsert into database
    const satellite = await db.satellite.upsert({
      where: { noradId },
      update: { name, tle1, tle2, tleEpoch },
      create: { noradId, name, tle1, tle2, tleEpoch },
    });

    // Archive TLE snapshot if epoch differs from last stored snapshot
    try {
      await db.tleSnapshot.upsert({
        where: { noradId_epoch: { noradId, epoch: tleEpoch } },
        update: { tle1, tle2, source: "celestrak" },
        create: {
          satelliteId: satellite.id,
          noradId,
          epoch: tleEpoch,
          tle1,
          tle2,
          source: "celestrak",
        },
      });
    } catch {
      // Non-critical — don't fail the main request if snapshot fails
    }

    return NextResponse.json({
      noradId: satellite.noradId,
      name: satellite.name,
      tle1: satellite.tle1,
      tle2: satellite.tle2,
      updatedAt: satellite.updatedAt,
    });
  } catch (err) {
    console.error("TLE fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch TLE data" },
      { status: 500 }
    );
  }
}
