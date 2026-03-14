import { NextRequest, NextResponse } from "next/server";

const SATCAT_CSV_URL = "https://celestrak.org/pub/satcat.csv";

// Country/org codes → human-readable names
const OWNER_NAMES: Record<string, string> = {
  US: "United States",
  CIS: "Russia / CIS",
  PRC: "China",
  ESA: "European Space Agency",
  ISS: "International Space Station",
  JPN: "Japan",
  IND: "India",
  FR: "France",
  UK: "United Kingdom",
  GER: "Germany",
  IRAN: "Iran",
  ITSO: "Intelsat",
  SES: "SES",
  NATO: "NATO",
  IM: "Iridium",
  GLOB: "Globalstar",
  O3B: "O3b Networks",
  STCT: "SES / O3b",
  LMCO: "Lockheed Martin",
  BSSC: "Boeing",
  EUTE: "Eutelsat",
  SXMA: "SpaceX",
};

// Object type codes → readable labels
const OBJECT_TYPES: Record<string, string> = {
  PAY: "Payload",
  "R/B": "Rocket Body",
  DEB: "Debris",
  UNK: "Unknown",
};

// Operational status codes → readable labels
const OPS_STATUS: Record<string, string> = {
  "+": "Operational",
  "-": "Non-operational",
  P: "Partially operational",
  B: "Backup / standby",
  S: "Spare",
  X: "Extended mission",
  D: "Decayed",
  "?": "Unknown",
};

// Infer likely manufacturer from satellite name — covers common constellations
function inferManufacturer(name: string): string | null {
  const n = name.toUpperCase();
  if (n.startsWith("STARLINK")) return "SpaceX";
  if (n.startsWith("ONEWEB") || n.includes("EUTELSAT ONEWEB"))
    return "Airbus Defence & Space";
  if (n.startsWith("KUIPER")) return "Amazon / SpaceTech";
  if (n.startsWith("IRIDIUM")) return "Thales Alenia Space";
  if (n.startsWith("GPS ") || n.startsWith("GPS-")) return "Lockheed Martin";
  if (n.startsWith("GLONASS")) return "ISS Reshetnev";
  if (n.startsWith("GLOBALSTAR")) return "Thales Alenia Space";
  if (n.startsWith("ORBCOMM")) return "Sierra Nevada Corp";
  if (n.startsWith("SPIRE") || n.startsWith("LEMUR")) return "Spire Global";
  if (n.startsWith("PLANET") || n.startsWith("SKYSAT") || n.startsWith("DOVE"))
    return "Planet Labs";
  if (n.startsWith("BLACKSKY")) return "BlackSky Technology";
  if (n.startsWith("ICEYE")) return "ICEYE";
  if (n.startsWith("CAPELLA")) return "Capella Space";
  if (n.startsWith("SWARM")) return "Swarm Technologies";
  return null;
}

export interface SatcatData {
  noradId: number;
  objectType: string;
  opsStatus: string;
  owner: string;
  launchDate: string;
  launchSite: string;
  manufacturer: string | null;
}

export async function GET(request: NextRequest) {
  const noradId = request.nextUrl.searchParams.get("noradId");
  if (!noradId || isNaN(Number(noradId))) {
    return NextResponse.json({ error: "Missing noradId" }, { status: 400 });
  }

  try {
    const res = await fetch(SATCAT_CSV_URL, {
      next: { revalidate: 86400 }, // cache for 24 hours
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch SATCAT" },
        { status: 502 }
      );
    }

    const csv = await res.text();
    const lines = csv.split("\n");
    const header = lines[0].split(",");
    const idx = (col: string) => header.indexOf(col);

    const catIdx = idx("NORAD_CAT_ID");
    const target = noradId.padStart(5, "0");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (!cols[catIdx]) continue;
      if (cols[catIdx].trim() !== noradId && cols[catIdx].trim() !== target)
        continue;

      const name = cols[idx("OBJECT_NAME")]?.trim() ?? "";
      const ownerCode = cols[idx("OWNER")]?.trim() ?? "";
      const typeCode = cols[idx("OBJECT_TYPE")]?.trim() ?? "";
      const statusCode = cols[idx("OPS_STATUS_CODE")]?.trim() ?? "";
      const launchDate = cols[idx("LAUNCH_DATE")]?.trim() ?? "";
      const launchSite = cols[idx("LAUNCH_SITE")]?.trim() ?? "";

      return NextResponse.json({
        noradId: Number(noradId),
        objectType: OBJECT_TYPES[typeCode] ?? typeCode,
        opsStatus: OPS_STATUS[statusCode] ?? "Unknown",
        owner: OWNER_NAMES[ownerCode] ?? ownerCode,
        launchDate,
        launchSite,
        manufacturer: inferManufacturer(name),
      } satisfies SatcatData);
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error("[satcat]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
