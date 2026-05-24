# SKY MARSHAL — Full Project Context

> **For Claude Code / AI assistants.** This file contains everything you need to understand and modify this project.

## What is Sky Marshal

An **interactive 3D dashboard** for coordinating a dispersed fleet of drones across emergency services in **Stalowa Wola, Poland**. Built for a hackathon (dual-use civil/military drone coordination challenge).

The system takes individual drones scattered across Police, Fire Service (PSP), Volunteer Fire Service (OSP), and Crisis Management (ZK) — currently operating in silos — and unifies them into a single operational organism with shared situational awareness, mission planning, and multi-service coordination.

**Dual-use** = same drones, same system, two contexts:
- **Civil:** fires, floods, disasters, SAR, factory inspections
- **Military-crisis:** hostile drone detection, critical infrastructure protection, NATO logistics support

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 16.2.6** (App Router) | Single-page dashboard, `app/page.tsx` is the orchestrator |
| UI | **React 19** + **TypeScript 5** (strict) | All components are `"use client"` |
| Styling | **Tailwind CSS v4** | `@import "tailwindcss"` in globals.css, custom CSS vars for dark theme |
| 3D Map | **CesiumJS 1.118** (CDN) | CartoDB Voyager basemap, loaded via `<script>` in layout.tsx |
| 3D Drone | **Three.js 0.184** + R3F + drei | Used only for the fly-in intro animation (`fpv_drone.glb`) |
| Icons | **lucide-react 1.16.0** | |
| Fonts | **Rajdhani** (headings), **Share Tech Mono** + **JetBrains Mono** (data) | Google Fonts CDN |

## How to Run

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

No env vars needed. Cesium loads from CDN (no token required for CartoDB tiles).

## Project Structure

```
stalowa6767/
├── CLAUDE.md                    ← YOU ARE HERE
├── ZADANIE.md                   ← Original hackathon brief (Polish)
├── PROJEKT.md                   ← Technical spec with GPS data
├── DESIGN_PROMPT.md             ← UI moodboard (military dark)
└── frontend/
    ├── package.json
    ├── public/
    │   └── fpv_drone.glb        ← 3D drone model for fly-in animation
    └── app/
        ├── layout.tsx           ← HTML shell, Google Fonts, Cesium CDN
        ├── globals.css          ← Theme vars, clip-chamfer, animations
        ├── page.tsx             ← Root orchestrator (SkyMarshalDashboard)
        ├── types/index.ts       ← CriticalNode type
        ├── data/
        │   ├── nodes.ts         ← 7 critical infrastructure POIs (GPS coords)
        │   ├── river.ts         ← San River polyline coordinates
        │   ├── reconScenarios.ts← 6 scenarios with full data
        │   └── fleetData.ts     ← 9 drone assets + 14 data sources
        ├── hooks/
        │   └── useCesiumViewer.ts← Cesium init, POIs, river, airspace zones
        ├── lib/
        │   └── scenarioRenderer.ts← Cesium entity factory (vehicles, zones, drones)
        └── components/
            ├── Header.tsx       ← Top bar with FLOTA/ŹRÓDŁA buttons + clock
            ├── SystemStatusBar.tsx← Fleet/weather/comms/airspace ticker
            ├── CesiumViewport.tsx ← Cesium container wrapper
            ├── ReconLauncher.tsx  ← 6-card scenario selection grid
            ├── DroneReconView.tsx ← Full scenario view (fly-in + POV overlay)
            ├── LiveFeed.tsx       ← Canvas-based simulated drone camera feeds
            ├── FleetPanel.tsx     ← Drone inventory modal
            └── SourcesModal.tsx   ← Data sources modal (formal requirement)
```

## Application Flow

```
┌─────────────────────────────────────────────────┐
│  HEADER (SKY MARSHAL + FLOTA + ŹRÓDŁA + clock)  │
├─────────────────────────────────────────────────┤
│  SYSTEM STATUS BAR (fleet/weather/comms ticker)  │
├─────────────────────────────────────────────────┤
│                                                  │
│    ┌──────────────────────────────────────┐      │
│    │                                      │      │
│    │     CESIUM 3D MAP (background)       │      │
│    │     - 7 POIs (hex towers)            │      │
│    │     - River San                      │      │
│    │     - Operational zone               │      │
│    │     - NOTAM P-23 zone (HSW)          │      │
│    │     - U-Space corridor               │      │
│    │     - Drone base positions           │      │
│    │                                      │      │
│    │   ┌──────────────────────────────┐   │      │
│    │   │  6 SCENARIO CARDS (overlay)  │   │      │
│    │   │  3×2 grid (ReconLauncher)    │   │      │
│    │   └──────────────────────────────┘   │      │
│    └──────────────────────────────────────┘      │
│                                                  │
│  [Click card] → DroneReconView                   │
│    Phase 1: Three.js fly-in (3s)                 │
│    Phase 2: POV overlay                          │
│      ├── DataCard (left) — title, plan, detections│
│      ├── LiveFeed (right) — canvas simulation     │
│      ├── Crosshair + CV banner (center)          │
│      └── ZAKOŃCZ MISJĘ button (top center)       │
└─────────────────────────────────────────────────┘
```

## The 6 Scenarios

| # | ID | Title | What happens |
|---|-----|-------|-------------|
| 1 | `mapa` | MAPOWANIE HUTY STALOWA WOLA | LIDAR/RGB scan of HSW factory, boustrophedon pattern, 3D model generation |
| 2 | `mozliwosci` | PREWENCYJNA ANALIZA HUTY | Multi-sensor preventive check: fence integrity, thermal anomalies, leaks, fire systems, access gates |
| 3 | `procedury` | POŚCIG POLICYJNY — MOST | Night pursuit across bridge: fleeing vehicle with AI tracking, police patrols with FOV cones, blockade |
| 4 | `zagrozenia` | POŻAR HUTY STALOWA WOLA | Fire in Hall #7: CV detection, smoke zone, 3 fire trucks converging, evacuation route, temperature readings |
| 5 | `powodz` | POWÓDŹ — RZEKA SAN | San river flood: water level monitoring, bridge pillar erosion, LIDAR flood mapping, evacuation coordination |
| 6 | `dualuse` | SCENARIUSZ HYBRYDOWY | Hostile drone (DJI Phantom 4) detected over HSW: RF triangulation, operator tracking, Police + 3rd OT Brigade C-UAS response |

Each scenario has:
- **Data card** with: description, status, data points, plan (numbered steps with done/active/pending), CV detections with confidence bars
- **Live feed** (canvas animation): unique per scenario — night vision, thermal, chase cam, fire detection, flood monitoring, RF tracking
- **Map entities** (Cesium): animated vehicles, drone trackers, zones, FOV cones, routes

## Cesium Map Details

- **Basemap**: CartoDB Voyager (light) — `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png`
- **Center**: 50.5630°N, 22.0490°E (Stalowa Wola)
- **Camera**: heading 15°, pitch -38°, altitude 4500m
- **POIs**: 7 hex tower markers with colored beacons and coordinate labels
- **River San**: cyan polyline with glow material
- **Airspace**: NOTAM P-23 (red circle, 500m around HSW), U-Space corridor (purple rectangle), drone bases (green dots)
- **Scenario entities**: rendered by `scenarioRenderer.ts` — supports: `police-car`, `fire-truck`, `fleeing-vehicle`, `fire-zone`, `smoke-zone`, `blockade`, `evac-point`, `evac-route`, `thermal-hot`, `thermal-cool`, `drone-tracker`, `scan-path`, `waypoint`

## Design System

**Dark military theme** — red + black palette.

- Background: `#050505` (pure black)
- Panels: `rgba(15, 8, 8, 0.94)` (dark with red tint)
- Borders: `#3a1818` (dark red)
- Brand color: `#ef4444` (red — was cyan, variable is still called `--neon-cyan`)
- Status colors: emerald (OK), amber (warning), red (alert/active), cyan (info)
- Clip-chamfer: military corner-cut effect on cards (`.clip-chamfer` in CSS)
- Fonts: Rajdhani (bold headings/labels), JetBrains Mono (data), Share Tech Mono (coordinates)
- Thin scrollbar: `.terminal-scroll` class

## Key Data Types

### `ReconScenario` (reconScenarios.ts)
```typescript
{
  id: ScenarioId,           // "mapa" | "mozliwosci" | "procedury" | "zagrozenia" | "powodz" | "dualuse"
  title: string,            // Card title
  brief: string,            // Card description
  buttonCta: string,        // CTA button text
  icon: LucideIcon,         // Card icon
  targetNodeId: string,     // Which POI to fly to (OBJ_01..OBJ_07)
  scenarioTitle: string,    // Full title in POV overlay
  scenarioStatus: string,   // Status badge text
  description: string,      // Long description
  droneAgency: string,      // "DRON ZK • #STW-ZK-01"
  mode: string,             // "RGB-4K + LIDAR"
  mapHighlightColor: "red" | "amber" | "cyan",
  cameraAltM: number,       // Cesium camera altitude
  dataPoints: { label, value }[],
  detections: { label, confidence, color, meta }[],
  plan: { num, text, status: "done"|"active"|"pending" }[],
  mapUnits: MapUnit[],       // Cesium entities to render
}
```

### `DroneAsset` (fleetData.ts)
```typescript
{
  id, callsign, agency, agencyShort,
  model: string,                     // "DJI Matrice 300 RTK"
  sensors: string[],                 // ["RGB-4K", "IR 640×512", "LIDAR"]
  maxRange, maxFlight, maxWind, maxAlt,
  certBVLOS: boolean,
  status: "available" | "mission" | "charging" | "maintenance",
  baseLocation, baseLat, baseLon,
}
```

### `CriticalNode` (types/index.ts)
```typescript
{
  id: string, name: string,
  lat: number, lon: number,
  type: "industrial" | "power" | "water" | "electrical" | "logistic" | "transit" | "hq",
  description: string,
  health: number, status: "OPERATIONAL" | "DEGRADED" | "DESTROYED",
}
```

## Stalowa Wola — Geographic Data

Center: **50.5630°N, 22.0490°E**

| ID | Object | Coordinates | Type |
|----|--------|------------|------|
| OBJ_01 | Huta Stalowa Wola S.A. | 50.5482, 22.0495 | Defense industry (Krab, Borsuk) |
| OBJ_02 | Elektrownia Stalowa Wola | 50.5574, 22.0621 | Power plant |
| OBJ_03 | Stacja Uzdatniania MZK | 50.5841, 22.0315 | Water treatment |
| OBJ_04 | GPZ Maziarnia | 50.5395, 22.0682 | Power distribution |
| OBJ_05 | Węzeł Kolejowy Rozwadów | 50.5878, 22.0465 | Rail logistics / NATO hub |
| OBJ_06 | Most Bora-Komorowskiego | 50.5744, 22.0678 | Bridge over San |
| OBJ_07 | Centrum Zarządzania Kryzysowego | 50.5701, 22.0524 | HQ / command center |

River San — flows along eastern edge of city (flood risk for OBJ_03, OBJ_06).

## Drone Fleet (9 assets)

| Callsign | Agency | Model | Sensors | BVLOS | Status |
|----------|--------|-------|---------|-------|--------|
| STW-ZK-01 | ZK | DJI Matrice 300 RTK | RGB-4K, LIDAR, GPS RTK | ✓ | mission |
| STW-ZK-02 | ZK | DJI Mavic 3 Enterprise | RGB-4K, IR | ✗ | available |
| STW-ZK-03 | ZK | Autel EVO II Dual 640T | RGB-8K, IR, LIDAR | ✓ | charging |
| STW-POL-01 | Policja | DJI Matrice 30T | RGB-4K, IR, ZOOM 200× | ✓ | available |
| STW-POL-02 | Policja | DJI Mavic 3 Enterprise | RGB-4K, IR | ✗ | mission |
| STW-PSP-01 | PSP | DJI Matrice 300 RTK | RGB-4K, FLIR Boson 640, LIDAR | ✓ | mission |
| STW-PSP-04 | PSP | DJI Mavic 3T | RGB-4K, IR | ✗ | available |
| STW-OSP-P1 | OSP Pysznica | DJI Mini 3 Pro | RGB-4K | ✗ | available |
| STW-OSP-B1 | OSP Bojanów | Autel EVO Nano+ | RGB-4K, IR basic | ✗ | maintenance |

## LiveFeed Canvas Rendering

Each scenario has a unique canvas-based simulation in `LiveFeed.tsx`. The rendering uses `requestAnimationFrame` + a central `draw(ctx, w, h, t)` function that switches on `scenarioId`.

All feeds share a common overlay (`drawOverlay`): CRT scan lines, film grain, vignette, corner ticks, GPS coordinates, altitude.

| Scenario | Feed Function | Visual Style |
|----------|--------------|-------------|
| mapa | `drawAerialScan` | Green night-vision, building footprints, LIDAR grid, scan beam |
| mozliwosci | `drawThermalScan` | Blue IR palette, factory halls with ✓/⚠ status, fence perimeter, anomalies, leak detection, access gates, drone path, progress bar |
| procedury | `drawPoliceChase` | Night-vision aerial: roads, buildings, fleeing vehicle with AI tracking box, police cars with flashing lights, blockade |
| zagrozenia | `drawFireDetection` | Fire glow layers, flame particles, rising smoke, CV bounding boxes, fire trucks with flashing lights, evacuation route |
| powodz | `drawFloodMonitoring` | Dark blue terrain, flowing river with flood overflow, bridge with pillar monitoring, water level gauge with alarm, flooded buildings, evacuation route |
| dualuse | `drawDualUse` | Tactical green, HSW factory, NOTAM protection zone, orbiting intruder drone with RF rings, operator location with uncertainty circle, RF triangulation line, police patrol, RF spectrum analyzer |

## Hackathon Requirements Checklist

1. ✅ **Presentation / video** — interactive dashboard IS the deliverable
2. ✅ **Spatial visualization** — Cesium 3D map with POIs, zones, animated units, live feeds
3. ✅ **Data sources list** — SourcesModal with 14 sources + links (accessible via ŹRÓDŁA button)

Required coverage areas:
- ✅ Map of city and surroundings — Cesium 3D
- ✅ Drone technical capabilities — FleetPanel with 9 drones, sensors, specs
- ✅ Operational procedures — Step-by-step plans in each scenario
- ✅ Threat scenarios — Fire, flood, chase, hostile drone
- ✅ Transport/recon/comms — Drone cargo (scenario 5), retransmission (status bar)
- ✅ Regulatory constraints — NOTAM P-23, U-Space zone, max 120m AGL, BVLOS certs

## Common Patterns

- **All components are `"use client"`** — no server components
- **CSS classes**: Use `theme-*` classes from globals.css, `font-rajdhani` for labels, `font-mono` for data
- **Modals**: Fixed overlay with `z-[100]`, dark backdrop, border `border-[#3a1818]`
- **Text sizes**: `text-[8px]`–`text-[14px]` range, tracking-widest on labels
- **Icons**: lucide-react, typically `w-3 h-3` to `w-5 h-5`
- **Animations**: `animate-fadeIn`, `animate-pulse`, `animate-slideIn` (Tailwind)
- **Cesium**: accessed via `(window as any).Cesium` — loaded globally from CDN
- **No REST API** — all data is static in `data/` files

## Known Gotchas

1. **`--neon-cyan` is actually RED** (`#ef4444`) — legacy naming from when the theme was cyan. Don't rename it, just know that `theme-neon-text` = red.
2. **`clip-chamfer`** on `.clip-chamfer` elements uses `clip-path: polygon(...)` which **clips overflow/scrollbars**. Don't use it on scrollable containers.
3. **Cesium CDN** is loaded as a `<script>` tag in `layout.tsx`, not as an npm package. Access via `(window as any).Cesium`.
4. **Three.js** is only used for the 3-second fly-in animation. Don't use it for map rendering.
5. **ScenarioId type** must be updated in `reconScenarios.ts` if adding new scenarios.
6. **`scenarioRenderer.ts`** handles all Cesium entity kinds — add new `case` in the switch if you create new `MapUnit.kind` values.
7. **Language**: All UI text is in **Polish**. Keep it consistent.
