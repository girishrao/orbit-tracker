"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { SatelliteData } from "@/app/components/Globe";

const Globe = dynamic(() => import("@/app/components/Globe"), { ssr: false });
const LaunchTimeline = dynamic(
  () => import("@/app/components/LaunchTimeline"),
  { ssr: false }
);
const SatelliteSearch = dynamic(
  () => import("@/app/components/SatelliteSearch"),
  { ssr: false }
);
const OrbitalInfo = dynamic(() => import("@/app/components/OrbitalInfo"), {
  ssr: false,
});

type View = "globe" | "launches" | "all";

export default function Home() {
  const [view, setView] = useState<View>("globe");
  const [selectedSatellite, setSelectedSatellite] =
    useState<SatelliteData | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string>("");
  const [constellation, setConstellation] = useState<SatelliteData[]>([]);
  const [constellationLoading, setConstellationLoading] = useState(false);
  const [selectedConstellationSat, setSelectedConstellationSat] = useState<SatelliteData | null>(null);

  // Called from LaunchTimeline's "Find & Track Satellites" button
  const handleFindSatellites = useCallback((query: string) => {
    setPendingQuery(query);
    setView("globe");
  }, []);

  // Fetch constellation data once when switching to "all" view
  useEffect(() => {
    if (view !== "all") return;
    if (constellation.length > 0) return;

    setConstellationLoading(true);
    fetch("/api/satellites/constellation")
      .then((res) => res.json())
      .then((data: { satellites: SatelliteData[] }) => {
        setConstellation(data.satellites ?? []);
      })
      .catch((err) => {
        console.error("[Home] Failed to fetch constellation:", err);
      })
      .finally(() => {
        setConstellationLoading(false);
      });
  }, [view, constellation.length]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {view === "globe" && (
        <Globe satellite={selectedSatellite ?? undefined} />
      )}
      {view === "all" && (
        <Globe
          constellation={constellation}
          onConstellationSelect={setSelectedConstellationSat}
        />
      )}
      {view === "launches" && (
        <LaunchTimeline onFindSatellites={handleFindSatellites} />
      )}

      {/* HUD overlay */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h1 className="text-white text-2xl font-mono font-bold tracking-widest uppercase">
          Orbit Tracker
        </h1>
        <p className="text-white/40 text-xs font-mono mt-1">
          Real-time satellite &amp; launch visualization
        </p>
      </div>

      {/* View toggle */}
      <div className="absolute top-6 right-6 flex gap-1 font-mono text-xs">
        <button
          onClick={() => setView("globe")}
          className={`px-3 py-1.5 rounded-l border transition-colors ${
            view === "globe"
              ? "bg-white/15 text-white border-white/30"
              : "bg-transparent text-white/40 border-white/10 hover:text-white/60"
          }`}
        >
          Globe
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-3 py-1.5 border-y border-r transition-colors ${
            view === "all"
              ? "bg-white/15 text-white border-white/30"
              : "bg-transparent text-white/40 border-white/10 hover:text-white/60"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setView("launches")}
          className={`px-3 py-1.5 rounded-r border transition-colors ${
            view === "launches"
              ? "bg-white/15 text-white border-white/30"
              : "bg-transparent text-white/40 border-white/10 hover:text-white/60"
          }`}
        >
          Launches
        </button>
      </div>

      {/* Satellite search — below toggle, right side */}
      {view === "globe" && (
        <div className="absolute top-16 right-6">
          <SatelliteSearch
            onSelect={setSelectedSatellite}
            pendingQuery={pendingQuery}
          />
        </div>
      )}

      {/* Orbital info panel — bottom right */}
      {view === "globe" && selectedSatellite && (
        <div className="absolute bottom-6 right-6">
          <OrbitalInfo satellite={selectedSatellite} />
        </div>
      )}

      {/* Orbital info panel — bottom right (All view) */}
      {view === "all" && selectedConstellationSat && (
        <div className="absolute bottom-6 right-6">
          <OrbitalInfo satellite={selectedConstellationSat} />
        </div>
      )}

      {/* Constellation status badge — bottom left */}
      {view === "all" && (
        <div className="absolute bottom-6 left-6 pointer-events-none">
          <span className="font-mono text-xs text-cyan-400/80 bg-black/40 px-3 py-1.5 rounded border border-cyan-400/20">
            {constellationLoading
              ? "LOADING..."
              : `${constellation.length} OBJECTS · LAST 30 DAYS`}
          </span>
        </div>
      )}
    </main>
  );
}
