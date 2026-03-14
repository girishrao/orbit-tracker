import { NextResponse } from "next/server";

interface SatelliteEntry {
  noradId: number;
  name: string;
  tle1: string;
  tle2: string;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=TLE",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `CelesTrak returned ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const lines = text
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);

    const satellites: SatelliteEntry[] = [];

    for (let i = 0; i + 2 < lines.length && satellites.length < 1000; i += 3) {
      const name = lines[i].trim();
      const tle1 = lines[i + 1];
      const tle2 = lines[i + 2];

      // Validate TLE lines start with the correct line numbers
      if (!tle1.startsWith("1 ") || !tle2.startsWith("2 ")) continue;

      // Extract NORAD ID from TLE line 2 characters 2–7 (0-indexed: indices 2..6)
      const noradId = parseInt(tle2.substring(2, 7).trim(), 10);
      if (isNaN(noradId)) continue;

      satellites.push({ noradId, name, tle1, tle2 });
    }

    return NextResponse.json({ count: satellites.length, satellites });
  } catch (err) {
    console.error("[/api/satellites/constellation] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch constellation data" },
      { status: 500 }
    );
  }
}
