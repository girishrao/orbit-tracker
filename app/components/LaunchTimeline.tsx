"use client";

import { useEffect, useState } from "react";

interface Launch {
  id: string;
  name: string;
  net: string;
  rocketName: string;
  status: string;
  padName: string | null;
  missionName: string | null;
  missionDescription: string | null;
  missionType: string | null;
  orbit: string | null;
  orbitAbbrev: string | null;
}

interface LauncherStage {
  type: string;
  reused: boolean;
  launcher_flight_number: number;
  launcher: {
    serial_number: string;
    flight_proven: boolean;
    status: { name: string };
  };
  landing: {
    attempt: boolean;
    success: boolean | null;
    location: { name: string } | null;
  } | null;
}

interface DetailData {
  rocket: {
    configuration: {
      name: string;
      full_name: string;
      reusable: boolean;
      description: string;
      total_launch_count: number;
      successful_launches: number;
    };
    launcher_stage: LauncherStage[];
    spacecraft_stage: {
      spacecraft: { name: string };
    } | null;
  };
  mission: {
    name: string;
    type: string;
    description: string;
    orbit: { name: string; abbrev: string } | null;
  } | null;
  program: Array<{ name: string; description: string }>;
  launch_service_provider: { name: string; abbrev: string };
}

interface LaunchTimelineProps {
  onFindSatellites?: (query: string) => void;
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("success")) return "bg-emerald-500";
  if (s.includes("fail") || s.includes("anomaly")) return "bg-red-500";
  if (s.includes("go") || s.includes("tbd") || s.includes("tbc"))
    return "bg-amber-400";
  if (s.includes("flight") || s.includes("in flight")) return "bg-blue-400";
  return "bg-white/30";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Derives a CelesTrak search term from a mission/launch name. */
function toSatelliteQuery(missionName: string | null, launchName: string): string {
  const source = missionName?.trim() || launchName.split("|").pop()?.trim() || launchName;
  return source.split(/[\s\-]/)[0].toUpperCase();
}

function landingDescription(stage: LauncherStage): string {
  const landing = stage.landing;
  if (!landing || !landing.attempt) return "Expended";
  if (landing.success === null) return "Landing attempt pending";
  if (landing.success) {
    const loc = landing.location?.name ?? "Unknown location";
    return `Landed: ${loc}`;
  }
  return "Landing attempt failed";
}

function LineageDetail({
  launch,
  detail,
  onFindSatellites,
}: {
  launch: Launch;
  detail: DetailData;
  onFindSatellites?: (query: string) => void;
}) {
  const config = detail.rocket.configuration;
  const stages = detail.rocket.launcher_stage ?? [];
  const mission = detail.mission;
  const programs = detail.program ?? [];
  const provider = detail.launch_service_provider;

  return (
    <div className="space-y-0">
      {/* ROCKET node */}
      <div className="border border-white/10 rounded-t-md px-3 py-2 bg-white/[0.04]">
        <p className="text-white/30 font-mono text-[9px] uppercase tracking-widest mb-0.5">
          Rocket
        </p>
        <p className="text-white font-mono text-xs font-semibold">{config.full_name || config.name}</p>
        <p className="text-white/40 font-mono text-[11px] mt-0.5">
          {provider.name}
          {config.total_launch_count > 0 && ` · ${config.total_launch_count} flights`}
          {config.reusable && " · Reusable"}
        </p>
      </div>

      {/* Connector */}
      <div className="border-l-2 border-white/10 ml-4 h-2" />

      {/* BOOSTER nodes */}
      {stages.length > 0 ? (
        stages.map((stage, i) => (
          <div key={i}>
            <div className="border border-white/10 px-3 py-2 bg-white/[0.04]">
              <p className="text-white/30 font-mono text-[9px] uppercase tracking-widest mb-0.5">
                Booster
              </p>
              <p className="text-white font-mono text-xs font-semibold">
                {stage.launcher.serial_number}
                {" · "}
                <span className="text-white/60 font-normal">
                  Flight #{stage.launcher_flight_number}
                </span>
              </p>
              <p className="text-white/40 font-mono text-[11px] mt-0.5">
                {stage.type}
                {stage.reused && " · Reused"}
                {" · "}
                {landingDescription(stage)}
              </p>
            </div>
            {(i < stages.length - 1 || mission || programs.length > 0) && (
              <div className="border-l-2 border-white/10 ml-4 h-2" />
            )}
          </div>
        ))
      ) : null}

      {/* MISSION node */}
      {mission && (
        <>
          <div className="border border-white/10 px-3 py-2 bg-white/[0.04]">
            <p className="text-white/30 font-mono text-[9px] uppercase tracking-widest mb-0.5">
              Mission
            </p>
            <p className="text-white font-mono text-xs font-semibold">{mission.name}</p>
            <p className="text-white/40 font-mono text-[11px] mt-0.5">
              {mission.type}
              {mission.orbit && ` · ${mission.orbit.abbrev} — ${mission.orbit.name}`}
            </p>
            {mission.description && (
              <p className="text-white/50 font-mono text-[11px] mt-1.5 leading-relaxed line-clamp-3">
                {mission.description}
              </p>
            )}
          </div>
          {programs.length > 0 && (
            <div className="border-l-2 border-white/10 ml-4 h-2" />
          )}
        </>
      )}

      {/* PROGRAM nodes */}
      {programs.map((prog, i) => (
        <div key={i}>
          <div className="border border-white/10 px-3 py-2 bg-white/[0.04]">
            <p className="text-white/30 font-mono text-[9px] uppercase tracking-widest mb-0.5">
              Program
            </p>
            <p className="text-white font-mono text-xs font-semibold">{prog.name}</p>
          </div>
          {i < programs.length - 1 && (
            <div className="border-l-2 border-white/10 ml-4 h-2" />
          )}
        </div>
      ))}

      {/* TRACK button */}
      {onFindSatellites && (
        <>
          <div className="border-l-2 border-white/10 ml-4 h-2" />
          <div className="border border-white/10 rounded-b-md px-3 py-2 bg-white/[0.04]">
            <button
              onClick={() =>
                onFindSatellites(toSatelliteQuery(launch.missionName, launch.name))
              }
              className="text-cyan-400/80 font-mono text-[11px] border border-cyan-400/30 px-3 py-1 rounded hover:bg-cyan-400/10 transition-colors"
            >
              ↗ Find &amp; Track Satellites
            </button>
          </div>
        </>
      )}

      {/* If no track button, round off the last node */}
      {!onFindSatellites && (
        <div className="border-b border-l border-r border-white/10 rounded-b-md h-1" />
      )}
    </div>
  );
}

export default function LaunchTimeline({ onFindSatellites }: LaunchTimelineProps) {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, DetailData>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/launches")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch launches");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setLaunches(data);
        else throw new Error("Unexpected response");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!expandedId) return;
    if (detailCache[expandedId]) return;

    setDetailLoading(expandedId);
    fetch(`/api/launches/${expandedId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch launch detail");
        return res.json();
      })
      .then((data: DetailData) => {
        setDetailCache((prev) => ({ ...prev, [expandedId]: data }));
      })
      .catch(() => {
        // silently ignore — the expanded section will show a loading/error state
      })
      .finally(() => {
        setDetailLoading((cur) => (cur === expandedId ? null : cur));
      });
  }, [expandedId, detailCache]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/40 font-mono text-sm animate-pulse">
          Loading launches...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400 font-mono text-sm">Error: {error}</p>
      </div>
    );
  }

  if (launches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/40 font-mono text-sm">No launches found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-2xl mx-auto space-y-3">
        {launches.map((launch) => {
          const isExpanded = expandedId === launch.id;
          const isLoadingDetail = detailLoading === launch.id;
          const detail = detailCache[launch.id];

          return (
            <div
              key={launch.id}
              onClick={() => setExpandedId(isExpanded ? null : launch.id)}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                isExpanded
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-mono text-sm font-semibold truncate">
                    {launch.name}
                  </h3>
                  <p className="text-white/50 font-mono text-xs mt-1">
                    {launch.rocketName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`${statusColor(launch.status)} text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase`}
                  >
                    {launch.status}
                  </span>
                  <span className="text-white/20 font-mono text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-white/30 font-mono text-[11px]">
                <span>{formatDate(launch.net)}</span>
                {launch.padName && (
                  <>
                    <span className="text-white/15">|</span>
                    <span className="truncate">{launch.padName}</span>
                  </>
                )}
              </div>

              {/* Expanded lineage detail */}
              {isExpanded && (
                <div
                  className="mt-3 pt-3 border-t border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isLoadingDetail && (
                    <p className="text-white/30 font-mono text-xs animate-pulse">
                      Loading lineage...
                    </p>
                  )}
                  {!isLoadingDetail && !detail && (
                    <p className="text-white/30 font-mono text-xs">
                      Failed to load detail.
                    </p>
                  )}
                  {detail && (
                    <LineageDetail
                      launch={launch}
                      detail={detail}
                      onFindSatellites={onFindSatellites}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
