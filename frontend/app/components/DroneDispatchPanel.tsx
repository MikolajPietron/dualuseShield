"use client";

import { useState, useEffect, useRef, useCallback, MutableRefObject } from "react";
import { Navigation, Battery, MapPin, X, Radio, ChevronRight, Crosshair, Video, Signal } from "lucide-react";
import { DRONE_FLEET, DroneAsset } from "../data/fleetData";

interface DroneDispatchPanelProps {
  viewerRef: MutableRefObject<any>;
  onOpenChange?: (open: boolean) => void;
}

type DispatchPhase = "closed" | "select" | "target" | "flying" | "arrived";

// Battery level simulation — varies per drone
const BATTERY_LEVELS: Record<string, number> = {
  "ZK-01": 42,    // in mission — partially drained
  "ZK-02": 91,    // available — nearly full
  "ZK-03": 58,    // charging — mid charge
  "POL-01": 87,   // available
  "POL-02": 31,   // in mission — low
  "PSP-01": 55,   // in mission
  "PSP-04": 95,   // available — full
  "OSP-PYS": 78,  // available
  "OSP-BOJ": 0,   // maintenance
};

function getRangeKm(drone: DroneAsset): number {
  const maxKm = parseFloat(drone.maxRange);
  const battery = BATTERY_LEVELS[drone.id] ?? 80;
  return maxKm * (battery / 100);
}

function getBatteryColor(level: number) {
  if (level >= 70) return "text-emerald-400";
  if (level >= 40) return "text-amber-400";
  if (level >= 15) return "text-red-400";
  return "text-red-600";
}

function getBatteryBg(level: number) {
  if (level >= 70) return "bg-emerald-500";
  if (level >= 40) return "bg-amber-500";
  if (level >= 15) return "bg-red-500";
  return "bg-red-700";
}

const STATUS_PL: Record<string, { label: string; color: string }> = {
  available: { label: "GOTOWY", color: "text-emerald-400" },
  mission:   { label: "W MISJI", color: "text-red-400" },
  charging:  { label: "ŁADUJE", color: "text-amber-400" },
  maintenance: { label: "SERWIS", color: "text-slate-500" },
};

export function DroneDispatchPanel({ viewerRef, onOpenChange }: DroneDispatchPanelProps) {
  const [phase, setPhase] = useState<DispatchPhase>("closed");

  // Notify parent when panel opens/closes
  useEffect(() => {
    onOpenChange?.(phase !== "closed");
  }, [phase, onOpenChange]);
  const [selectedDrone, setSelectedDrone] = useState<DroneAsset | null>(null);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [flyProgress, setFlyProgress] = useState(0);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const rangeEntityRef = useRef<any>(null);
  const droneEntityRef = useRef<any>(null);
  const trailEntityRef = useRef<any>(null);
  const targetEntityRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);
  const baseEntityRef = useRef<any>(null);

  // Cleanup all map entities
  const cleanupMap = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    [rangeEntityRef, droneEntityRef, trailEntityRef, targetEntityRef, baseEntityRef].forEach((ref) => {
      if (ref.current) {
        try { viewer.entities.remove(ref.current); } catch {}
        ref.current = null;
      }
    });
    if (clickHandlerRef.current) {
      clickHandlerRef.current.destroy();
      clickHandlerRef.current = null;
    }
  }, [viewerRef]);

  // Cleanup all map entities on component unmount
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, [cleanupMap]);

  // Show range circle when drone is selected
  useEffect(() => {
    if (phase !== "target" || !selectedDrone) return;
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    const rangeM = getRangeKm(selectedDrone) * 1000;
    const battery = BATTERY_LEVELS[selectedDrone.id] ?? 80;
    const color = battery >= 70 ? Cesium.Color.fromCssColorString("#10b981") : battery >= 40 ? Cesium.Color.fromCssColorString("#f59e0b") : Cesium.Color.fromCssColorString("#ef4444");

    // Range circle from base
    rangeEntityRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedDrone.baseLon, selectedDrone.baseLat),
      ellipse: {
        semiMajorAxis: rangeM,
        semiMinorAxis: rangeM,
        material: color.withAlpha(0.08),
        outline: true,
        outlineColor: color.withAlpha(0.5),
        outlineWidth: 2,
        height: 0,
      },
    });

    // Base marker
    baseEntityRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedDrone.baseLon, selectedDrone.baseLat),
      point: { 
        pixelSize: 10, 
        color: Cesium.Color.fromCssColorString("#ef4444"), 
        outlineColor: Cesium.Color.WHITE, 
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY 
      },
      label: {
        text: `📍 ${selectedDrone.callsign} • BAZA`,
        font: "bold 11px Rajdhani, sans-serif",
        fillColor: Cesium.Color.BLACK,
        style: Cesium.LabelStyle.FILL,
        showBackground: false,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // Fly camera to show the range
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selectedDrone.baseLon, selectedDrone.baseLat - 0.02, 5000),
      orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-45), roll: 0 },
      duration: 1.2,
    });

    // Set up click handler for map
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lon = Cesium.Math.toDegrees(carto.longitude);

      // Check if within range
      const dist = haversine(selectedDrone.baseLat, selectedDrone.baseLon, lat, lon);
      const rangeKm = getRangeKm(selectedDrone);
      if (dist > rangeKm) return; // out of range — ignore

      // Place target marker
      if (targetEntityRef.current) viewer.entities.remove(targetEntityRef.current);
      targetEntityRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        point: { 
          pixelSize: 12, 
          color: Cesium.Color.fromCssColorString("#ef4444"), 
          outlineColor: Cesium.Color.WHITE, 
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY 
        },
        label: {
          text: `🎯 CEL: ${lat.toFixed(4)}°N ${lon.toFixed(4)}°E`,
          font: "bold 10px 'JetBrains Mono', monospace",
          fillColor: Cesium.Color.BLACK,
          style: Cesium.LabelStyle.FILL,
          showBackground: false,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      setTargetCoords({ lat, lon });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    return () => {
      // Transitioning away from target selection phase — keep base and target entities,
      // but clean up the range circle and the click handler.
      const v = viewerRef.current;
      if (v && rangeEntityRef.current) {
        try { v.entities.remove(rangeEntityRef.current); } catch {}
        rangeEntityRef.current = null;
      }
      if (clickHandlerRef.current) {
        clickHandlerRef.current.destroy();
        clickHandlerRef.current = null;
      }
    };
  }, [phase, selectedDrone, viewerRef]);

  // Animate drone flight
  const launchDrone = useCallback(() => {
    if (!selectedDrone || !targetCoords) return;
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    // Remove click handler
    if (clickHandlerRef.current) {
      clickHandlerRef.current.destroy();
      clickHandlerRef.current = null;
    }

    setPhase("flying");
    setFlyProgress(0);

    const startLat = selectedDrone.baseLat;
    const startLon = selectedDrone.baseLon;
    const endLat = targetCoords.lat;
    const endLon = targetCoords.lon;
    const distKm = haversine(startLat, startLon, endLat, endLon);
    const durationMs = Math.max(5000, distKm * 2000); // ~2s per km — slow visible flight

    const startTime = performance.now();
    const trailPositions: any[] = [];

    // Flying drone entity — large and visible
    droneEntityRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(startLon, startLat, 120),
      point: { 
        pixelSize: 14, 
        color: Cesium.Color.fromCssColorString("#ef4444"), 
        outlineColor: Cesium.Color.WHITE, 
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY 
      },
      label: {
        text: `✈ ${selectedDrone.callsign} • W LOCIE`,
        font: "bold 12px Rajdhani, sans-serif",
        fillColor: Cesium.Color.BLACK,
        style: Cesium.LabelStyle.FILL,
        showBackground: false,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    setShowLiveFeed(true);

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      const curLat = startLat + (endLat - startLat) * eased;
      const curLon = startLon + (endLon - startLon) * eased;
      const curAlt = 120 + Math.sin(eased * Math.PI) * 60; // arc

      if (droneEntityRef.current) {
        droneEntityRef.current.position = Cesium.Cartesian3.fromDegrees(curLon, curLat, curAlt);
      }

      // Trail
      trailPositions.push(Cesium.Cartesian3.fromDegrees(curLon, curLat, curAlt));
      if (trailEntityRef.current) viewer.entities.remove(trailEntityRef.current);
      if (trailPositions.length > 2) {
        trailEntityRef.current = viewer.entities.add({
          polyline: {
            positions: trailPositions,
            width: 2,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.7),
            }),
            clampToGround: false,
          },
        });
      }

      setFlyProgress(Math.round(eased * 100));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setPhase("arrived");
        if (droneEntityRef.current && droneEntityRef.current.label) {
          droneEntityRef.current.label.text = `✈ ${selectedDrone.callsign} • NA POZYCJI`;
        }
      }
    };
    requestAnimationFrame(animate);
  }, [selectedDrone, targetCoords, viewerRef]);

  const handleClose = () => {
    cleanupMap();
    setPhase("closed");
    setSelectedDrone(null);
    setTargetCoords(null);
    setFlyProgress(0);
    setShowLiveFeed(false);

    // Reset camera
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (viewer && Cesium) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(22.0490, 50.5630 - 0.018, 4500),
        orientation: { heading: Cesium.Math.toRadians(15), pitch: Cesium.Math.toRadians(-38), roll: 0 },
        duration: 1.2,
      });
    }
  };

  const handleSelectDrone = (drone: DroneAsset) => {
    if (drone.status === "maintenance") return;
    setSelectedDrone(drone);
    setTargetCoords(null);
    setPhase("target");
  };

  // Deployable drones (not maintenance)
  const deployable = DRONE_FLEET.filter((d) => d.status !== "maintenance");

  if (phase === "closed") {
    return (
      <button
        onClick={() => { setPhase("select"); }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[rgba(12,6,6,0.94)] backdrop-blur-md border-2 border-red-600 hover:border-red-400 text-red-100 cursor-pointer font-rajdhani font-bold text-[13px] tracking-[0.2em] shadow-[0_0_25px_rgba(239,68,68,0.3)] hover:shadow-[0_0_35px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.02]"
      >
        <Navigation className="w-5 h-5 text-red-400" />
        WYŚLIJ DRONA
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[85] pointer-events-none">
      {/* Panel */}
      <div className="pointer-events-auto absolute top-[80px] left-0 bottom-10 w-[380px] max-w-[30vw] bg-[rgba(10,4,4,0.97)] backdrop-blur-md border-r border-[#2a1010] shadow-2xl flex flex-col overflow-hidden animate-slideIn">
        {/* Header — clean, minimal */}
        <div className="px-4 py-3 shrink-0 flex items-center justify-between" style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.08) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center border border-red-500/40 bg-red-500/10">
              <Navigation className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold font-rajdhani tracking-[0.2em] text-white/95">
                DYSPOZYTURA
              </div>
              <div className="text-[7px] font-mono text-red-400/70 tracking-widest">
                {phase === "select" && "WYBIERZ JEDNOSTKĘ"}
                {phase === "target" && "WSKAŻ CEL NA MAPIE"}
                {phase === "flying" && "PRZELOT DO CELU"}
                {phase === "arrived" && "POZYCJA OSIĄGNIĘTA"}
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center border border-[#2a1010] hover:border-red-500/60 text-slate-500 hover:text-red-400 transition-all cursor-pointer bg-transparent">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-red-500/40 via-red-500/10 to-transparent" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto terminal-scroll min-h-0">

          {/* ========== DRONE SELECTION ========== */}
          {phase === "select" && (
            <div className="p-3 flex flex-col gap-1.5">
              {DRONE_FLEET.map((drone) => {
                const battery = BATTERY_LEVELS[drone.id] ?? 0;
                const rangeKm = getRangeKm(drone);
                const maxRange = parseFloat(drone.maxRange);
                const rangeRatio = maxRange > 0 ? rangeKm / maxRange : 0;
                const isDisabled = drone.status === "maintenance";
                const st = STATUS_PL[drone.status];

                return (
                  <button
                    key={drone.id}
                    onClick={() => handleSelectDrone(drone)}
                    disabled={isDisabled}
                    className={`group text-left transition-all cursor-pointer relative overflow-hidden ${
                      isDisabled ? "opacity-30 cursor-not-allowed" : "hover:translate-x-0.5"
                    }`}
                  >
                    <div className={`flex gap-3 p-2.5 border-l-2 ${
                      isDisabled ? "border-l-slate-700 bg-[#060303]"
                      : drone.status === "available" ? "border-l-emerald-500 bg-[#080404] group-hover:bg-[#0f0606]"
                      : drone.status === "mission" ? "border-l-red-500 bg-[#080404] group-hover:bg-[#0f0606]"
                      : "border-l-amber-500 bg-[#080404] group-hover:bg-[#0f0606]"
                    }`}>
                      {/* Left: Battery gauge */}
                      <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                        <div className="w-6 h-10 border border-slate-600/60 bg-[#0a0505] relative flex flex-col justify-end overflow-hidden">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -top-[2px] w-2.5 h-1 bg-slate-600/60" />
                          <div
                            className={`w-full transition-all ${getBatteryBg(battery)}`}
                            style={{ height: `${battery}%`, opacity: 0.8 }}
                          />
                        </div>
                        <span className={`text-[8px] font-mono font-bold tabular-nums ${getBatteryColor(battery)}`}>
                          {battery}%
                        </span>
                      </div>

                      {/* Right: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold font-rajdhani tracking-widest text-white/90">
                            {drone.callsign}
                          </span>
                          <span className={`text-[7px] font-bold font-rajdhani tracking-[0.15em] px-1.5 py-0.5 ${
                            drone.status === "available" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : drone.status === "mission" ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : drone.status === "charging" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                          }`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono truncate mb-1.5">{drone.model}</div>
                        {/* Range bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#1a0808] overflow-hidden">
                            <div className={`h-full ${getBatteryBg(battery)} opacity-50`} style={{ width: `${rangeRatio * 100}%` }} />
                          </div>
                          <span className="text-[7px] font-mono text-slate-500 shrink-0 tabular-nums">
                            {rangeKm.toFixed(1)}/{maxRange} km
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ========== TARGET / FLYING / ARRIVED ========== */}
          {(phase === "target" || phase === "flying" || phase === "arrived") && selectedDrone && (
            <div className="flex flex-col">
              {/* Drone identity strip */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a1010]" style={{ background: "rgba(239,68,68,0.04)" }}>
                <div className="w-10 h-10 border border-red-500/30 bg-red-500/8 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-extrabold font-rajdhani tracking-[0.15em] text-white/95">{selectedDrone.callsign}</div>
                  <div className="text-[8px] text-slate-400 font-mono truncate">{selectedDrone.model}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[14px] font-bold font-mono tabular-nums ${getBatteryColor(BATTERY_LEVELS[selectedDrone.id] ?? 0)}`}>
                    {BATTERY_LEVELS[selectedDrone.id]}%
                  </div>
                  <div className="text-[7px] text-slate-500 font-mono">BATERIA</div>
                </div>
              </div>

              {/* Telemetry grid */}
              <div className="grid grid-cols-3 border-b border-[#2a1010]">
                <TelemetryCell label="ZASIĘG" value={`${getRangeKm(selectedDrone).toFixed(1)}km`} />
                <TelemetryCell label="PUŁAP" value={selectedDrone.maxAlt.replace(" AGL", "")} border />
                <TelemetryCell label="BVLOS" value={selectedDrone.certBVLOS ? "TAK" : "NIE"} accent={selectedDrone.certBVLOS} />
              </div>

              {/* Phase-specific content */}
              <div className="px-4 py-3">
                {phase === "target" && !targetCoords && (
                  <div className="flex flex-col items-center py-6 gap-3">
                    <div className="w-12 h-12 border-2 border-dashed border-amber-500/40 flex items-center justify-center animate-pulse">
                      <Crosshair className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold font-rajdhani tracking-[0.2em] text-amber-300 mb-1">
                        WSKAŻ PUNKT NA MAPIE
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono">
                        Kliknij w zasięgu {getRangeKm(selectedDrone).toFixed(1)} km od bazy
                      </div>
                    </div>
                  </div>
                )}

                {phase === "target" && targetCoords && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-[#2a1010] bg-[#060303] px-3 py-2">
                        <div className="text-[6px] text-slate-500 font-mono tracking-widest mb-0.5">SZEROKOŚĆ</div>
                        <div className="text-[11px] font-mono text-emerald-400 font-bold tabular-nums">{targetCoords.lat.toFixed(5)}°N</div>
                      </div>
                      <div className="border border-[#2a1010] bg-[#060303] px-3 py-2">
                        <div className="text-[6px] text-slate-500 font-mono tracking-widest mb-0.5">DŁUGOŚĆ</div>
                        <div className="text-[11px] font-mono text-emerald-400 font-bold tabular-nums">{targetCoords.lon.toFixed(5)}°E</div>
                      </div>
                    </div>
                    <div className="border border-[#2a1010] bg-[#060303] px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="text-[6px] text-slate-500 font-mono tracking-widest mb-0.5">DYSTANS</div>
                        <div className="text-[13px] font-mono text-white/90 font-bold tabular-nums">
                          {haversine(selectedDrone.baseLat, selectedDrone.baseLon, targetCoords.lat, targetCoords.lon).toFixed(2)} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[6px] text-slate-500 font-mono tracking-widest mb-0.5">ETA</div>
                        <div className="text-[13px] font-mono text-amber-400 font-bold tabular-nums">
                          ~{Math.ceil(haversine(selectedDrone.baseLat, selectedDrone.baseLon, targetCoords.lat, targetCoords.lon) / 0.75)} min
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={launchDrone}
                      className="w-full flex items-center justify-center gap-3 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-rajdhani text-[12px] tracking-[0.25em] transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                    >
                      <Navigation className="w-4 h-4" />
                      ZATWIERDŹ I WYŚLIJ
                    </button>
                  </div>
                )}

                {phase === "flying" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-bold font-rajdhani tracking-[0.2em] text-red-300">EN ROUTE</span>
                      </div>
                      <span className="text-[20px] font-mono font-bold tabular-nums text-white/90">{flyProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1a0808] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200" style={{ width: `${flyProgress}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat label="ALT" value="120m" />
                      <MiniStat label="SPD" value="45 km/h" />
                      <MiniStat label="HDG" value={`${Math.round(Math.random() * 5 + 42)}°`} />
                    </div>
                  </div>
                )}

                {phase === "arrived" && (
                  <div className="flex flex-col items-center py-4 gap-2">
                    <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-[10px] font-bold font-rajdhani tracking-[0.2em] text-emerald-300">NA POZYCJI</div>
                    <div className="text-[8px] text-slate-500 font-mono">Monitoring aktywny • Kamera LIVE</div>
                  </div>
                )}
              </div>

              {/* Specs — compact footer */}
              <div className="mt-auto border-t border-[#2a1010] px-4 py-2">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {selectedDrone.sensors.map((s) => (
                    <span key={s} className="text-[7px] font-mono text-slate-500">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live feed panel — right side */}
      {showLiveFeed && (phase === "flying" || phase === "arrived") && (
        <div className="pointer-events-auto absolute top-[80px] right-4 bottom-10 w-[380px] max-w-[32vw] flex flex-col overflow-hidden shadow-2xl border border-[#3a1818] animate-slideIn" style={{ animationDelay: "100ms", borderRadius: "2px" }}>
          {/* YouTube embed */}
          <div className="flex-1 min-h-0 relative bg-black">
            <iframe
              src="https://www.youtube.com/embed/kXftJDP42fY?autoplay=1&mute=1&loop=1&playlist=kXftJDP42fY&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&start=2"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: "200%", height: "200%", border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
            />
            {/* Scan lines */}
            <div className="absolute inset-0 pointer-events-none z-[3]" style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, transparent 1px, transparent 3px)",
              backgroundSize: "100% 3px",
            }} />
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none z-[3]" style={{
              background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
            }} />
            {/* Corner ticks */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[4]" preserveAspectRatio="none">
              <line x1="3%" y1="3%" x2="8%" y2="3%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="3%" y1="3%" x2="3%" y2="8%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="92%" y1="3%" x2="97%" y2="3%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="97%" y1="3%" x2="97%" y2="8%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="3%" y1="97%" x2="3%" y2="92%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="3%" y1="97%" x2="8%" y2="97%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="97%" y1="97%" x2="97%" y2="92%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
              <line x1="92%" y1="97%" x2="97%" y2="97%" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" />
            </svg>
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm border-b border-red-900/50 z-10">
              <div className="flex items-center gap-2">
                <Video className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-rajdhani font-bold tracking-widest text-red-400">LIVE FEED</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <Signal className="w-3 h-3 text-green-400" />
                <span className="text-[8px] font-mono text-slate-400">{selectedDrone?.callsign} • KAMERA</span>
              </div>
            </div>
            {/* Altitude/speed overlay */}
            <div className="absolute top-8 right-3 z-[5] pointer-events-none text-right">
              <div className="text-[7px] font-mono text-cyan-400/70 mb-0.5">RGB-4K • LIVE</div>
              <div className="text-[9px] font-mono text-emerald-400 font-bold">ALT: 120m AGL</div>
              <div className="text-[7px] font-mono text-cyan-300/50">SPD: 45 km/h</div>
              <div className="text-[7px] font-mono text-cyan-300/50">HDG: {phase === "arrived" ? "HOVER" : "EN ROUTE"}</div>
            </div>
          </div>
          {/* HUD strip */}
          <div className="shrink-0 bg-[rgba(12,6,6,0.96)] border-t border-[#3a1818] px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono text-red-400 font-bold">REC • LIVE</span>
            </div>
            <div className="text-[8px] font-mono text-slate-500">BATT {BATTERY_LEVELS[selectedDrone?.id ?? ""] ?? 0}% • GPS ✓</div>
            <button
              onClick={() => setShowLiveFeed(false)}
              className="text-[8px] font-rajdhani font-bold tracking-widest text-slate-400 hover:text-red-400 border border-[#3a1818] hover:border-red-500 px-2 py-0.5 transition-all cursor-pointer bg-transparent"
            >
              ZAMKNIJ
            </button>
          </div>
        </div>
      )}

      {/* Prominent LIVE PREVIEW button — when flying/arrived and feed is hidden */}
      {!showLiveFeed && (phase === "flying" || phase === "arrived") && (
        <button
          onClick={() => setShowLiveFeed(true)}
          className="pointer-events-auto fixed top-[90px] right-6 z-[90] flex items-center gap-2 px-4 py-2 bg-[rgba(12,6,6,0.94)] backdrop-blur-md border-2 border-red-600 hover:border-red-400 text-red-100 cursor-pointer font-rajdhani font-bold text-[11px] tracking-[0.2em] shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all animate-pulse"
        >
          <Video className="w-4 h-4 text-red-400" />
          PODGLĄD LIVE
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        :global(.animate-slideIn) {
          animation: slideIn 380ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[9px] py-1 border-b border-[#2a1212]/50 last:border-b-0">
      <span className="theme-text-muted font-mono shrink-0">{label}</span>
      <span className="theme-text-primary font-bold font-sharetech text-right">{value}</span>
    </div>
  );
}

function TelemetryCell({ label, value, border, accent }: { label: string; value: string; border?: boolean; accent?: boolean }) {
  return (
    <div className={`px-3 py-2 text-center ${border ? "border-x border-[#2a1010]" : ""}`}>
      <div className="text-[6px] text-slate-500 font-mono tracking-[0.2em] mb-0.5">{label}</div>
      <div className={`text-[12px] font-mono font-bold tabular-nums ${accent ? "text-emerald-400" : "text-white/80"}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#2a1010] bg-[#060303] px-2 py-1.5 text-center">
      <div className="text-[6px] text-slate-500 font-mono tracking-widest">{label}</div>
      <div className="text-[10px] font-mono text-white/80 font-bold tabular-nums">{value}</div>
    </div>
  );
}

/** Haversine distance in km */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
