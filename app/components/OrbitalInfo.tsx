"use client";

import { useEffect, useState } from "react";
import type { SatelliteData } from "./Globe";
import type { MissionResult } from "@/app/api/mission/search/route";
import type { SatcatData } from "@/app/api/satellites/satcat/route";

interface OrbitalInfoProps {
  satellite: SatelliteData;
}

interface OrbitalElements {
  inclination: number;
  eccentricity: number;
  period: number;
  apogee: number;
  perigee: number;
  altitude: number;
  nextPass: string;
}

const EARTH_RADIUS_KM = 6371;

function degreesToRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function OrbitalInfo({ satellite }: OrbitalInfoProps) {
  const [elements, setElements] = useState<OrbitalElements | null>(null);
  const [mission, setMission] = useState<MissionResult | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [satcat, setSatcat] = useState<SatcatData | null>(null);

  // Compute orbital elements + next pass
  useEffect(() => {
    let cancelled = false;

    import("satellite.js").then((sat) => {
      if (cancelled) return;

      const satrec = sat.twoline2satrec(satellite.tle1, satellite.tle2);

      const inclination = (satrec.inclo * 180) / Math.PI;
      const eccentricity = satrec.ecco;
      const meanMotionRadMin = satrec.no;
      const periodMin = (2 * Math.PI) / meanMotionRadMin;

      const mu = 398600.4418;
      const periodSec = periodMin * 60;
      const semiMajorAxis = Math.pow(
        (mu * periodSec * periodSec) / (4 * Math.PI * Math.PI),
        1 / 3
      );

      const apogee = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS_KM;
      const perigee = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS_KM;

      const now = new Date();
      const posVel = sat.propagate(satrec, now);
      let altitude = 0;
      if (posVel && posVel.position && typeof posVel.position !== "boolean") {
        const gmst = sat.gstime(now);
        const gd = sat.eciToGeodetic(
          posVel.position as { x: number; y: number; z: number },
          gmst
        );
        altitude = gd.height;
      }

      let nextPass = "No location available";

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return;
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const observerGd = {
              latitude: degreesToRadians(userLat),
              longitude: degreesToRadians(userLon),
              height: 0,
            };

            let passTime: Date | null = null;
            const searchStart = new Date();

            for (let i = 0; i < 2880; i++) {
              const t = new Date(searchStart.getTime() + i * 30000);
              const pv = sat.propagate(satrec, t);
              if (!pv || !pv.position || typeof pv.position === "boolean") continue;
              const g = sat.gstime(t);
              const posEcf = sat.eciToEcf(
                pv.position as { x: number; y: number; z: number },
                g
              );
              const lookAngles = sat.ecfToLookAngles(observerGd, posEcf);
              if (lookAngles.elevation > 0.17) {
                passTime = t;
                break;
              }
            }

            if (cancelled) return;

            const passStr = passTime
              ? formatPassTime(passTime)
              : "No pass in next 24h";

            setElements({
              inclination,
              eccentricity,
              period: periodMin,
              apogee,
              perigee,
              altitude,
              nextPass: passStr,
            });
          },
          () => {
            if (cancelled) return;
            setElements({
              inclination,
              eccentricity,
              period: periodMin,
              apogee,
              perigee,
              altitude,
              nextPass: "Location access denied",
            });
          }
        );
      } else {
        setElements({
          inclination,
          eccentricity,
          period: periodMin,
          apogee,
          perigee,
          altitude,
          nextPass,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [satellite]);

  // Fetch mission info from LL2 by satellite name
  useEffect(() => {
    setMission(null);
    setMissionLoading(true);

    // Strip parenthetical suffix for better matching: "ISS (ZARYA)" → "ISS"
    const searchName =
      satellite.name.replace(/\s*\(.*?\)\s*/, "").trim() || satellite.name;

    fetch(`/api/mission/search?q=${encodeURIComponent(searchName)}`)
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data) => setMission(data.results?.[0] ?? null))
      .catch(() => setMission(null))
      .finally(() => setMissionLoading(false));
  }, [satellite]);

  // Fetch SATCAT metadata (owner, type, status, manufacturer inference)
  useEffect(() => {
    setSatcat(null);
    fetch(`/api/satellites/satcat?noradId=${satellite.noradId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSatcat(data ?? null))
      .catch(() => setSatcat(null));
  }, [satellite]);

  if (!elements) {
    return (
      <div className="bg-black/60 backdrop-blur border border-white/20 rounded p-4 w-72 pointer-events-auto">
        <div className="text-white/40 font-mono text-xs">
          Computing orbital data...
        </div>
      </div>
    );
  }

  const rows: [string, string][] = [
    ["SATELLITE", satellite.name],
    ["NORAD ID", String(satellite.noradId)],
    ["INCLINATION", `${elements.inclination.toFixed(1)}\u00B0`],
    ["ECCENTRICITY", elements.eccentricity.toFixed(4)],
    ["PERIOD", `${elements.period.toFixed(1)} min`],
    ["APOGEE", `${elements.apogee.toFixed(0)} km`],
    ["PERIGEE", `${elements.perigee.toFixed(0)} km`],
    ["ALTITUDE", `${elements.altitude.toFixed(0)} km`],
    ["NEXT PASS", elements.nextPass],
  ];

  const satcatRows: [string, string][] = satcat
    ? [
        ...(satcat.manufacturer ? [["MANUFACTURER", satcat.manufacturer] as [string, string]] : []),
        ["OPERATOR", satcat.owner],
        ["TYPE", satcat.objectType],
        ["STATUS", satcat.opsStatus],
      ]
    : [];

  return (
    <div className="bg-black/60 backdrop-blur border border-white/20 rounded p-4 w-72 pointer-events-auto">
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="text-white/40 font-mono text-xs pr-4 py-0.5 whitespace-nowrap">
                {label}
              </td>
              <td className="text-white font-mono text-xs py-0.5 text-right">
                {value}
              </td>
            </tr>
          ))}
          {satcatRows.length > 0 && (
            <tr><td colSpan={2} className="pt-2 pb-0.5"><div className="border-t border-white/10" /></td></tr>
          )}
          {satcatRows.map(([label, value]) => (
            <tr key={label}>
              <td className="text-white/40 font-mono text-xs pr-4 py-0.5 whitespace-nowrap">
                {label}
              </td>
              <td className="text-white font-mono text-xs py-0.5 text-right">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mission / payload description */}
      {(missionLoading || mission) && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {missionLoading ? (
            <p className="text-white/30 font-mono text-xs animate-pulse">
              Looking up mission...
            </p>
          ) : mission ? (
            <>
              <p className="text-white/40 font-mono text-[10px] uppercase tracking-wider mb-1">
                Mission
              </p>
              {mission.missionName && (
                <p className="text-white font-mono text-xs mb-1">
                  {mission.missionName}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-2">
                {mission.type && (
                  <span className="text-white/40 font-mono text-[10px] border border-white/10 px-1.5 py-0.5 rounded">
                    {mission.type}
                  </span>
                )}
                {mission.orbitAbbrev && (
                  <span className="text-white/40 font-mono text-[10px] border border-white/10 px-1.5 py-0.5 rounded">
                    {mission.orbitAbbrev}
                  </span>
                )}
              </div>
              {mission.description && (
                <p className="text-white/50 font-mono text-[11px] leading-relaxed">
                  {mission.description.length > 220
                    ? mission.description.slice(0, 220) + "\u2026"
                    : mission.description}
                </p>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatPassTime(passTime: Date): string {
  const now = new Date();
  const diffMs = passTime.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;

  const utcTime = passTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });

  const relativeStr =
    hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;

  return `${utcTime} UTC (${relativeStr})`;
}
