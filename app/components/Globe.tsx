"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Entity as CesiumEntity } from "cesium";
import type { EciVec3 } from "satellite.js";

export interface SatelliteData {
  noradId: number;
  name: string;
  tle1: string;
  tle2: string;
}

interface GlobeProps {
  satellite?: SatelliteData;
  constellation?: SatelliteData[];
  onConstellationSelect?: (sat: SatelliteData | null) => void;
}

export default function Globe({ satellite, constellation, onConstellationSelect }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);
  const satCleanupRef = useRef<(() => void) | null>(null);
  const constellationCleanupRef = useRef<(() => void) | null>(null);
  // Always-current ref so the click handler (created once) calls the latest callback
  const onConstellationSelectRef = useRef(onConstellationSelect);
  useEffect(() => { onConstellationSelectRef.current = onConstellationSelect; }, [onConstellationSelect]);

  // Initialize Cesium viewer once
  useEffect(() => {
    if (!containerRef.current) return;

    (window as unknown as Record<string, unknown>).CESIUM_BASE_URL = "/cesium/";

    import("cesium").then(
      ({ Viewer, Ion, Color, ImageryLayer }) => {
        // Guard against React Strict Mode double-invoke creating two viewers
        if (!containerRef.current || viewerRef.current) return;

        Ion.defaultAccessToken =
          process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? "";

        const v = new Viewer(containerRef.current!, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          baseLayer: ImageryLayer.fromWorldImagery(),
        });

        // Dark space background
        v.scene.backgroundColor = Color.BLACK;
        v.scene.globe.baseColor = Color.fromCssColorString("#0a0f1a");
        if (v.scene.skyBox) v.scene.skyBox.show = true;
        if (v.scene.sun) v.scene.sun.show = true;
        if (v.scene.moon) v.scene.moon.show = true;
        if (v.scene.fog) v.scene.fog.enabled = false;

        // Dim the imagery so the globe looks more "space-like"
        v.scene.globe.imageryLayers.get(0).alpha = 0.6;

        viewerRef.current = v;
        window.dispatchEvent(new Event("resize"));
      }
    );

    return () => {
      if (satCleanupRef.current) {
        satCleanupRef.current();
        satCleanupRef.current = null;
      }
      if (constellationCleanupRef.current) {
        constellationCleanupRef.current();
        constellationCleanupRef.current = null;
      }
      const v = viewerRef.current as {
        destroy: () => void;
        isDestroyed: () => boolean;
      } | null;
      if (v && v.isDestroyed?.() === false) {
        v.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  // Satellite visualization effect
  const renderSatellite = useCallback(async (sat: SatelliteData) => {
    const v = viewerRef.current;
    if (!v) return null;

    try {
      const [cesium, satelliteJs] = await Promise.all([
        import("cesium"),
        import("satellite.js"),
      ]);

      const { Cartesian3, Color, CallbackPositionProperty, PolylineGlowMaterialProperty } = cesium;
      const viewer = v as import("cesium").Viewer;
      if (viewer.isDestroyed()) return null;

      const satrec = satelliteJs.twoline2satrec(sat.tle1, sat.tle2);

      function getPos(date: Date) {
        const pv = satelliteJs.propagate(satrec, date);
        if (!pv || typeof pv.position === "boolean" || !pv.position) return null;
        const gmst = satelliteJs.gstime(date);
        const gd = satelliteJs.eciToGeodetic(pv.position as EciVec3<number>, gmst);
        return {
          lon: satelliteJs.degreesLong(gd.longitude),
          lat: satelliteJs.degreesLat(gd.latitude),
          alt: gd.height * 1000, // km → m
        };
      }

      const now = new Date();
      const pos = getPos(now);
      if (!pos) {
        console.error("[Globe] Could not compute initial satellite position for", sat.name);
        return null;
      }

      // Use CallbackPositionProperty so Cesium evaluates position on every render frame
      const positionCallback = new CallbackPositionProperty(() => {
        const p = getPos(new Date());
        return p ? Cartesian3.fromDegrees(p.lon, p.lat, p.alt) : Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt);
      }, false);

      // Satellite dot + label
      const satEntity = viewer.entities.add({
        position: positionCallback,
        point: { pixelSize: 20, color: Color.LIME, outlineColor: Color.BLACK, outlineWidth: 2 },
        label: {
          text: sat.name,
          font: "13px monospace",
          fillColor: Color.WHITE,
          style: cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new cesium.Cartesian2(0, -24),
        },
        viewFrom: new Cartesian3(0, -2_000_000, 800_000),
      }) as CesiumEntity;

      // Forward ground track polyline (90 min, sampled every 60 s)
      let orbitEntity: CesiumEntity | null = null;
      try {
        const trackPositions: InstanceType<typeof Cartesian3>[] = [];
        for (let i = 0; i <= 90; i++) {
          const p = getPos(new Date(now.getTime() + i * 60_000));
          if (p) trackPositions.push(Cartesian3.fromDegrees(p.lon, p.lat, p.alt));
        }
        orbitEntity = viewer.entities.add({
          polyline: {
            positions: trackPositions,
            width: 2,
            material: new PolylineGlowMaterialProperty({ glowPower: 0.3, color: Color.CYAN.withAlpha(0.7) }),
          },
        }) as CesiumEntity;
      } catch (err) {
        console.warn("[Globe] Could not add orbit trail:", err);
      }

      // Fly to satellite then track it
      viewer.flyTo(satEntity).catch(() => {
        // flyTo can fail if entity has no position at viewer clock time; fall back to trackedEntity
      });
      viewer.trackedEntity = satEntity;

      return () => {
        if (!viewer.isDestroyed()) {
          viewer.trackedEntity = undefined;
          viewer.entities.remove(satEntity);
          if (orbitEntity) viewer.entities.remove(orbitEntity);
        }
      };
    } catch (err) {
      console.error("[Globe] renderSatellite failed:", err);
      return null;
    }
  }, []);

  // React to satellite prop changes
  useEffect(() => {
    // Clean up previous satellite
    if (satCleanupRef.current) {
      satCleanupRef.current();
      satCleanupRef.current = null;
    }

    if (!satellite) return;

    // Wait for viewer to be ready, then render
    const tryRender = () => {
      if (viewerRef.current) {
        renderSatellite(satellite).then((cleanup) => {
          if (cleanup) satCleanupRef.current = cleanup;
        });
      } else {
        // Viewer not yet initialized, retry shortly
        const t = setTimeout(tryRender, 200);
        return () => clearTimeout(t);
      }
    };
    const cancelRetry = tryRender();

    return () => {
      if (typeof cancelRetry === "function") cancelRetry();
      if (satCleanupRef.current) {
        satCleanupRef.current();
        satCleanupRef.current = null;
      }
    };
  }, [satellite, renderSatellite]);

  // Constellation visualization effect
  useEffect(() => {
    // Clear any previous constellation rendering
    if (constellationCleanupRef.current) {
      constellationCleanupRef.current();
      constellationCleanupRef.current = null;
    }

    if (!constellation || constellation.length === 0) return;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled) return;

      if (!viewerRef.current) {
        // Viewer not yet initialized, retry shortly
        const t = setTimeout(tryRender, 200);
        return () => clearTimeout(t);
      }

      (async () => {
        if (cancelled) return;

        try {
          const [cesium, satelliteJs] = await Promise.all([
            import("cesium"),
            import("satellite.js"),
          ]);

          if (cancelled) return;

          const { Cartesian3, Color, PointPrimitiveCollection, PolylineCollection, Material } = cesium;
          const viewer = viewerRef.current as import("cesium").Viewer;
          if (viewer.isDestroyed()) return;

          function getSatPos(
            satrec: ReturnType<typeof satelliteJs.twoline2satrec>,
            date: Date
          ) {
            const pv = satelliteJs.propagate(satrec, date);
            if (!pv || typeof pv.position === "boolean" || !pv.position)
              return null;
            const gmst = satelliteJs.gstime(date);
            const gd = satelliteJs.eciToGeodetic(
              pv.position as EciVec3<number>,
              gmst
            );
            return {
              lon: satelliteJs.degreesLong(gd.longitude),
              lat: satelliteJs.degreesLat(gd.latitude),
              alt: gd.height * 1000, // km → m
            };
          }

          // Compute one full orbit (90 min, 1-min samples), split at anti-meridian crossings
          function computeArcSegments(
            satrec: ReturnType<typeof satelliteJs.twoline2satrec>,
            now: Date
          ): { lon: number; lat: number; alt: number }[][] {
            const positions: { lon: number; lat: number; alt: number }[] = [];
            for (let m = 0; m <= 90; m++) {
              const pos = getSatPos(satrec, new Date(now.getTime() + m * 60_000));
              if (pos) positions.push(pos);
            }
            const segments: typeof positions[] = [];
            let current: typeof positions = [];
            for (let i = 0; i < positions.length; i++) {
              if (i > 0 && Math.abs(positions[i].lon - positions[i - 1].lon) > 180) {
                if (current.length > 1) segments.push(current);
                current = [];
              }
              current.push(positions[i]);
            }
            if (current.length > 1) segments.push(current);
            return segments;
          }

          // Parse all TLEs upfront
          const satrecs = constellation.map((sat) =>
            satelliteJs.twoline2satrec(sat.tle1, sat.tle2)
          );

          // --- Points ---
          const pointCollection = new PointPrimitiveCollection();
          viewer.scene.primitives.add(pointCollection);

          // id is set to the constellation index — used for pick detection
          const points = satrecs.map((_, i) =>
            pointCollection.add({
              position: Cartesian3.ZERO,
              pixelSize: 5,
              color: Color.CYAN.withAlpha(0.8),
              outlineWidth: 0,
              id: i,
            })
          );

          // --- Arc polylines ---
          const arcCollection = new PolylineCollection();
          viewer.scene.primitives.add(arcCollection);
          const arcColor = Color.CYAN.withAlpha(0.18);

          function buildArcs(now: Date) {
            arcCollection.removeAll();
            // removeAll() destroys materials attached to removed polylines, so each
            // polyline must get its own Material instance — never share across add() calls.
            satrecs.forEach((satrec) => {
              computeArcSegments(satrec, now).forEach((seg) => {
                arcCollection.add({
                  positions: seg.map((p) =>
                    Cartesian3.fromDegrees(p.lon, p.lat, p.alt)
                  ),
                  width: 1,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  material: Material.fromType("Color", { color: arcColor }) as any,
                });
              });
            });
          }

          // --- Initial render ---
          const now = new Date();
          satrecs.forEach((satrec, i) => {
            const pos = getSatPos(satrec, now);
            if (pos) {
              points[i].position = Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt);
            }
          });
          buildArcs(now);

          // --- Click to select ---
          const { ScreenSpaceEventHandler, ScreenSpaceEventType } = cesium;
          const clickHandler = new ScreenSpaceEventHandler(viewer.canvas);
          let selectedIdx: number | null = null;
          const normalColor = Color.CYAN.withAlpha(0.8);
          const selectedColor = Color.YELLOW;

          clickHandler.setInputAction((event: { position: import("cesium").Cartesian2 }) => {
            // scene.pick() returns the PointPrimitive directly for PointPrimitiveCollection;
            // the canonical Cesium pattern is to read picked.id which we set to the sat index.
            const picked = viewer.scene.pick(event.position);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const idx: number | undefined = (picked as any)?.id;

            // Reset previous selection
            if (selectedIdx !== null) {
              points[selectedIdx].color = normalColor;
              points[selectedIdx].pixelSize = 5;
            }

            if (typeof idx === "number" && idx >= 0 && idx < constellation.length) {
              points[idx].color = selectedColor;
              points[idx].pixelSize = 9;
              selectedIdx = idx;
              onConstellationSelectRef.current?.(constellation[idx]);
            } else {
              selectedIdx = null;
              onConstellationSelectRef.current?.(null);
            }
          }, ScreenSpaceEventType.LEFT_CLICK);

          // Update point positions every 10 seconds
          const pointInterval = setInterval(() => {
            if (viewer.isDestroyed()) return;
            const t = new Date();
            satrecs.forEach((satrec, i) => {
              const pos = getSatPos(satrec, t);
              if (pos) {
                points[i].position = Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt);
              }
            });
          }, 10_000);

          // Rebuild arcs every 5 minutes (orbit arc shape changes slowly)
          const arcInterval = setInterval(() => {
            if (viewer.isDestroyed()) return;
            buildArcs(new Date());
          }, 5 * 60_000);

          if (cancelled) {
            clearInterval(pointInterval);
            clearInterval(arcInterval);
            clickHandler.destroy();
            if (!viewer.isDestroyed()) {
              viewer.scene.primitives.remove(pointCollection);
              viewer.scene.primitives.remove(arcCollection);
            }
            return;
          }

          constellationCleanupRef.current = () => {
            clearInterval(pointInterval);
            clearInterval(arcInterval);
            clickHandler.destroy();
            if (!viewer.isDestroyed()) {
              viewer.scene.primitives.remove(pointCollection);
              viewer.scene.primitives.remove(arcCollection);
            }
          };
        } catch (err) {
          console.error("[Globe] constellation render failed:", err);
        }
      })();
    };

    tryRender();

    return () => {
      cancelled = true;
      if (constellationCleanupRef.current) {
        constellationCleanupRef.current();
        constellationCleanupRef.current = null;
      }
    };
  }, [constellation]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    />
  );
}
