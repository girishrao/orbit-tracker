import { NextRequest, NextResponse } from "next/server";

const LL2_URL = "https://ll.thespacedevs.com/2.3.0/launches/";

export interface MissionResult {
  launchId: string;
  launchName: string;
  missionName: string | null;
  description: string | null;
  type: string | null;
  orbit: string | null;
  orbitAbbrev: string | null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${LL2_URL}?search=${encodeURIComponent(q.trim())}&format=json&limit=3&ordering=-net`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: MissionResult[] = (data.results ?? []).flatMap((l: any) => {
      if (!l.mission) return [];
      return [{
        launchId: l.id,
        launchName: l.name,
        missionName: l.mission.name ?? null,
        description: l.mission.description ?? null,
        type: l.mission.type ?? null,
        orbit: l.mission.orbit?.name ?? null,
        orbitAbbrev: l.mission.orbit?.abbrev ?? null,
      }];
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
