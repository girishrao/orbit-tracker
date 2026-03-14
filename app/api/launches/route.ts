import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAhead = new Date(now);
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  // Use dev endpoint in development (no rate limits); prod requires auth for higher limits
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "https://lldev.thespacedevs.com/2.3.0/launches/"
      : "https://ll.thespacedevs.com/2.3.0/launches/";
  const url = new URL(baseUrl);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "50");
  url.searchParams.set("ordering", "-net");
  url.searchParams.set("net__gte", threeMonthsAgo.toISOString());
  url.searchParams.set("net__lte", threeMonthsAhead.toISOString());

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(await dbFallback(threeMonthsAgo, threeMonthsAhead));
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const launches: any[] = data.results ?? [];

    // Map fields from LL2 response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = launches.map((launch: any) => ({
      id: launch.id,
      name: launch.name ?? "Unknown",
      net: new Date(launch.net),
      rocketName: launch.rocket?.configuration?.name ?? "Unknown",
      status: launch.status?.name ?? "Unknown",
      padName: launch.pad?.name ?? null,
      padLat: launch.pad?.latitude ? parseFloat(launch.pad.latitude) : null,
      padLon: launch.pad?.longitude ? parseFloat(launch.pad.longitude) : null,
      missionName: launch.mission?.name ?? null,
      missionDescription: launch.mission?.description ?? null,
      missionType: launch.mission?.type ?? null,
      orbit: launch.mission?.orbit?.name ?? null,
      orbitAbbrev: launch.mission?.orbit?.abbrev ?? null,
    }));

    // Upsert sequentially to avoid SQLite write-lock contention
    for (const row of rows) {
      const { id, ...fields } = row;
      await db.launch.upsert({
        where: { id },
        update: fields,
        create: { id, ...fields },
      });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch launches:", error);
    return NextResponse.json(await dbFallback(threeMonthsAgo, threeMonthsAhead));
  }
}

async function dbFallback(from: Date, to: Date) {
  try {
    return await db.launch.findMany({
      where: { net: { gte: from, lte: to } },
      orderBy: { net: "desc" },
      take: 50,
    });
  } catch {
    return [];
  }
}
