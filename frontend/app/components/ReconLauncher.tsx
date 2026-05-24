"use client";

import { ChevronRight } from "lucide-react";
import { ReconScenario, ScenarioId } from "../data/reconScenarios";

interface ReconLauncherProps {
  scenarios: ReconScenario[];
  onLaunch: (id: ScenarioId) => void;
}

export function ReconLauncher({ scenarios, onLaunch }: ReconLauncherProps) {
  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center px-4">
      <div className="pointer-events-auto flex flex-col items-center gap-6 max-w-4xl w-full">
        <div className="text-center">
          <div className="text-[10px] theme-text-muted font-bold font-rajdhani tracking-[0.3em] mb-1">
            SKY MARSHAL // STALOWA WOLA
          </div>
          <h1 className="text-2xl font-extrabold font-rajdhani tracking-widest theme-neon-text drop-shadow-[0_0_12px_rgba(239,68,68,0.55)]">
            WYBIERZ OBSZAR ZWIADU DRONOWEGO
          </h1>
          <p className="text-[11px] theme-text-secondary mt-1 font-mono">
            Kliknij kartę — flota służb wystartuje, kamera przejdzie w POV.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {scenarios.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onLaunch(s.id)}
                className="group relative theme-bg-panel border theme-border clip-chamfer backdrop-blur-md p-5 text-left shadow-2xl transition-all duration-200 hover:theme-neon-border hover:scale-[1.015] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] cursor-pointer"
              >
                <div className="absolute top-2 right-3 text-[8px] theme-text-muted font-mono tracking-wider">
                  0{idx + 1}/04
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 border theme-neon-border bg-red-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 theme-neon-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold font-rajdhani tracking-widest theme-text-primary leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-[11px] theme-text-secondary leading-relaxed mt-1.5 font-mono">
                      {s.brief}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between">
                  <span className="text-[9px] theme-text-muted font-rajdhani tracking-widest font-bold">
                    {s.droneAgency} • {s.mode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] theme-neon-text font-bold font-rajdhani tracking-widest border theme-neon-border px-2 py-1 bg-red-500/5 group-hover:bg-red-500/15 transition-all">
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
