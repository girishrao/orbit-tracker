// Restore data from prisma/data-dump/*.json into the current DATABASE_URL.
// Used once to migrate the SQLite dev snapshot into Neon Postgres.
// Run with: npm run db:seed  (requires DATABASE_URL pointing at the target Postgres)

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../lib/db";

const DUMP_DIR = join(__dirname, "..", "prisma", "data-dump");

// Tables in FK-safe insertion order.
const TABLES = [
  "Agency",
  "RocketConfig",
  "LaunchPad",
  "Program",
  "DataSync",
  "Core",
  "Launch",
  "Satellite",
  "CoreFlight",
  "LaunchProgram",
  "ProgramAgency",
  "Payload",
  "TleSnapshot",
  "Conjunction",
] as const;

// Looks like 2026-04-10T21:25:41.138+00:00 — strict ISO-with-offset check.
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

function reviveDates<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && ISO_DATE_RE.test(v)) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function loadTable(name: string): Record<string, unknown>[] {
  const raw = readFileSync(join(DUMP_DIR, `${name}.json`), "utf-8").trim();
  if (!raw || raw === "[]") return [];
  const rows = JSON.parse(raw) as Record<string, unknown>[];
  return rows.map(reviveDates);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  console.log(`Seeding ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ":***@")}`);

  for (const table of TABLES) {
    const rows = loadTable(table);
    if (rows.length === 0) {
      console.log(`  ${table}: skip (empty)`);
      continue;
    }
    // Prisma model name = lowercase first letter (e.g. Launch -> launch)
    const modelKey = (table[0].toLowerCase() + table.slice(1)) as keyof typeof db;
    // @ts-expect-error — dynamic model access; types vary per table
    const result = await db[modelKey].createMany({ data: rows });
    console.log(`  ${table}: inserted ${result.count}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
