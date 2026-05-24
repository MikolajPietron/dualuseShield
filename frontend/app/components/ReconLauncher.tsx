"use client";

import { ChevronRight } from "lucide-react";
import { ReconScenario, ScenarioId } from "../data/reconScenarios";

interface ReconLauncherProps {
  scenarios: ReconScenario[];
  onLaunch: (id: ScenarioId) => void;
}

export function ReconLauncher({ scenarios, onLaunch }: ReconLauncherProps) {
  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center px-6" style={{ paddingTop: "80px" }}>
      <div className="pointer-events-auto flex flex-col items-center gap-5 max-w-[1100px] w-full">
        {/* Title block */}
        <div className="text-center mb-1">
          <div className="text-[10px] theme-text-muted font-bold font-rajdhani tracking-[0.3em] mb-1.5">
            SKY MARSHAL // STALOWA WOLA
          </div>
          <h1 className="text-2xl font-extrabold font-rajdhani tracking-widest theme-neon-text drop-shadow-[0_0_12px_rgba(239,68,68,0.55)]">
            WYBIERZ OBSZAR ZWIADU DRONOWEGO
          </h1>
          <p className="text-[11px] theme-text-secondary mt-1.5 font-mono">
            Kliknij kartę — flota służb wystartuje, kamera przejdzie w POV.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {scenarios.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onLaunch(s.id)}
                className="group relative theme-bg-panel border theme-border clip-chamfer backdrop-blur-md p-4 text-left shadow-2xl transition-all duration-200 hover:theme-neon-border hover:scale-[1.015] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] cursor-pointer flex flex-col"
              >
                {/* Card number */}
                <div className="absolute top-2.5 right-3 text-[8px] theme-text-muted font-mono tracking-wider">
                  0{idx + 1}/0{scenarios.length}
                </div>

                {/* Icon + title + description */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 border theme-neon-border bg-red-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 theme-neon-text" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-[13px] font-bold font-rajdhani tracking-widest theme-text-primary leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-[10px] theme-text-secondary leading-relaxed mt-1 font-mono line-clamp-3">
                      {s.brief}
                    </p>
                  </div>
                </div>

                {/* Spacer to push footer to bottom */}
                <div className="flex-1 min-h-3" />

                {/* Footer: drone agency + CTA */}
                <div className="pt-2.5 mt-2 border-t theme-border flex items-center justify-between gap-2">
                  <span className="text-[8px] theme-text-muted font-rajdhani tracking-widest font-bold leading-tight flex-1 min-w-0 truncate">
                    {s.droneAgency} • {s.mode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] theme-neon-text font-bold font-rajdhani tracking-widest border theme-neon-border px-2 py-1 bg-red-500/5 group-hover:bg-red-500/15 transition-all shrink-0 whitespace-nowrap">
                    {s.buttonCta}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
