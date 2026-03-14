import { NextRequest, NextResponse } from "next/server";

const CELESTRAK_GP_URL = "https://celestrak.org/NORAD/elements/gp.php";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing 'q' query parameter" },
      { status: 400 }
    );
  }

  try {
    // Search CelesTrak by satellite name (returns JSON with GP elements)
    const res = await fetch(`${CELESTRAK_GP_URL}?NAME=${encodeURIComponent(q)}&FORMAT=JSON`);

    if (!res.ok) {
      return NextResponse.json(
        { error: `CelesTrak returned status ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();

    // CelesTrak returns "No GP data found" as plain text when no results
    if (text.startsWith("No GP") || text.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const data = JSON.parse(text);
    const results = Array.isArray(data)
      ? data.map((item: { NORAD_CAT_ID: number; OBJECT_NAME: string }) => ({
          noradId: item.NORAD_CAT_ID,
          name: item.OBJECT_NAME,
        }))
      : [{ noradId: data.NORAD_CAT_ID, name: data.OBJECT_NAME }];

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Satellite search error:", err);
    return NextResponse.json(
      { error: "Failed to search satellites" },
      { status: 500 }
    );
  }
}
