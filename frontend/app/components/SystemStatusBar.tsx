"use client";

import { Activity, Radio, CloudSun, Plane, Battery } from "lucide-react";
import { DRONE_FLEET } from "../data/fleetData";

export function SystemStatusBar() {
  const total = DRONE_FLEET.length;
  const available = DRONE_FLEET.filter((d) => d.status === "available").length;
  const inMission = DRONE_FLEET.filter((d) => d.status === "mission").length;
  const charging = DRONE_FLEET.filter((d) => d.status === "charging").length;

  return (
    <div className="fixed top-12 left-0 w-full z-[50] border-b theme-border bg-[rgba(8,4,4,0.92)] backdrop-blur-md">
      {/* Status ticker */}
      <div className="flex items-center h-8 px-4 gap-6 text-[9px] font-mono overflow-hidden">
        {/* Drone status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Plane className="w-3 h-3 theme-neon-text" />
          <span className="font-rajdhani font-bold tracking-widest theme-neon-text">FLOTA:</span>
          <span className="text-emerald-400 font-bold">{available}</span>
          <span className="text-slate-500">GOTOWYCH</span>
          <span className="text-slate-600">•</span>
          <span className="text-red-400 font-bold">{inMission}</span>
          <span className="text-slate-500">W MISJI</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-bold">{charging}</span>
          <span className="text-slate-500">ŁADUJE</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-bold">{total}</span>
          <span className="text-slate-500">TOTAL</span>
        </div>

        <div className="w-px h-4 bg-[#3a1818] shrink-0" />

        {/* Weather */}
        <div className="flex items-center gap-1.5 shrink-0">
          <CloudSun className="w-3 h-3 text-amber-400" />
          <span className="text-slate-400">WIATR</span>
          <span className="text-slate-200 font-bold">8 km/h NW</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">WIDOCZNOŚĆ</span>
          <span className="text-emerald-400 font-bold">DOBRA</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">TEMP</span>
          <span className="text-slate-200">17°C</span>
        </div>

        <div className="w-px h-4 bg-[#3a1818] shrink-0" />

        {/* Comms */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Radio className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">U-SPACE LTE</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">UHF BACKUP</span>
          <span className="text-emerald-400 font-bold">STANDBY</span>
        </div>

        <div className="w-px h-4 bg-[#3a1818] shrink-0" />

        {/* Airspace */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400">PRZESTRZEŃ</span>
          <span className="text-cyan-400 font-bold">CTR-FREE</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">NOTAM</span>
          <span className="text-amber-400 font-bold">P-23 AKTYWNY</span>
        </div>
      </div>
    </div>
  );
}
