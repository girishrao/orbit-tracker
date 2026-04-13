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
  const buildUrl = (params: Record<string, string>) => {
    const url = new URL(baseUrl);
    url.searchParams.set("format", "json");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  };

  // Past: newest-first within the last 3 months, up to 50
  const pastUrl = buildUrl({
    limit: "50",
    ordering: "-net",
    net__gte: threeMonthsAgo.toISOString(),
    net__lte: now.toISOString(),
  });

  // Upcoming: soonest-first within the next 3 months, up to 50
  const upcomingUrl = buildUrl({
    limit: "50",
    ordering: "net",
    net__gt: now.toISOString(),
    net__lte: threeMonthsAhead.toISOString(),
  });

  try {
    const [pastRes, upcomingRes] = await Promise.all([
      fetch(pastUrl, { cache: "no-store" }),
      fetch(upcomingUrl, { cache: "no-store" }),
    ]);

    if (!pastRes.ok || !upcomingRes.ok) {
      return NextResponse.json(await dbFallback(threeMonthsAgo, threeMonthsAhead));
    }

    const [pastData, upcomingData] = await Promise.all([pastRes.json(), upcomingRes.json()]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const launches: any[] = [...(pastData.results ?? []), ...(upcomingData.results ?? [])];

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

    // Sort newest-first across the merged past + upcoming set
    rows.sort((a, b) => b.net.getTime() - a.net.getTime());

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
