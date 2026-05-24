"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Sky, Cloud, Clouds, Center, PerspectiveCamera } from "@react-three/drei";
import { X, Activity, Radio } from "lucide-react";
import * as THREE from "three";
import { ReconScenario, ResolutionStep } from "../data/reconScenarios";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type Phase = "flyin" | "pov";

interface DroneReconViewProps {
  scenario: ReconScenario;
  onMapFocus: (scenario: ReconScenario) => void;
  onClose: () => void;
}

const FLYIN_HOVER_MS = 1500;
const FLYIN_DOLLY_MS = 1600;
const FLYIN_TOTAL_MS = FLYIN_HOVER_MS + FLYIN_DOLLY_MS;

export function DroneReconView({ scenario, onMapFocus, onClose }: DroneReconViewProps) {
  const [phase, setPhase] = useState<Phase>("flyin");

  useEffect(() => {
    setPhase("flyin");
  }, [scenario.id]);

  useEffect(() => {
    if (phase === "pov") {
      onMapFocus(scenario);
    }
  }, [phase, scenario, onMapFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] animate-fadeIn ${
        phase === "flyin" ? "" : "bg-transparent pointer-events-none"
      }`}
      style={phase === "flyin" ? { background: "#bae6fd" } : undefined}
    >
      {phase === "flyin" && (
        <FlyInScene
          scenario={scenario}
          onComplete={() => setPhase("pov")}
          onSkip={() => setPhase("pov")}
        />
      )}
      {phase === "pov" && <PovOverlay scenario={scenario} />}

      <button
        onClick={onClose}
        className="pointer-events-auto absolute top-4 right-4 z-[90] p-2 border theme-border theme-bg-panel/85 backdrop-blur-md hover:border-red-500 hover:text-red-500 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold font-rajdhani tracking-widest"
        title="Zamknij (Esc)"
      >
        <X className="w-4 h-4" />
        ZAKOŃCZ MISJĘ
      </button>
    </div>
  );
}

// ============================================================================
// FAZA 1 — Three.js fly-in: jasne pochmurne niebo + słońce + dron
// ============================================================================

function FlyInScene({
  scenario,
  onComplete,
  onSkip
}: {
  scenario: ReconScenario;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="absolute inset-0">
      {/* Sky gradient fallback under the Canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-amber-50" />

      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault fov={42} position={[0, 1.5, 6]} />

        {/* Bright cloudy daylight */}
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[10, 12, 6]}
          intensity={1.8}
          color="#fff8e1"
          castShadow
        />
        <directionalLight position={[-6, 6, -4]} intensity={0.4} color="#bae6fd" />

        <Suspense fallback={null}>
          <Sky
            distance={450000}
            sunPosition={[10, 6, 4]}
            inclination={0.49}
            azimuth={0.25}
            rayleigh={2.2}
            turbidity={6}
            mieCoefficient={0.005}
            mieDirectionalG={0.85}
          />
          <Clouds material={THREE.MeshLambertMaterial} limit={120}>
            <Cloud position={[-4, 2.5, -6]} bounds={[6, 1.5, 1.5]} volume={8} opacity={0.55} segments={28} color="#ffffff" />
            <Cloud position={[5, 3, -7]} bounds={[7, 1.8, 1.8]} volume={9} opacity={0.5} segments={28} color="#f8fafc" />
            <Cloud position={[0, 4, -10]} bounds={[8, 2, 2]} volume={10} opacity={0.45} segments={30} color="#ffffff" />
            <Cloud position={[-7, 1, -4]} bounds={[5, 1.3, 1.3]} volume={6} opacity={0.4} segments={24} color="#e0f2fe" />
          </Clouds>
          <HoveringDrone />
          <FlyInCameraAnimator onComplete={onComplete} />
        </Suspense>
      </Canvas>

      <FlyInHud scenario={scenario} onSkip={onSkip} />
    </div>
  );
}

function HoveringDrone() {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/3d_models/fpv_drone.glb");

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.06;
    ref.current.rotation.y = clock.elapsedTime * 0.35;
  });

  return (
    <Center>
      <group ref={ref}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

function FlyInCameraAnimator({ onComplete }: { onComplete: () => void }) {
  const startRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  useFrame((state) => {
    if (startRef.current === null) startRef.current = performance.now();
    const elapsed = performance.now() - startRef.current;

    if (elapsed < FLYIN_HOVER_MS) {
      state.camera.position.set(0, 1.5, 6);
    } else if (elapsed < FLYIN_TOTAL_MS) {
      const t = (elapsed - FLYIN_HOVER_MS) / FLYIN_DOLLY_MS;
      const eased = 1 - Math.pow(1 - t, 3);
      state.camera.position.set(0, 1.5 - 1.1 * eased, 6 - 5.4 * eased);
    } else if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function FlyInHud({
  scenario,
  onSkip
}: {
  scenario: ReconScenario;
  onSkip: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute top-6 left-6 text-slate-800 font-mono text-[10px] tracking-widest leading-relaxed bg-white/65 backdrop-blur-sm border border-slate-300 px-3 py-2">
        <div className="text-[8px] text-slate-500 font-rajdhani font-bold mb-1 tracking-[0.25em]">
          START MISJI
        </div>
        <div>▸ {scenario.droneAgency}</div>
        <div>▸ TRYB: {scenario.mode}</div>
        <div className="text-emerald-700">▸ STATUS: WZBIJANIE SIĘ ▲</div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[9px] text-slate-700 font-mono tracking-widest mb-2 bg-white/65 backdrop-blur-sm px-3 py-1 border border-slate-300">
          AKWIZYCJA SYGNAŁU Z KAMERY DRONA…
        </div>
        <div className="w-64 h-0.5 bg-slate-300/60 mx-auto overflow-hidden">
          <div className="flyin-progress h-full bg-red-600" />
        </div>
        <button
          onClick={onSkip}
          className="pointer-events-auto mt-3 text-[9px] text-slate-700 hover:text-red-700 font-rajdhani tracking-widest border border-transparent hover:border-red-600 px-2 py-1 transition-all cursor-pointer bg-white/60 backdrop-blur-sm"
        >
          POMIŃ ANIMACJĘ →
        </button>
      </div>

      <style jsx>{`
        @keyframes flyinProgress {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .flyin-progress {
          animation: flyinProgress ${FLYIN_TOTAL_MS}ms linear forwards;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// FAZA 2 — Transparent POV overlay nad mapą Cesium
// ============================================================================

function PovOverlay({ scenario }: { scenario: ReconScenario }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [scenario.id]);

  const secs = String(elapsed % 60).padStart(2, "0");
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");

  return (
    <div className="absolute inset-0 animate-fadeIn">
      {/* Subtle map tint to make it clear we are in POV mode */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(40, 0, 0, 0.18)" }} />

      {/* Corner brackets */}
      <CornerBrackets />

      {/* Top-right HUD (REC + timer + battery) */}
      <div className="absolute top-6 right-32 text-red-200 font-mono text-[10px] leading-relaxed text-right pointer-events-none">
        <div className="theme-bg-panel/80 backdrop-blur-md border theme-border px-3 py-2 inline-block text-right">
          <div className="flex items-center justify-end gap-1.5 text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            REC {mins}:{secs}
          </div>
          <div className="theme-text-secondary">BATT 87% • GPS LOCK ✓</div>
          <div className="text-[9px] theme-neon-text font-rajdhani tracking-widest mt-1">
            MODE: {scenario.mode}
          </div>
        </div>
      </div>

      {/* Center crosshair */}
      <Crosshair />

      {/* CV banner */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140px] pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 border theme-neon-border backdrop-blur-sm text-[10px] font-bold font-rajdhani tracking-widest theme-neon-text shadow-[0_0_15px_rgba(239,68,68,0.5)]" style={{ background: "rgba(8, 0, 0, 0.85)" }}>
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>AI: ANALIZA OBRAZU NA ŻYWO</span>
          <span className="animate-pulse">▍</span>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-4 left-4 right-4 border theme-border theme-bg-panel/85 backdrop-blur-md px-4 py-2.5 font-mono text-[10px] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="text-[9px] theme-neon-text font-bold font-rajdhani tracking-widest flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-pulse" />
            STREAM ON-AIR
          </div>
          <div className="theme-text-secondary truncate font-bold">
            {scenario.scenarioTitle}
          </div>
        </div>
        <div className="flex items-center gap-3 theme-text-muted">
          <span>SKY MARSHAL</span>
          <span className="text-amber-400">• KOORDYNACJA WIELOSŁUŻBOWA</span>
        </div>
      </div>

      {/* Left data card */}
      <DataCard scenario={scenario} />
    </div>
  );
}

function DataCard({ scenario }: { scenario: ReconScenario }) {
  const statusColor =
    scenario.mapHighlightColor === "red"
      ? "text-red-400 border-red-500/60 bg-red-500/10"
      : scenario.mapHighlightColor === "amber"
      ? "text-amber-400 border-amber-500/60 bg-amber-500/10"
      : "text-red-300 border-red-500/60 bg-red-500/10";

  return (
    <div className="pointer-events-auto absolute top-20 left-4 bottom-20 w-[360px] max-w-[28vw] theme-bg-panel/90 backdrop-blur-md border theme-border clip-chamfer shadow-2xl flex flex-col overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="px-4 py-3 border-b theme-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] theme-neon-text font-bold font-rajdhani tracking-widest">
            {scenario.droneAgency}
          </span>
          <span className="text-[8px] theme-bg-app border theme-border px-1.5 py-0.5 theme-text-muted font-mono">
            LIVE
          </span>
        </div>
        <h2 className="text-[14px] font-extrabold font-rajdhani tracking-widest theme-text-primary leading-tight">
          {scenario.scenarioTitle}
        </h2>
        <div className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold font-rajdhani tracking-widest px-2 py-1 border ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            scenario.mapHighlightColor === "red" ? "bg-red-500" : scenario.mapHighlightColor === "amber" ? "bg-amber-400" : "bg-red-300"
          }`} />
          {scenario.scenarioStatus}
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b theme-border">
        <div className="text-[8px] theme-text-muted font-bold font-rajdhani tracking-[0.25em] mb-1.5">
          CO SIĘ DZIEJE
        </div>
        <p className="text-[11px] theme-text-secondary leading-relaxed font-mono">
          {scenario.description}
        </p>
      </div>

      {/* PLAN DZIAŁANIA */}
      <div className="px-4 py-3 border-b theme-border bg-red-500/5">
        <div className="text-[8px] theme-text-muted font-bold font-rajdhani tracking-[0.25em] mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 theme-neon-text" />
          PLAN DZIAŁANIA
        </div>
        <div className="flex flex-col gap-1.5">
          {scenario.plan.map((step, i) => (
            <PlanStepRow key={step.num} step={step} delayMs={500 + i * 350} />
          ))}
        </div>
      </div>

      {/* Data points */}
      <div className="px-4 py-3 border-b theme-border">
        <div className="text-[8px] theme-text-muted font-bold font-rajdhani tracking-[0.25em] mb-2">
          DANE OPERACYJNE
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {scenario.dataPoints.map((dp, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2 text-[10px] border-b border-red-900/30 pb-1">
              <span className="theme-text-muted font-mono shrink-0">{dp.label}</span>
              <span className="theme-text-primary font-bold font-sharetech text-right">{dp.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detections */}
      <div className="px-4 py-3 flex-1 overflow-y-auto terminal-scroll">
        <div className="text-[8px] theme-text-muted font-bold font-rajdhani tracking-[0.25em] mb-2 flex items-center gap-1.5">
          <Activity className="w-3 h-3 theme-neon-text animate-pulse" />
          DETEKCJA CV — OBIEKTY
        </div>
        <div className="flex flex-col gap-1.5">
          {scenario.detections.map((d, i) => {
            const colorClasses =
              d.color === "red"
                ? "border-red-500/60 bg-red-500/10 text-red-300"
                : d.color === "amber"
                ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                : "border-red-500/60 bg-red-500/10 text-red-300";
            return (
              <div
                key={i}
                className={`detection-item border px-2.5 py-1.5 ${colorClasses}`}
                style={{ animationDelay: `${800 + i * 600}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold font-rajdhani tracking-wider">
                    {d.label}
                  </span>
                  <span className="text-[10px] font-bold font-sharetech tabular-nums">
                    {d.confidence}%
                  </span>
                </div>
                {d.meta && (
                  <div className="text-[9px] theme-text-muted font-mono mt-0.5">
                    {d.meta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes detectionAppear {
          0% { opacity: 0; transform: translateX(-12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        :global(.animate-slideIn) {
          animation: slideIn 380ms ease-out forwards;
        }
        :global(.detection-item) {
          opacity: 0;
          animation: detectionAppear 500ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function CornerBrackets() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 theme-neon-border" />
      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 theme-neon-border" />
      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 theme-neon-border" />
      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 theme-neon-border" />
    </div>
  );
}

function Crosshair() {
  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="18" stroke="rgba(239,68,68,0.95)" strokeWidth="1.5" fill="none" />
        <circle cx="40" cy="40" r="30" stroke="rgba(239,68,68,0.35)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <line x1="40" y1="6" x2="40" y2="22" stroke="rgba(239,68,68,1)" strokeWidth="1.5" />
        <line x1="40" y1="58" x2="40" y2="74" stroke="rgba(239,68,68,1)" strokeWidth="1.5" />
        <line x1="6" y1="40" x2="22" y2="40" stroke="rgba(239,68,68,1)" strokeWidth="1.5" />
        <line x1="58" y1="40" x2="74" y2="40" stroke="rgba(239,68,68,1)" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="1.5" fill="rgba(239,68,68,1)" />
      </svg>
    </div>
  );
}

function PlanStepRow({ step, delayMs }: { step: ResolutionStep; delayMs: number }) {
  const statusStyles = {
    active: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      box: "border-red-500/60 bg-red-500/10 text-red-200",
      tag: "AKTYWNY",
      tagBg: "bg-red-500/30 text-red-100"
    },
    done: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      box: "border-emerald-500/60 bg-emerald-500/10 text-emerald-200",
      tag: "WYKONANE",
      tagBg: "bg-emerald-500/30 text-emerald-100"
    },
    pending: {
      icon: <Circle className="w-3.5 h-3.5" />,
      box: "border-red-900/60 bg-red-950/30 text-slate-400",
      tag: "OCZEKUJE",
      tagBg: "bg-red-950/60 text-slate-300"
    }
  }[step.status];

  return (
    <div
      className={`plan-step border px-2.5 py-1.5 flex items-start gap-2 ${statusStyles.box}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="text-[10px] font-bold font-rajdhani tabular-nums shrink-0 mt-0.5">
        [{step.num}]
      </span>
      <div className="shrink-0 mt-0.5">{statusStyles.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold font-rajdhani tracking-wide leading-tight">
          {step.text}
        </div>
        <div className={`mt-1 inline-block text-[8px] font-bold font-rajdhani tracking-[0.2em] px-1.5 py-0.5 ${statusStyles.tagBg}`}>
          {statusStyles.tag}
        </div>
      </div>
      <style jsx>{`
        @keyframes planStepAppear {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .plan-step {
          opacity: 0;
          animation: planStepAppear 420ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}

useGLTF.preload("/3d_models/fpv_drone.glb");
