# SKY MARSHAL

Dyspozytornia floty dronów służb dla Stalowej Woli. Łączy zasoby Policji, PSP, OSP i Zarządzania Kryzysowego w jeden organizm operacyjny — dual-use cywilno-militarny. Next.js 16 + CesiumJS (mapa 3D).

## Stack

| Co | Wersja |
|---|---|
| Next.js | 16.2.6 (App Router) |
| React | 19 |
| TypeScript | 5 (strict) |
| Tailwind CSS | 4 |
| CesiumJS | 1.118 (CDN, nie npm) |
| Three.js + R3F | 0.184 (biblioteka modeli 3D) |

CesiumJS jest ładowany z CDN w `layout.tsx` — nie przez npm.

## Struktura

```
frontend/app/
├── types/index.ts          — interfejsy TS (CriticalNode, drone unit, incident, log)
├── data/
│   ├── nodes.ts            — 7 obiektów krytycznych Stalowej Woli + stałe GPS
│   ├── weapons.ts          — flota dronów (Policja / PSP / OSP / ZK)
│   ├── threats.ts          — typy incydentów (pożar / powódź / zaginięcie)
│   └── river.ts            — współrzędne rzeki San (trasa incydentów powodziowych)
├── hooks/
│   ├── useAudio.ts         — Web Audio API (sygnały dźwiękowe)
│   ├── useCascadingEngine.ts — kaskady zależności między obiektami
│   ├── useDefcon.ts        — poziom alarmu (1-5: spokój → dual-use)
│   └── useCesiumViewer.ts  — inicjalizacja Cesium, dyspozytura, pętla symulacji
├── components/
│   ├── Header.tsx           — górny pasek: ALERT, zegar, schemat, biblioteka 3D
│   ├── AlertTicker.tsx      — pasek z aktualnym statusem dyspozytorni
│   ├── CesiumViewport.tsx   — kontener na canvas Cesium (mapa 3D)
│   ├── LeftSidebar.tsx      — panel dyspozytora z 3 zakładkami
│   │   ├── NodeList.tsx     — lista monitorowanych obiektów
│   │   ├── CascadeGraph.tsx — graf zależności i timery kaskadowe
│   │   └── PlaybookControls.tsx — procedury kryzysowe (syreny, RCB, mobilizacja)
│   ├── ArsenalPanel.tsx     — flota dronów + scenariusze incydentów
│   ├── ThreatMonitor.tsx    — monitor aktywnych incydentów (lewy dół)
│   ├── CommandLogger.tsx    — dziennik operacyjny (prawy dół)
│   ├── TelemetryHUD.tsx     — GPS / wysokość / warstwy mapy (dolny środek)
│   ├── ObjectDetailCard.tsx — szczegóły obiektu / drona
│   └── ThreatModelViewer.tsx — biblioteka modeli 3D (drony, platformy dual-use)
└── page.tsx                 — orchestrator stanu (~250 linii)
```

## Wewnętrzna konwencja nazw (historyczna)

Aplikacja powstała jako Steel Sentinel (system obrony przed dronami) i została przemieniona w Sky Marshal (dyspozytornię dronów służb). Aby zachować stabilność silnika symulacji, wewnętrzne klucze TypeScript zachowano:

| Klucz wewnętrzny | Znaczenie w Sky Marshal |
|---|---|
| `WeaponSystem` / `WEAPONS` | Drone unit (typ jednostki dronowej) |
| `DeployedSystem` | Drone w akcji (rozmieszczony) |
| `Threat` / `THREAT_TYPES` | Incydent (zdarzenie kryzysowe) |
| `PILICA` | Dron Policji |
| `WRE` | Dron PSP (Państwowa Straż Pożarna) |
| `RADAR` | Dron OSP (Ochotnicza Straż Pożarna) |
| `PATRIOT` | Dron ZK (Zarządzanie Kryzysowe) |
| `DRONE` | Pożar |
| `SHAHED` | Powódź (płynie korytem Sanu) |
| `MISSILE` | Zaginięcie / wypadek krytyczny |
| `DEFCON` (1-5) | Poziom alarmu (1=DUAL-USE, 5=SPOKÓJ) |

Semantyczne aliasy (`DroneUnit`, `DeployedDrone`, `Incident`) są wyeksportowane z `types/index.ts` do nowego kodu.

## Uruchomienie

```bash
cd frontend
npm install
npm run dev
```

## Uwagi

- `backend/` jest pusty — Laravel zaplanowany, nie zaimplementowany.
- CesiumJS używa CartoDB Voyager jako basemap (light, bez Bing token).
- Modele 3D w `public/3d_models/` (FPV drone, Shahed, Patriot) dostarczone jako referencje dual-use.
