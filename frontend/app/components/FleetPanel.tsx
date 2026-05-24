"use client";

import { X, Wifi, BatteryCharging, Wrench, Radio } from "lucide-react";
import { DRONE_FLEET, DroneAsset } from "../data/fleetData";

interface FleetPanelProps {
  onClose: () => void;
}

const STATUS_CONFIG: Record<DroneAsset["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  available: { label: "DOSTĘPNY", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40", icon: <Wifi className="w-3 h-3" /> },
  mission: { label: "W MISJI", color: "text-red-400", bg: "bg-red-500/15 border-red-500/40", icon: <Radio className="w-3 h-3 animate-pulse" /> },
  charging: { label: "ŁADOWANIE", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/40", icon: <BatteryCharging className="w-3 h-3" /> },
  maintenance: { label: "SERWIS", color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/40", icon: <Wrench className="w-3 h-3" /> },
};

const AGENCY_COLORS: Record<string, string> = {
  ZK: "#06b6d4",
  POLICJA: "#3b82f6",
  PSP: "#ef4444",
  OSP: "#f59e0b",
};

export function FleetPanel({ onClose }: FleetPanelProps) {
  const byAgency = DRONE_FLEET.reduce((acc, d) => {
    if (!acc[d.agencyShort]) acc[d.agencyShort] = [];
    acc[d.agencyShort].push(d);
    return acc;
  }, {} as Record<string, DroneAsset[]>);

  const total = DRONE_FLEET.length;
  const available = DRONE_FLEET.filter((d) => d.status === "available").length;
  const inMission = DRONE_FLEET.filter((d) => d.status === "mission").length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="relative w-[900px] max-w-[90vw] max-h-[85vh] bg-[rgba(15,8,8,0.96)] backdrop-blur-xl border border-[#3a1818] shadow-2xl flex flex-col overflow-hidden" style={{ borderRadius: "2px" }}>
        {/* Header */}
        <div className="shrink-0 px-5 py-3 border-b border-[#3a1818] flex items-center justify-between">
          <div>
            <div className="text-[8px] text-slate-500 font-rajdhani font-bold tracking-[0.3em]">SKY MARSHAL // STALOWA WOLA</div>
            <h2 className="text-[16px] font-extrabold font-rajdhani tracking-widest theme-neon-text">
              INWENTARYZACJA FLOTY DRONÓW
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-[10px] font-mono">
              <span className="text-emerald-400">{available} DOSTĘPNYCH</span>
              <span className="text-red-400">{inMission} W MISJI</span>
              <span className="text-slate-400">{total} ŁĄCZNIE</span>
            </div>
            <button onClick={onClose} className="p-1.5 border border-[#3a1818] hover:border-red-500 hover:text-red-500 text-slate-300 transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto terminal-scroll min-h-0 p-5">
          {Object.entries(byAgency).map(([agency, drones]) => (
            <div key={agency} className="mb-5 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AGENCY_COLORS[agency] || "#888" }} />
                <span className="text-[10px] font-bold font-rajdhani tracking-[0.2em]" style={{ color: AGENCY_COLORS[agency] || "#888" }}>
                  {agency} — {drones[0].agency}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">{drones.length} dron{drones.length > 1 ? "ów" : ""}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {drones.map((drone) => {
                  const st = STATUS_CONFIG[drone.status];
                  return (
                    <div key={drone.id} className={`border px-3 py-2.5 ${st.bg}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold font-rajdhani tracking-wider text-white">
                            {drone.callsign}
                          </span>
                          <span className={`flex items-center gap-1 text-[8px] font-bold font-rajdhani tracking-widest px-1.5 py-0.5 border ${st.bg} ${st.color}`}>
                            {st.icon}
                            {st.label}
                          </span>
                        </div>
                        {drone.certBVLOS && (
                          <span className="text-[7px] font-bold font-rajdhani tracking-widest px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                            BVLOS ✓
                          </span>
                        )}
                      </div>

                      <div className="text-[9px] font-mono text-slate-300 mb-1.5">{drone.model}</div>

                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {drone.sensors.map((s) => (
                          <span key={s} className="text-[7px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-400">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-[8px] font-mono text-slate-500">
                        <div>⟳ {drone.maxFlight}</div>
                        <div>↔ {drone.maxRange}</div>
                        <div>↑ {drone.maxAlt}</div>
                        <div>💨 {drone.maxWind}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
