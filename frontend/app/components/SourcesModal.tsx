"use client";

import { X, ExternalLink } from "lucide-react";
import { DATA_SOURCES } from "../data/fleetData";

interface SourcesModalProps {
  onClose: () => void;
}

export function SourcesModal({ onClose }: SourcesModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="relative w-[700px] max-w-[90vw] max-h-[80vh] bg-[rgba(15,8,8,0.96)] backdrop-blur-xl border border-[#3a1818] shadow-2xl flex flex-col overflow-hidden" style={{ borderRadius: "2px" }}>
        {/* Header */}
        <div className="shrink-0 px-5 py-3 border-b border-[#3a1818] flex items-center justify-between">
          <div>
            <div className="text-[8px] text-slate-500 font-rajdhani font-bold tracking-[0.3em]">SKY MARSHAL // DOKUMENTACJA</div>
            <h2 className="text-[16px] font-extrabold font-rajdhani tracking-widest theme-neon-text">
              ŹRÓDŁA DANYCH
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 border border-[#3a1818] hover:border-red-500 hover:text-red-500 text-slate-300 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto terminal-scroll min-h-0 p-5">
          <div className="text-[10px] font-mono text-slate-400 mb-4 leading-relaxed">
            Poniżej lista źródeł danych wykorzystanych w systemie SkyMarshal.
            Dane publiczne opatrzone linkami umożliwiającymi weryfikację.
          </div>

          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-left text-[8px] font-rajdhani font-bold tracking-[0.2em] text-slate-500 border-b border-[#3a1818]">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">ŹRÓDŁO</th>
                <th className="pb-2 pr-3">TYP DANYCH</th>
                <th className="pb-2">LINK</th>
              </tr>
            </thead>
            <tbody>
              {DATA_SOURCES.map((src, i) => (
                <tr key={i} className="border-b border-[#3a1818]/50 hover:bg-red-500/5 transition-colors">
                  <td className="py-2 pr-3 text-slate-600 tabular-nums">{String(i + 1).padStart(2, "0")}</td>
                  <td className="py-2 pr-3 text-slate-200 font-bold">{src.name}</td>
                  <td className="py-2 pr-3 text-slate-400">{src.type}</td>
                  <td className="py-2">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[160px]">{src.url.replace("https://", "")}</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 pt-4 border-t border-[#3a1818] text-[9px] font-mono text-slate-500 leading-relaxed">
            <div className="font-bold font-rajdhani tracking-widest text-slate-400 mb-1">NOTA PRAWNA</div>
            Dane wykorzystane w systemie SkyMarshal pochodzą z publicznie dostępnych źródeł.
            Lokalizacje obiektów i parametry dronów mają charakter demonstracyjny.
            System nie przetwarza danych niejawnych. Koordynaty infrastruktury krytycznej
            pochodzą z OpenStreetMap i Geoportalu.
          </div>
        </div>
      </div>
    </div>
  );
}
