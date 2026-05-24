"use client";

import { useEffect, useRef, useCallback } from "react";
import { ScenarioId } from "../data/reconScenarios";
import { Video, Signal } from "lucide-react";

interface LiveFeedProps {
  scenarioId: ScenarioId;
}

// ============================================================================
// LIVE FEED — Simulated drone camera feed per scenario
// ============================================================================

export function LiveFeed({ scenarioId }: LiveFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      switch (scenarioId) {
        case "mapa":
          drawAerialScan(ctx, w, h, t);
          break;
        case "mozliwosci":
          drawThermalScan(ctx, w, h, t);
          break;
        case "procedury":
          drawPoliceChase(ctx, w, h, t);
          break;
        case "zagrozenia":
          drawFireDetection(ctx, w, h, t);
          break;
        case "powodz":
          drawFloodMonitoring(ctx, w, h, t);
          break;
        case "dualuse":
          drawDualUse(ctx, w, h, t);
          break;
      }
      drawOverlay(ctx, w, h, t, scenarioId);
    },
    [scenarioId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    startTimeRef.current = performance.now();

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };
    resize();

    const loop = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const w = rect.width;
        const h = rect.height;
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        draw(ctx, w, h, elapsed);
        ctx.restore();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  const feedLabels: Record<ScenarioId, string> = {
    mapa: "DRON ZK • RGB-4K",
    mozliwosci: "DRON ZK • MULTI-SENSOR",
    procedury: "DRON POLICJI • TRACKING",
    zagrozenia: "DRON PSP • CV DETEKCJA",
    powodz: "DRON ZK • LIDAR HYDRO",
    dualuse: "DRON POLICJI • RF + EO/IR",
  };

  // For police chase, use real YouTube drone footage
  if (scenarioId === "procedury") {
    return (
      <div className="relative w-full h-full overflow-hidden bg-black">
        {/* YouTube embed — autoplay, muted, loop, no controls */}
        <div className="absolute inset-0">
          <iframe
            src="https://www.youtube.com/embed/_XedA4_8k5s?autoplay=1&mute=1&loop=1&playlist=_XedA4_8k5s&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&start=30"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "180%",
              height: "180%",
              border: "none",
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
          />
        </div>

        {/* Night vision / drone cam overlay effect */}
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{
          background: "linear-gradient(180deg, rgba(0,20,0,0.15) 0%, transparent 30%, transparent 70%, rgba(0,20,0,0.15) 100%)",
          mixBlendMode: "multiply",
        }} />

        {/* Scan lines */}
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 3px)",
            backgroundSize: "100% 3px",
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none z-[3]" style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)",
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

        {/* AI tracking box overlay */}
        <div className="absolute z-[4] pointer-events-none" style={{ top: "35%", left: "40%", width: "20%", height: "25%" }}>
          <div className="w-full h-full border border-red-500/70 animate-pulse" style={{ boxShadow: "0 0 8px rgba(239,68,68,0.3)" }}>
            <div className="absolute -top-3 left-0 text-[7px] font-mono text-red-400 font-bold">
              ◆ TARGET • AI TRACKING
            </div>
            <div className="absolute -bottom-3 right-0 text-[6px] font-mono text-red-400/70">
              CONF: 94% • v=78 km/h
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm border-b border-red-900/50 z-10">
          <div className="flex items-center gap-2">
            <Video className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-rajdhani font-bold tracking-widest text-red-400">
              LIVE FEED
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Signal className="w-3 h-3 text-green-400" />
            <span className="text-[8px] font-mono text-slate-400">
              {feedLabels[scenarioId]}
            </span>
          </div>
        </div>
        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1 bg-black/70 backdrop-blur-sm border-t border-red-900/50 z-10">
          <LiveTimestamp />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm border-b border-red-900/50 z-10">
        <div className="flex items-center gap-2">
          <Video className="w-3 h-3 text-red-500" />
          <span className="text-[9px] font-rajdhani font-bold tracking-widest text-red-400">
            LIVE FEED
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <Signal className="w-3 h-3 text-green-400" />
          <span className="text-[8px] font-mono text-slate-400">
            {feedLabels[scenarioId]}
          </span>
        </div>
      </div>
      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1 bg-black/70 backdrop-blur-sm border-t border-red-900/50 z-10">
        <LiveTimestamp />
      </div>
    </div>
  );
}

function LiveTimestamp() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const now = new Date();
        ref.current.textContent = `${now.toLocaleDateString("pl-PL")} ${now.toLocaleTimeString("pl-PL")} UTC+${String(-(now.getTimezoneOffset() / 60)).padStart(1, "0")}`;
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span ref={ref} className="text-[8px] font-mono text-slate-500 tabular-nums" />
  );
}

// ============================================================================
// SCENARIO 1: AERIAL SCAN — green night-vision mapping with grid + scan lines
// ============================================================================
function drawAerialScan(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Dark green base — simulating aerial night vision
  ctx.fillStyle = "#0a1a0a";
  ctx.fillRect(0, 0, w, h);

  // Terrain noise blocks
  const seed = 42;
  for (let y = 0; y < h; y += 12) {
    for (let x = 0; x < w; x += 12) {
      const n = Math.sin(seed + x * 0.01 + y * 0.02 + t * 0.3) * 0.5 + 0.5;
      const brightness = 15 + n * 40;
      ctx.fillStyle = `rgb(${brightness * 0.4}, ${brightness}, ${brightness * 0.3})`;
      ctx.fillRect(x, y, 11, 11);
    }
  }

  // Buildings/structures — darker rectangles scattered
  const buildings = [
    [0.15, 0.2, 0.12, 0.15],
    [0.35, 0.4, 0.18, 0.1],
    [0.6, 0.15, 0.1, 0.2],
    [0.55, 0.5, 0.2, 0.12],
    [0.2, 0.6, 0.15, 0.08],
    [0.7, 0.65, 0.13, 0.14],
    [0.1, 0.82, 0.2, 0.08],
    [0.45, 0.75, 0.14, 0.1],
  ];
  buildings.forEach(([bx, by, bw, bh]) => {
    const px = bx * w, py = by * h, pw = bw * w, ph = bh * h;
    ctx.fillStyle = `rgba(0, 80, 0, 0.6)`;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = `rgba(0, 200, 0, 0.3)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);
  });

  // Grid overlay
  ctx.strokeStyle = "rgba(0, 255, 0, 0.08)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Moving scan line (horizontal)
  const scanY = ((t * 0.15) % 1) * h;
  const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
  grad.addColorStop(0, "rgba(0, 255, 0, 0)");
  grad.addColorStop(0.5, "rgba(0, 255, 0, 0.25)");
  grad.addColorStop(1, "rgba(0, 255, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, scanY - 20, w, 40);

  // LIDAR points — scattered green dots
  for (let i = 0; i < 60; i++) {
    const px = ((Math.sin(i * 73.7 + t * 2) * 0.5 + 0.5) * w);
    const py = ((Math.cos(i * 127.3 + t * 1.5) * 0.5 + 0.5) * h);
    ctx.fillStyle = `rgba(0, 255, 0, ${0.3 + Math.sin(t * 3 + i) * 0.3})`;
    ctx.fillRect(px - 1, py - 1, 2, 2);
  }
}

// ============================================================================
// SCENARIO 2: PREVENTIVE ANALYSIS — multi-sensor factory inspection
// ============================================================================
function drawThermalScan(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Deep blue-black base — IR palette
  ctx.fillStyle = "#080818";
  ctx.fillRect(0, 0, w, h);

  // Background — cool blue thermal noise
  for (let y = 0; y < h; y += 10) {
    for (let x = 0; x < w; x += 10) {
      const n = Math.sin(x * 0.012 + y * 0.018 + t * 0.15) * 0.5 + 0.5;
      const r = n * 15;
      const g = n * 12;
      const b = 30 + n * 50;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 9, 9);
    }
  }

  // Factory halls — cool blue footprints
  const halls: [number, number, number, number, string, string][] = [
    [0.08, 0.12, 0.2, 0.16, "HALA #1", "ok"],
    [0.32, 0.12, 0.18, 0.18, "HALA #2", "ok"],
    [0.54, 0.1, 0.2, 0.2, "HALA #3", "ok"],
    [0.78, 0.14, 0.16, 0.16, "HALA #4", "warn"],
    [0.08, 0.4, 0.22, 0.14, "HALA #5", "ok"],
    [0.34, 0.38, 0.2, 0.16, "MAGAZYN", "ok"],
    [0.58, 0.4, 0.18, 0.14, "HALA #7", "ok"],
    [0.08, 0.65, 0.24, 0.12, "HALA #9", "ok"],
    [0.36, 0.64, 0.2, 0.14, "HALA #10", "ok"],
    [0.6, 0.66, 0.22, 0.12, "HALA #11", "ok"],
  ];

  halls.forEach(([bx, by, bw, bh, label, status]) => {
    const px = bx * w, py = by * h, pw = bw * w, ph = bh * h;
    const isWarn = status === "warn";

    // Building body — slightly warmer for warn
    ctx.fillStyle = isWarn ? "rgba(60, 30, 10, 0.7)" : "rgba(15, 20, 40, 0.7)";
    ctx.fillRect(px, py, pw, ph);

    // Border — green for OK, amber for warn
    ctx.strokeStyle = isWarn ? "rgba(255, 180, 0, 0.6)" : "rgba(0, 180, 255, 0.25)";
    ctx.lineWidth = isWarn ? 1.5 : 0.8;
    ctx.strokeRect(px, py, pw, ph);

    // Building label
    ctx.font = "bold 7px 'Rajdhani', sans-serif";
    ctx.fillStyle = isWarn ? "#ffaa00" : "rgba(100, 180, 255, 0.5)";
    ctx.fillText(label, px + 4, py + 10);

    // Status checkmark or warning
    if (!isWarn) {
      ctx.font = "7px monospace";
      ctx.fillStyle = "rgba(0, 200, 100, 0.5)";
      ctx.fillText("✓ OK", px + pw - 24, py + ph - 4);
    }
  });

  // ---- Thermal anomaly on HALA #4 ----
  const anomX = 0.86 * w, anomY = 0.22 * h;
  const anomPulse = 1 + Math.sin(t * 2.5) * 0.1;
  const anomGrad = ctx.createRadialGradient(anomX, anomY, 0, anomX, anomY, 28 * anomPulse);
  anomGrad.addColorStop(0, "rgba(255, 200, 50, 0.7)");
  anomGrad.addColorStop(0.4, "rgba(255, 100, 0, 0.4)");
  anomGrad.addColorStop(1, "rgba(100, 0, 0, 0)");
  ctx.fillStyle = anomGrad;
  ctx.beginPath();
  ctx.arc(anomX, anomY, 28 * anomPulse, 0, Math.PI * 2);
  ctx.fill();

  // Anomaly CV box
  ctx.strokeStyle = "rgba(255, 180, 0, 0.8)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.strokeRect(anomX - 22, anomY - 18, 44, 36);
  ctx.setLineDash([]);
  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ffaa00";
  ctx.fillText("⚠ +58°C ANOMALIA", anomX - 22, anomY - 22);

  // ---- Perimeter fence (dashed rectangle around factory) ----
  const fenceMargin = 0.04;
  const fx = fenceMargin * w, fy = fenceMargin * h;
  const fw = (1 - 2 * fenceMargin) * w, fh = (1 - 2 * fenceMargin) * h;
  ctx.strokeStyle = "rgba(0, 200, 100, 0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(fx, fy, fw, fh);
  ctx.setLineDash([]);

  // Fence label
  ctx.font = "6px monospace";
  ctx.fillStyle = "rgba(0, 200, 100, 0.4)";
  ctx.fillText("PERYMETR — OGRODZENIE", fx + 4, fy - 3);

  // Fence breach — sector N-7 (top right area)
  const breachX = 0.75 * w, breachY = fy;
  ctx.strokeStyle = "rgba(255, 100, 0, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(breachX - 15, breachY);
  ctx.lineTo(breachX + 15, breachY);
  ctx.stroke();

  // Breach highlight — pulsing
  const breachPulse = Math.sin(t * 3) * 0.3 + 0.7;
  const breachGrad = ctx.createRadialGradient(breachX, breachY, 0, breachX, breachY, 18);
  breachGrad.addColorStop(0, `rgba(255, 100, 0, ${0.4 * breachPulse})`);
  breachGrad.addColorStop(1, "rgba(255, 100, 0, 0)");
  ctx.fillStyle = breachGrad;
  ctx.beginPath();
  ctx.arc(breachX, breachY, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ff6600";
  ctx.fillText("⚠ USZKODZENIE N-7", breachX - 35, breachY + 16);

  // ---- Leak detection — rampa załadunkowa (bottom center) ----
  const leakX = 0.5 * w, leakY = 0.88 * h;
  const leakPulse = 1 + Math.sin(t * 2) * 0.15;
  const leakGrad = ctx.createRadialGradient(leakX, leakY, 0, leakX, leakY, 20 * leakPulse);
  leakGrad.addColorStop(0, "rgba(255, 50, 50, 0.6)");
  leakGrad.addColorStop(0.5, "rgba(200, 30, 80, 0.3)");
  leakGrad.addColorStop(1, "rgba(100, 0, 50, 0)");
  ctx.fillStyle = leakGrad;
  ctx.beginPath();
  ctx.arc(leakX, leakY, 20 * leakPulse, 0, Math.PI * 2);
  ctx.fill();

  // Leak CV box
  ctx.strokeStyle = "rgba(255, 50, 50, 0.7)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.strokeRect(leakX - 18, leakY - 14, 36, 28);
  ctx.setLineDash([]);
  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ff4444";
  ctx.fillText("⚠ WYCIEK CIECZY", leakX - 30, leakY - 18);
  ctx.font = "6px monospace";
  ctx.fillStyle = "#ff8888";
  ctx.fillText("RAMPA ZAŁADUNKOWA", leakX - 35, leakY + 22);

  // ---- Access gates — green checkmarks ----
  const gates = [
    { x: 0.02, y: 0.5, label: "BRAMA ZACHODNIA ✓" },
    { x: 0.96, y: 0.5, label: "BRAMA WSCHODNIA ✓" },
    { x: 0.5, y: 0.02, label: "BRAMA PÓŁNOCNA ✓" },
  ];
  gates.forEach((g) => {
    const gx = g.x * w, gy = g.y * h;
    ctx.fillStyle = "rgba(0, 200, 100, 0.7)";
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "6px monospace";
    ctx.fillStyle = "rgba(0, 200, 100, 0.6)";
    ctx.fillText(g.label, gx + 6, gy + 3);
  });

  // ---- Scanning drone path indicator ----
  const droneProgress = (t * 0.06) % 1;
  const droneX = fx + droneProgress * fw;
  const scanRow = Math.floor((t * 0.02) % 6);
  const droneY = fy + (scanRow / 6) * fh + fh / 12;

  // Drone position
  ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
  ctx.beginPath();
  ctx.arc(droneX, droneY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Drone scan beam
  ctx.strokeStyle = "rgba(0, 255, 200, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(droneX, droneY);
  ctx.lineTo(droneX - 20, droneY + 30);
  ctx.lineTo(droneX + 20, droneY + 30);
  ctx.closePath();
  ctx.stroke();

  ctx.font = "bold 6px monospace";
  ctx.fillStyle = "rgba(0, 255, 200, 0.7)";
  ctx.fillText("DRON ZK", droneX + 6, droneY - 4);

  // ---- Progress bar at bottom ----
  const progW = w * 0.4, progH = 4;
  const progX = w * 0.3, progY = h - 18;
  const progress = 0.67 + Math.sin(t * 0.3) * 0.02;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(progX, progY, progW, progH);
  ctx.fillStyle = "rgba(0, 200, 100, 0.6)";
  ctx.fillRect(progX, progY, progW * progress, progH);
  ctx.font = "6px monospace";
  ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
  ctx.fillText(`SKAN: ${Math.floor(progress * 100)}%`, progX + progW + 6, progY + 4);
}

// ============================================================================
// SCENARIO 3: POLICE CHASE — night vision helicopter cam with pursuit
// ============================================================================
function drawPoliceChase(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Dark gray-blue base — night city view from above
  ctx.fillStyle = "#080c12";
  ctx.fillRect(0, 0, w, h);

  // Roads grid
  ctx.strokeStyle = "rgba(100, 120, 140, 0.25)";
  ctx.lineWidth = 8;
  // Main road — horizontal through center
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.lineTo(w, h * 0.48);
  ctx.stroke();
  // Bridge road — vertical
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  // Side roads
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(80, 100, 120, 0.15)";
  ctx.beginPath(); ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.25, 0); ctx.lineTo(w * 0.25, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.75, 0); ctx.lineTo(w * 0.75, h); ctx.stroke();

  // River (bridge scenario)
  ctx.fillStyle = "rgba(10, 30, 60, 0.6)";
  ctx.fillRect(w * 0.43, 0, w * 0.14, h);

  // Building blocks
  const blocks = [
    [0.05, 0.05, 0.15, 0.15], [0.25, 0.05, 0.12, 0.13],
    [0.05, 0.55, 0.18, 0.12], [0.7, 0.05, 0.13, 0.18],
    [0.7, 0.55, 0.16, 0.14], [0.08, 0.28, 0.1, 0.1],
    [0.75, 0.32, 0.14, 0.1], [0.2, 0.78, 0.12, 0.1],
    [0.65, 0.78, 0.15, 0.12],
  ];
  blocks.forEach(([bx, by, bw, bh]) => {
    ctx.fillStyle = "rgba(20, 25, 35, 0.8)";
    ctx.fillRect(bx * w, by * h, bw * w, bh * h);
    // Window lights
    for (let wy = by * h + 4; wy < (by + bh) * h - 4; wy += 6) {
      for (let wx = bx * w + 4; wx < (bx + bw) * w - 4; wx += 6) {
        if (Math.sin(wx * 37 + wy * 53) > 0.2) {
          ctx.fillStyle = "rgba(255, 220, 150, 0.15)";
          ctx.fillRect(wx, wy, 3, 2);
        }
      }
    }
  });

  // ---- Fleeing vehicle ----
  const carProgress = (t * 0.08) % 1;
  const carX = w * 0.5;
  const carY = h * (0.85 - carProgress * 0.7);

  // Vehicle headlights glow
  const headlightGrad = ctx.createRadialGradient(carX, carY - 6, 0, carX, carY - 6, 30);
  headlightGrad.addColorStop(0, "rgba(255, 255, 200, 0.4)");
  headlightGrad.addColorStop(1, "rgba(255, 255, 200, 0)");
  ctx.fillStyle = headlightGrad;
  ctx.fillRect(carX - 30, carY - 36, 60, 30);

  // Vehicle body
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(carX - 4, carY - 6, 8, 12);

  // AI tracking box around fleeing vehicle
  const boxPulse = 1 + Math.sin(t * 4) * 0.06;
  const bSize = 28 * boxPulse;
  ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(carX - bSize / 2, carY - bSize / 2, bSize, bSize);
  ctx.setLineDash([]);

  // Tracking label
  ctx.font = "bold 8px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ff4444";
  ctx.fillText("◆ PODEJRZANY", carX + bSize / 2 + 4, carY - 4);
  ctx.fillStyle = "#ffaa44";
  ctx.font = "7px monospace";
  ctx.fillText(`v: 78 km/h`, carX + bSize / 2 + 4, carY + 6);

  // ---- Police cars (flashing blue/red) ----
  const policePositions = [
    { x: w * 0.5, y: carY + 60, label: "PATROL 112" },
    { x: w * 0.65 - (carProgress * w * 0.15), y: carY + 20, label: "PATROL 218" },
  ];

  policePositions.forEach((p) => {
    // Flashing lights
    const flashPhase = Math.floor(t * 8) % 2;
    const leftColor = flashPhase === 0 ? "rgba(50, 100, 255, 0.8)" : "rgba(50, 100, 255, 0.2)";
    const rightColor = flashPhase === 0 ? "rgba(255, 50, 50, 0.2)" : "rgba(255, 50, 50, 0.8)";

    const lightGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
    lightGrad.addColorStop(0, flashPhase === 0 ? "rgba(50, 100, 255, 0.3)" : "rgba(255, 50, 50, 0.3)");
    lightGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lightGrad;
    ctx.fillRect(p.x - 20, p.y - 20, 40, 40);

    ctx.fillStyle = leftColor;
    ctx.fillRect(p.x - 5, p.y - 2, 3, 3);
    ctx.fillStyle = rightColor;
    ctx.fillRect(p.x + 2, p.y - 2, 3, 3);

    // Car body
    ctx.fillStyle = "#8888ff";
    ctx.fillRect(p.x - 3, p.y - 5, 6, 10);

    ctx.font = "6px monospace";
    ctx.fillStyle = "#6688ff";
    ctx.fillText(p.label, p.x + 10, p.y + 2);
  });

  // Blockade ahead
  const blockadeY = h * 0.12;
  ctx.strokeStyle = "rgba(255, 180, 0, 0.7)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(w * 0.35, blockadeY);
  ctx.lineTo(w * 0.65, blockadeY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ffaa00";
  ctx.fillText("▲ BLOKADA — WAŁOWA", w * 0.5 - 40, blockadeY - 6);

  // Night vision grain
  for (let i = 0; i < 200; i++) {
    const nx = Math.random() * w;
    const ny = Math.random() * h;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
    ctx.fillRect(nx, ny, 1, 1);
  }
}

// ============================================================================
// SCENARIO 4: FIRE DETECTION — thermal + smoke + fire CV
// ============================================================================
function drawFireDetection(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Dark warm base
  ctx.fillStyle = "#120808";
  ctx.fillRect(0, 0, w, h);

  // Building footprints — factory halls
  const halls = [
    [0.1, 0.2, 0.25, 0.2],
    [0.4, 0.15, 0.2, 0.25],
    [0.65, 0.2, 0.22, 0.18],
    [0.1, 0.55, 0.2, 0.15],
    [0.4, 0.5, 0.2, 0.2],   // hall #7 — on fire
    [0.65, 0.55, 0.25, 0.15],
    [0.1, 0.8, 0.3, 0.1],
    [0.55, 0.8, 0.25, 0.1],
  ];

  halls.forEach(([bx, by, bw, bh], i) => {
    const isOnFire = i === 4;
    ctx.fillStyle = isOnFire ? "rgba(60, 20, 5, 0.9)" : "rgba(30, 15, 10, 0.7)";
    ctx.fillRect(bx * w, by * h, bw * w, bh * h);
    ctx.strokeStyle = isOnFire ? "rgba(255, 100, 0, 0.5)" : "rgba(100, 40, 20, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx * w, by * h, bw * w, bh * h);
  });

  // FIRE in hall #7
  const fireCX = 0.5 * w, fireCY = 0.6 * h;

  // Fire glow — large pulsing radial
  for (let layer = 0; layer < 3; layer++) {
    const pulse = 1 + Math.sin(t * (3 + layer) + layer * 2) * 0.15;
    const radius = (40 + layer * 25) * pulse;
    const grad = ctx.createRadialGradient(fireCX, fireCY, 0, fireCX, fireCY, radius);
    if (layer === 0) {
      grad.addColorStop(0, "rgba(255, 255, 200, 0.8)");
      grad.addColorStop(0.3, "rgba(255, 200, 50, 0.6)");
      grad.addColorStop(0.7, "rgba(255, 80, 0, 0.3)");
      grad.addColorStop(1, "rgba(100, 0, 0, 0)");
    } else if (layer === 1) {
      grad.addColorStop(0, "rgba(255, 150, 0, 0.4)");
      grad.addColorStop(0.5, "rgba(200, 50, 0, 0.2)");
      grad.addColorStop(1, "rgba(80, 0, 0, 0)");
    } else {
      grad.addColorStop(0, "rgba(200, 80, 0, 0.2)");
      grad.addColorStop(1, "rgba(40, 0, 0, 0)");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fireCX, fireCY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flame particles rising
  for (let i = 0; i < 30; i++) {
    const age = ((t * 1.5 + i * 0.4) % 3) / 3; // 0-1
    const px = fireCX + Math.sin(i * 7.3 + t) * 20 * (1 - age);
    const py = fireCY - age * 80 - Math.sin(i * 3.1) * 10;
    const alpha = (1 - age) * 0.7;
    const size = 2 + (1 - age) * 3;

    if (age < 0.3) {
      ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    } else if (age < 0.6) {
      ctx.fillStyle = `rgba(255, 120, 0, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(100, 30, 0, ${alpha * 0.5})`;
    }
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smoke cloud drifting upward and right
  for (let i = 0; i < 12; i++) {
    const age = ((t * 0.4 + i * 0.8) % 5) / 5;
    const sx = fireCX + age * 60 + Math.sin(i * 4.7) * 15;
    const sy = fireCY - age * 120 - 20;
    const sr = 15 + age * 40;
    const alpha = Math.max(0, 0.2 - age * 0.2);
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    grad.addColorStop(0, `rgba(80, 60, 50, ${alpha})`);
    grad.addColorStop(1, `rgba(40, 30, 25, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // CV detection box around fire
  const boxPulse = 1 + Math.sin(t * 3) * 0.05;
  const fireBoxW = 100 * boxPulse, fireBoxH = 70 * boxPulse;
  ctx.strokeStyle = "rgba(255, 50, 0, 0.9)";
  ctx.lineWidth = 1.5;

  // Corner brackets style
  const cx = fireCX, cy = fireCY;
  const bLen = 12;
  const hlf = { w: fireBoxW / 2, h: fireBoxH / 2 };

  // Top-left
  ctx.beginPath();
  ctx.moveTo(cx - hlf.w, cy - hlf.h + bLen);
  ctx.lineTo(cx - hlf.w, cy - hlf.h);
  ctx.lineTo(cx - hlf.w + bLen, cy - hlf.h);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(cx + hlf.w - bLen, cy - hlf.h);
  ctx.lineTo(cx + hlf.w, cy - hlf.h);
  ctx.lineTo(cx + hlf.w, cy - hlf.h + bLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cx - hlf.w, cy + hlf.h - bLen);
  ctx.lineTo(cx - hlf.w, cy + hlf.h);
  ctx.lineTo(cx - hlf.w + bLen, cy + hlf.h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(cx + hlf.w - bLen, cy + hlf.h);
  ctx.lineTo(cx + hlf.w, cy + hlf.h);
  ctx.lineTo(cx + hlf.w, cy + hlf.h - bLen);
  ctx.stroke();

  // Labels
  ctx.font = "bold 9px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ff3333";
  ctx.fillText("🔥 OGIEŃ — HALA #7", cx - hlf.w, cy - hlf.h - 6);

  ctx.font = "bold 8px monospace";
  ctx.fillStyle = "#ff8800";
  const tempPulse = 700 + Math.floor(Math.sin(t * 2) * 30);
  ctx.fillText(`TEMP: ~${tempPulse}°C`, cx - hlf.w, cy + hlf.h + 14);
  ctx.fillText(`AREA: ~180 m²`, cx - hlf.w, cy + hlf.h + 24);

  // Evac route arrow
  ctx.strokeStyle = "rgba(0, 255, 100, 0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(fireCX, fireCY - 60);
  ctx.lineTo(w * 0.2, h * 0.15);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#00ff66";
  ctx.fillText("▲ PUNKT ZBORNY", w * 0.2 - 30, h * 0.15 - 6);

  // Fire trucks approaching — animated dots
  const trucks = [
    { startX: 0.1, startY: 0.05, label: "PSP JRG" },
    { startX: 0.9, startY: 0.5, label: "OSP PYS" },
    { startX: 0.1, startY: 0.95, label: "OSP BOJ" },
  ];
  trucks.forEach((tr, i) => {
    const progress = Math.min(1, ((t - 1 + i * 0.5) * 0.1) % 1.2);
    const tx = tr.startX * w + (fireCX - tr.startX * w) * progress;
    const ty = tr.startY * h + (fireCY - tr.startY * h) * progress;

    // Flashing red light
    const flash = Math.floor(t * 6) % 2;
    ctx.fillStyle = flash === 0 ? "rgba(255, 50, 0, 0.8)" : "rgba(255, 50, 0, 0.2)";
    const lightGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 10);
    lightGrad.addColorStop(0, flash === 0 ? "rgba(255, 50, 0, 0.4)" : "rgba(255, 50, 0, 0.1)");
    lightGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lightGrad;
    ctx.fillRect(tx - 10, ty - 10, 20, 20);

    ctx.fillStyle = "#ff4444";
    ctx.fillRect(tx - 3, ty - 3, 6, 6);

    ctx.font = "6px monospace";
    ctx.fillStyle = "#ff6666";
    ctx.fillText(tr.label, tx + 8, ty + 2);
  });
}

// ============================================================================
// COMMON OVERLAY — scan lines, noise, timestamp, crosshair corner ticks
// ============================================================================
function drawOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, scenario: ScenarioId) {
  // Scan lines (CRT effect)
  ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // Film grain
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Vignette
  const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
  vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
  vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, w, h);

  // Corner ticks
  const tickLen = 15;
  const tickColor = scenario === "procedury" ? "rgba(100, 150, 255, 0.5)"
    : scenario === "zagrozenia" ? "rgba(255, 80, 0, 0.5)"
    : scenario === "mozliwosci" ? "rgba(255, 180, 0, 0.5)"
    : "rgba(0, 255, 0, 0.5)";

  ctx.strokeStyle = tickColor;
  ctx.lineWidth = 1;
  // TL
  ctx.beginPath(); ctx.moveTo(4, 4 + tickLen); ctx.lineTo(4, 4); ctx.lineTo(4 + tickLen, 4); ctx.stroke();
  // TR
  ctx.beginPath(); ctx.moveTo(w - 4 - tickLen, 4); ctx.lineTo(w - 4, 4); ctx.lineTo(w - 4, 4 + tickLen); ctx.stroke();
  // BL
  ctx.beginPath(); ctx.moveTo(4, h - 4 - tickLen); ctx.lineTo(4, h - 4); ctx.lineTo(4 + tickLen, h - 4); ctx.stroke();
  // BR
  ctx.beginPath(); ctx.moveTo(w - 4 - tickLen, h - 4); ctx.lineTo(w - 4, h - 4); ctx.lineTo(w - 4, h - 4 - tickLen); ctx.stroke();

  // Coordinates display — bottom left
  ctx.font = "7px monospace";
  ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
  ctx.fillText("50.548° N  22.049° E", 10, h - 10);

  // Altitude — bottom right
  const altLabels: Record<ScenarioId, string> = {
    mapa: "ALT 120m AGL",
    mozliwosci: "ALT 85m AGL",
    procedury: "ALT 150m AGL",
    zagrozenia: "ALT 100m AGL",
    powodz: "ALT 90m AGL",
    dualuse: "ALT 110m AGL",
  };
  ctx.fillText(altLabels[scenario], w - 80, h - 10);
}

// ============================================================================
// SCENARIO 5: FLOOD MONITORING — water level, bridge, evacuation
// ============================================================================
function drawFloodMonitoring(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Dark blue base
  ctx.fillStyle = "#040a18";
  ctx.fillRect(0, 0, w, h);

  // Terrain — dark green/brown
  for (let y = 0; y < h; y += 10) {
    for (let x = 0; x < w; x += 10) {
      const n = Math.sin(x * 0.01 + y * 0.015 + 7) * 0.5 + 0.5;
      ctx.fillStyle = `rgb(${10 + n * 15}, ${15 + n * 20}, ${8 + n * 12})`;
      ctx.fillRect(x, y, 9, 9);
    }
  }

  // River San — flowing through center vertically
  const riverW = w * 0.22;
  const riverX = w * 0.39;
  
  // Water — animated flow
  for (let y = 0; y < h; y += 4) {
    const wobble = Math.sin(y * 0.02 + t * 2) * 8;
    const flowAlpha = 0.5 + Math.sin(y * 0.05 + t * 3) * 0.15;
    ctx.fillStyle = `rgba(20, 80, 180, ${flowAlpha})`;
    ctx.fillRect(riverX + wobble, y, riverW, 4);
  }

  // Water level indicator
  const waterRise = Math.sin(t * 0.3) * 0.03;
  const floodExtent = riverW * (1.3 + waterRise);
  const floodX = riverX - (floodExtent - riverW) / 2;
  
  // Flood zone — semi-transparent water overflow
  ctx.fillStyle = "rgba(30, 100, 200, 0.2)";
  ctx.fillRect(floodX, 0, floodExtent, h);

  // Bridge — horizontal across river
  const bridgeY = h * 0.4;
  ctx.fillStyle = "rgba(80, 70, 60, 0.8)";
  ctx.fillRect(riverX - 30, bridgeY - 4, riverW + 60, 8);
  ctx.strokeStyle = "rgba(200, 180, 150, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(riverX - 30, bridgeY - 4, riverW + 60, 8);

  // Bridge pillars
  for (let i = 0; i < 4; i++) {
    const px = riverX + (riverW / 5) * (i + 1);
    ctx.fillStyle = i === 2 ? "rgba(255, 150, 0, 0.8)" : "rgba(150, 130, 110, 0.6)";
    ctx.fillRect(px - 3, bridgeY - 2, 6, 12);
  }

  // Label bridge
  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ccc";
  ctx.fillText("MOST BORA-KOMOROWSKIEGO", riverX - 25, bridgeY - 8);

  // Pillar #3 warning
  ctx.fillStyle = "#ffaa00";
  ctx.fillText("⚠ FILAR #3 — EROZJA", riverX + riverW * 0.5, bridgeY + 20);

  // Water level gauge
  const gaugeX = 20, gaugeY = h * 0.15, gaugeH = h * 0.5;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(gaugeX, gaugeY, 14, gaugeH);
  
  const level = 0.82 + waterRise;
  const levelColor = level > 0.8 ? "#ff4444" : level > 0.6 ? "#ffaa00" : "#44cc88";
  ctx.fillStyle = levelColor;
  ctx.fillRect(gaugeX, gaugeY + gaugeH * (1 - level), 14, gaugeH * level);
  
  // Alarm line
  const alarmY = gaugeY + gaugeH * 0.2;
  ctx.strokeStyle = "rgba(255, 50, 50, 0.7)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.beginPath(); ctx.moveTo(gaugeX - 4, alarmY); ctx.lineTo(gaugeX + 20, alarmY); ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.font = "6px monospace";
  ctx.fillStyle = "#ff4444";
  ctx.fillText("ALARM 580", gaugeX + 18, alarmY + 3);
  ctx.fillStyle = levelColor;
  ctx.fillText("620 cm", gaugeX + 18, gaugeY + gaugeH * (1 - level) + 8);
  ctx.fillStyle = "#aaa";
  ctx.fillText("POZIOM SANU", gaugeX - 2, gaugeY - 4);

  // Flooded buildings
  const buildings = [
    [0.25, 0.2, 0.08, 0.06], [0.2, 0.55, 0.07, 0.05],
    [0.7, 0.3, 0.09, 0.07], [0.75, 0.6, 0.06, 0.05],
    [0.18, 0.75, 0.08, 0.06], [0.72, 0.8, 0.07, 0.05],
  ];
  buildings.forEach(([bx, by, bw, bh]) => {
    const inFlood = bx * w > floodX && bx * w < floodX + floodExtent;
    ctx.fillStyle = inFlood ? "rgba(50, 30, 10, 0.8)" : "rgba(30, 35, 25, 0.6)";
    ctx.fillRect(bx * w, by * h, bw * w, bh * h);
    if (inFlood) {
      ctx.strokeStyle = "rgba(255, 100, 0, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx * w, by * h, bw * w, bh * h);
    }
  });

  // Evacuation route — green dashed line
  ctx.strokeStyle = "rgba(0, 255, 100, 0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(w * 0.7, h * 0.4);
  ctx.lineTo(w * 0.85, h * 0.25);
  ctx.lineTo(w * 0.9, h * 0.1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#00ff66";
  ctx.fillText("▲ EWAKUACJA DK77", w * 0.82, h * 0.08);

  // Drone position
  const droneY = h * 0.35 + Math.sin(t * 0.5) * 10;
  ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
  ctx.beginPath(); ctx.arc(w * 0.5, droneY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.font = "bold 6px monospace";
  ctx.fillStyle = "rgba(0, 255, 200, 0.7)";
  ctx.fillText("DRON ZK", w * 0.5 + 6, droneY - 4);
}

// ============================================================================
// SCENARIO 6: DUAL-USE — hostile drone detection & RF tracking
// ============================================================================
function drawDualUse(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Very dark base — tactical night vision
  ctx.fillStyle = "#050808";
  ctx.fillRect(0, 0, w, h);

  // Terrain noise
  for (let y = 0; y < h; y += 10) {
    for (let x = 0; x < w; x += 10) {
      const n = Math.sin(x * 0.01 + y * 0.012 + 5) * 0.5 + 0.5;
      ctx.fillStyle = `rgb(${8 + n * 10}, ${10 + n * 14}, ${8 + n * 10})`;
      ctx.fillRect(x, y, 9, 9);
    }
  }

  // HSW factory complex — center
  const factoryX = w * 0.3, factoryY = h * 0.25;
  const factoryW = w * 0.4, factoryH = h * 0.5;
  ctx.fillStyle = "rgba(20, 25, 20, 0.8)";
  ctx.fillRect(factoryX, factoryY, factoryW, factoryH);
  ctx.strokeStyle = "rgba(100, 150, 100, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(factoryX, factoryY, factoryW, factoryH);
  ctx.font = "bold 8px 'Rajdhani', sans-serif";
  ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
  ctx.fillText("HSW S.A.", factoryX + 5, factoryY + 12);

  // Protection zone — pulsing circle
  const zoneCX = factoryX + factoryW / 2;
  const zoneCY = factoryY + factoryH / 2;
  const zoneR = Math.min(w, h) * 0.4;
  const zonePulse = 1 + Math.sin(t * 1.5) * 0.03;

  ctx.strokeStyle = `rgba(255, 50, 50, ${0.2 + Math.sin(t * 2) * 0.1})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(zoneCX, zoneCY, zoneR * zonePulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "rgba(255, 80, 80, 0.6)";
  ctx.fillText("STREFA OCHRONNA NOTAM P-23", zoneCX - 55, zoneCY - zoneR * zonePulse - 5);

  // Intruder drone — moving erratically
  const intruderAngle = t * 0.8;
  const intruderR = 60 + Math.sin(t * 0.5) * 20;
  const intruderX = zoneCX + Math.cos(intruderAngle) * intruderR;
  const intruderY = zoneCY + Math.sin(intruderAngle) * intruderR * 0.6;

  // RF signal visualization — concentric rings from intruder
  for (let ring = 0; ring < 3; ring++) {
    const ringR = 8 + ring * 12 + Math.sin(t * 4 + ring) * 3;
    ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 - ring * 0.1})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(intruderX, intruderY, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Intruder body
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(intruderX, intruderY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Tracking box
  const trkPulse = 1 + Math.sin(t * 5) * 0.08;
  const trkSize = 24 * trkPulse;
  ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(intruderX - trkSize / 2, intruderY - trkSize / 2, trkSize, trkSize);
  ctx.setLineDash([]);

  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ff4444";
  ctx.fillText("◆ INTRUZ — DJI P4", intruderX + trkSize / 2 + 4, intruderY - 4);
  ctx.font = "6px monospace";
  ctx.fillStyle = "#ff8844";
  ctx.fillText("RF: 2.4 GHz", intruderX + trkSize / 2 + 4, intruderY + 5);
  ctx.fillText(`ALT: ~85m`, intruderX + trkSize / 2 + 4, intruderY + 14);

  // RC operator location — SE from factory
  const opX = w * 0.82, opY = h * 0.78;
  ctx.fillStyle = "rgba(255, 180, 0, 0.7)";
  ctx.beginPath();
  ctx.arc(opX, opY, 5, 0, Math.PI * 2);
  ctx.fill();

  // RF triangulation lines
  ctx.strokeStyle = "rgba(255, 180, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(intruderX, intruderY);
  ctx.lineTo(opX, opY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Uncertainty circle around operator
  ctx.strokeStyle = "rgba(255, 180, 0, 0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(opX, opY, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "bold 7px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#ffaa00";
  ctx.fillText("◆ OPERATOR RC", opX + 8, opY - 2);
  ctx.font = "6px monospace";
  ctx.fillStyle = "#cc8800";
  ctx.fillText("CONF: 72%", opX + 8, opY + 8);
  ctx.fillText("~800m SE", opX + 8, opY + 17);

  // Police patrol approaching operator
  const patrolProgress = Math.min(1, (t * 0.06) % 1.2);
  const patrolX = w * 0.9 - patrolProgress * (w * 0.9 - opX);
  const patrolY = h * 0.95 - patrolProgress * (h * 0.95 - opY);
  
  const flash = Math.floor(t * 8) % 2;
  ctx.fillStyle = flash === 0 ? "rgba(50, 100, 255, 0.6)" : "rgba(255, 50, 50, 0.6)";
  ctx.beginPath();
  ctx.arc(patrolX, patrolY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "6px monospace";
  ctx.fillStyle = "#6688ff";
  ctx.fillText("PATROL", patrolX + 6, patrolY + 2);

  // Our drone — above factory
  ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
  ctx.beginPath();
  ctx.arc(zoneCX, zoneCY - 30, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "bold 6px monospace";
  ctx.fillStyle = "rgba(0, 255, 200, 0.7)";
  ctx.fillText("DRON POLICJI", zoneCX + 6, zoneCY - 32);

  // RF spectrum mini-display (bottom-right)
  const specX = w - 100, specY = h - 50, specW = 85, specH = 35;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(specX, specY, specW, specH);
  ctx.strokeStyle = "rgba(255,100,0,0.3)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(specX, specY, specW, specH);
  
  ctx.font = "5px monospace";
  ctx.fillStyle = "rgba(255,100,0,0.5)";
  ctx.fillText("RF SPECTRUM 2.4GHz", specX + 4, specY + 8);
  
  // Spectrum bars
  for (let i = 0; i < 20; i++) {
    const barH = (Math.sin(i * 2.3 + t * 5) * 0.5 + 0.5) * 18;
    const isSignal = i >= 8 && i <= 12;
    ctx.fillStyle = isSignal ? `rgba(255, 100, 0, ${0.5 + Math.sin(t * 8) * 0.3})` : "rgba(0, 200, 100, 0.2)";
    ctx.fillRect(specX + 4 + i * 4, specY + specH - 4 - barH, 3, barH);
  }
}
