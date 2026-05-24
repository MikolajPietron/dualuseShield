"use client";

import { Shield, Compass } from "lucide-react";

interface HeaderProps {
  clockTime: string;
}

export function Header({ clockTime }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-[60] flex justify-between items-center px-4 h-12 border-b theme-border theme-bg-panel font-rajdhani backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 theme-neon-text animate-pulse" />
          <span className="font-extrabold tracking-widest text-[14px] theme-neon-text">
            SKY MARSHAL
          </span>
          <span className="text-[9px] theme-bg-app border theme-border px-1.5 py-0.5 theme-text-secondary font-mono tracking-normal">
            UAV_DISPATCH v1.0
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 border-l theme-border pl-6 h-8 text-[11px] font-mono theme-text-secondary">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 theme-text-muted" />
            <span>STALOWA WOLA — KOORDYNACJA FLOTY DRONÓW SŁUŻB</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <div className="text-[11px] theme-text-secondary tabular-nums border-l theme-border pl-4 h-12 flex items-center">
          {clockTime || "--:--:--"} UTC
        </div>
      </div>
    </header>
  );
}
