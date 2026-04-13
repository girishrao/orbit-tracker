import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Syncs launches from LL2 with full entity extraction:
// - Agency (launch service provider)
// - RocketConfig (rocket configuration)
// - LaunchPad (pad + location)
// - Core + CoreFlight (booster stages, landing outcomes)
// - Launch extended fields (window, probability, imagery, slug)
//
// Query params:
//   ?limit=100    max launches to fetch (default 100, max 200)
//   ?status=3     LL2 status filter (3 = Success, omit for all)
//   ?months=6     how far back to look (default 6)

const LL2_BASE =
  process.env.NODE_ENV === "development"
    ? "https://lldev.thespacedevs.com/2.3.0"
    : "https://ll.thespacedevs.com/2.3.0";

export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? 100), 200);
  const statusFilter = params.get("status"); // e.g. "3" for successful
  const months = Number(params.get("months") ?? 6);

  const now = new Date();
  const since = new Date(now);
  since.setMonth(since.getMonth() - months);

  const url = new URL(`${LL2_BASE}/launches/`);
  url.searchParams.set("format", "json");
  url.searchParams.set("mode", "detailed");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("ordering", "-net");
  url.searchParams.set("net__gte", since.toISOString());
  url.searchParams.set("net__lte", now.toISOString());
  if (statusFilter) url.searchParams.set("status", statusFilter);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `LL2 returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const launches: any[] = data.results ?? [];

    const stats = {
      launches: 0,
      agencies: 0,
      rocketConfigs: 0,
      pads: 0,
      cores: 0,
      coreFlights: 0,
    };

    for (const launch of launches) {
      // --- Agency (launch service provider) ---
      const lsp = launch.launch_service_provider;
      if (lsp?.id) {
        await db.agency.upsert({
          where: { id: lsp.id },
          update: {
            name: lsp.name ?? "Unknown",
            abbrev: lsp.abbrev ?? null,
            type: lsp.type?.name ?? null,
            countryCode: lsp.country?.[0]?.alpha_3_code ?? null,
            logoUrl: lsp.logo?.image_url ?? null,
            description: lsp.description ?? null,
          },
          create: {
            id: lsp.id,
            name: lsp.name ?? "Unknown",
            abbrev: lsp.abbrev ?? null,
            type: lsp.type?.name ?? null,
            countryCode: lsp.country?.[0]?.alpha_3_code ?? null,
            logoUrl: lsp.logo?.image_url ?? null,
            description: lsp.description ?? null,
          },
        });
        stats.agencies++;
      }

      // --- RocketConfig ---
      const config = launch.rocket?.configuration;
      if (config?.id) {
        await db.rocketConfig.upsert({
          where: { id: config.id },
          update: {
            name: config.name ?? "Unknown",
            family: config.families?.name ?? config.family ?? null,
            variant: config.variant ?? null,
            fullName: config.full_name ?? null,
            reusable: config.reusable ?? false,
            lengthMeters: config.length ? parseFloat(config.length) : null,
            diameterMeters: config.diameter ? parseFloat(config.diameter) : null,
            leoCapacityKg: config.leo_capacity ? parseFloat(config.leo_capacity) : null,
            gtoCapacityKg: config.gto_capacity ? parseFloat(config.gto_capacity) : null,
            thrustKn: config.to_thrust ? parseFloat(config.to_thrust) : null,
            totalLaunchCount: config.total_launch_count ?? null,
            successfulLaunches: config.successful_launches ?? null,
            failedLaunches: config.failed_launches ?? null,
            imageUrl: config.image?.image_url ?? null,
            wikiUrl: config.wiki_url ?? null,
          },
          create: {
            id: config.id,
            name: config.name ?? "Unknown",
            family: config.families?.name ?? config.family ?? null,
            variant: config.variant ?? null,
            fullName: config.full_name ?? null,
            reusable: config.reusable ?? false,
            lengthMeters: config.length ? parseFloat(config.length) : null,
            diameterMeters: config.diameter ? parseFloat(config.diameter) : null,
            leoCapacityKg: config.leo_capacity ? parseFloat(config.leo_capacity) : null,
            gtoCapacityKg: config.gto_capacity ? parseFloat(config.gto_capacity) : null,
            thrustKn: config.to_thrust ? parseFloat(config.to_thrust) : null,
            totalLaunchCount: config.total_launch_count ?? null,
            successfulLaunches: config.successful_launches ?? null,
            failedLaunches: config.failed_launches ?? null,
            imageUrl: config.image?.image_url ?? null,
            wikiUrl: config.wiki_url ?? null,
          },
        });
        stats.rocketConfigs++;
      }

      // --- LaunchPad ---
      const pad = launch.pad;
      if (pad?.id) {
        await db.launchPad.upsert({
          where: { id: pad.id },
          update: {
            name: pad.name ?? "Unknown",
            fullName: pad.location?.name
              ? `${pad.location.name} — ${pad.name}`
              : pad.name,
            latitude: pad.latitude ? parseFloat(pad.latitude) : null,
            longitude: pad.longitude ? parseFloat(pad.longitude) : null,
            locationName: pad.location?.name ?? null,
            countryCode: pad.country?.alpha_3_code ?? pad.location?.country_code ?? null,
            mapImageUrl: pad.map_image ?? null,
            totalLaunchCount: pad.total_launch_count ?? null,
            orbitalLaunchAttemptCount: pad.orbital_launch_attempt_count ?? null,
          },
          create: {
            id: pad.id,
            name: pad.name ?? "Unknown",
            fullName: pad.location?.name
              ? `${pad.location.name} — ${pad.name}`
              : pad.name,
            latitude: pad.latitude ? parseFloat(pad.latitude) : null,
            longitude: pad.longitude ? parseFloat(pad.longitude) : null,
            locationName: pad.location?.name ?? null,
            countryCode: pad.country?.alpha_3_code ?? pad.location?.country_code ?? null,
            mapImageUrl: pad.map_image ?? null,
            totalLaunchCount: pad.total_launch_count ?? null,
            orbitalLaunchAttemptCount: pad.orbital_launch_attempt_count ?? null,
          },
        });
        stats.pads++;
      }

      // --- Launch (extended fields) ---
      await db.launch.upsert({
        where: { id: launch.id },
        update: {
          name: launch.name ?? "Unknown",
          net: new Date(launch.net),
          rocketName: config?.name ?? "Unknown",
          status: launch.status?.name ?? "Unknown",
          statusAbbrev: launch.status?.abbrev ?? null,
          padName: pad?.name ?? null,
          padLat: pad?.latitude ? parseFloat(pad.latitude) : null,
          padLon: pad?.longitude ? parseFloat(pad.longitude) : null,
          missionName: launch.mission?.name ?? null,
          missionDescription: launch.mission?.description ?? null,
          missionType: launch.mission?.type ?? null,
          orbit: launch.mission?.orbit?.name ?? null,
          orbitAbbrev: launch.mission?.orbit?.abbrev ?? null,
          windowStart: launch.window_start ? new Date(launch.window_start) : null,
          windowEnd: launch.window_end ? new Date(launch.window_end) : null,
          probability: launch.probability ?? null,
          webcastLive: launch.webcast_live ?? false,
          imageUrl: launch.image?.image_url ?? null,
          infographicUrl: launch.infographic?.image_url ?? null,
          slug: launch.slug ?? null,
          rocketConfigId: config?.id ?? null,
          agencyId: lsp?.id ?? null,
          padId: pad?.id ?? null,
        },
        create: {
          id: launch.id,
          name: launch.name ?? "Unknown",
          net: new Date(launch.net),
          rocketName: config?.name ?? "Unknown",
          status: launch.status?.name ?? "Unknown",
          statusAbbrev: launch.status?.abbrev ?? null,
          padName: pad?.name ?? null,
          padLat: pad?.latitude ? parseFloat(pad.latitude) : null,
          padLon: pad?.longitude ? parseFloat(pad.longitude) : null,
          missionName: launch.mission?.name ?? null,
          missionDescription: launch.mission?.description ?? null,
          missionType: launch.mission?.type ?? null,
          orbit: launch.mission?.orbit?.name ?? null,
          orbitAbbrev: launch.mission?.orbit?.abbrev ?? null,
          windowStart: launch.window_start ? new Date(launch.window_start) : null,
          windowEnd: launch.window_end ? new Date(launch.window_end) : null,
          probability: launch.probability ?? null,
          webcastLive: launch.webcast_live ?? false,
          imageUrl: launch.image?.image_url ?? null,
          infographicUrl: launch.infographic?.image_url ?? null,
          slug: launch.slug ?? null,
          rocketConfigId: config?.id ?? null,
          agencyId: lsp?.id ?? null,
          padId: pad?.id ?? null,
        },
      });
      stats.launches++;

      // --- Core + CoreFlight (booster stages) ---
      const stages = launch.rocket?.launcher_stage ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const stage of stages) {
        const launcher = stage.launcher;
        if (!launcher?.serial_number) continue;

        const coreId = launcher.id ? String(launcher.id) : launcher.serial_number;

        await db.core.upsert({
          where: { id: coreId },
          update: {
            serialNumber: launcher.serial_number,
            status: launcher.status?.name ?? null,
            rocketConfigId: config?.id ?? null,
            totalFlights: stage.launcher_flight_number ?? 0,
            lastFlightDate: new Date(launch.net),
            reuseCount: stage.launcher_flight_number
              ? stage.launcher_flight_number - 1
              : 0,
          },
          create: {
            id: coreId,
            serialNumber: launcher.serial_number,
            status: launcher.status?.name ?? null,
            rocketConfigId: config?.id ?? null,
            totalFlights: stage.launcher_flight_number ?? 0,
            lastFlightDate: new Date(launch.net),
            reuseCount: stage.launcher_flight_number
              ? stage.launcher_flight_number - 1
              : 0,
          },
        });
        stats.cores++;

        // Compute turnaround from previous flight
        let turnaroundDays: number | null = null;
        if (stage.previous_flight_date) {
          const prev = new Date(stage.previous_flight_date);
          const diff = new Date(launch.net).getTime() - prev.getTime();
          turnaroundDays = Math.round(diff / (1000 * 60 * 60 * 24));
        }

        const landing = stage.landing;
        await db.coreFlight.upsert({
          where: { coreId_launchId: { coreId, launchId: launch.id } },
          update: {
            flightNumber: stage.launcher_flight_number ?? null,
            flightProven: launcher.flight_proven ?? false,
            landingAttempt: landing?.attempt ?? false,
            landingSuccess: landing?.success ?? null,
            landingType: landing?.landing_type?.abbrev ?? null,
            landingLocation: landing?.landing_location?.name ?? null,
            turnaroundDays,
          },
          create: {
            coreId,
            launchId: launch.id,
            flightNumber: stage.launcher_flight_number ?? null,
            flightProven: launcher.flight_proven ?? false,
            landingAttempt: landing?.attempt ?? false,
            landingSuccess: landing?.success ?? null,
            landingType: landing?.landing_type?.abbrev ?? null,
            landingLocation: landing?.landing_location?.name ?? null,
            turnaroundDays,
          },
        });
        stats.coreFlights++;
      }

      // --- Programs ---
      const programs = launch.program ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const prog of programs) {
        if (!prog?.id) continue;
        await db.program.upsert({
          where: { id: prog.id },
          update: {
            name: prog.name ?? "Unknown",
            description: prog.description ?? null,
            imageUrl: prog.image?.image_url ?? null,
            wikiUrl: prog.wiki_url ?? null,
          },
          create: {
            id: prog.id,
            name: prog.name ?? "Unknown",
            description: prog.description ?? null,
            imageUrl: prog.image?.image_url ?? null,
            wikiUrl: prog.wiki_url ?? null,
          },
        });

        // Link launch <-> program
        await db.launchProgram.upsert({
          where: { launchId_programId: { launchId: launch.id, programId: prog.id } },
          update: {},
          create: { launchId: launch.id, programId: prog.id },
        });
      }
    }

    // Record sync
    await db.dataSync.upsert({
      where: { source_entityType: { source: "ll2_launches", entityType: "detailed" } },
      update: {
        lastSyncAt: new Date(),
        recordCount: stats.launches,
        status: "ok",
        errorMessage: null,
      },
      create: {
        source: "ll2_launches",
        entityType: "detailed",
        lastSyncAt: new Date(),
        recordCount: stats.launches,
        status: "ok",
      },
    });

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("Launch sync failed:", error);
    return NextResponse.json(
      { error: "Launch sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}
