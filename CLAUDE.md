# Sky Marshal — kontekst projektu

## Czym jest Sky Marshal

System koordynacji rozproszonych zasobów dronowych w Stalowej Woli. Łączy pojedyncze drony należące do różnych jednostek (Policja, PSP, OSP, Zarządzanie Kryzysowe) w jeden organizm operacyjny — wspólne centrum dowodzenia, planowanie misji, koordynacja zadań.

**Dual-use** — system działa w dwóch trybach:
- **Cywilny:** pożary, powodzie, katastrofy naturalne, zaginięcia, akcje SAR.
- **Militarno-kryzysowy:** zwiad, rozpoznanie zagrożeń, wsparcie obrony cywilnej, transport krytyczny.

## Problem do rozwiązania

Obecnie drony służb działają **w silosach** — brak wspólnego centrum, brak planowania międzyresortowego, brak współdzielenia danych w czasie rzeczywistym. Sky Marshal ma zlikwidować tę fragmentaryzację.

## Co obejmuje model (4 obszary z briefu)

1. **Mapa miasta i otoczenia** — Stalowa Wola, infrastruktura krytyczna, dolina Sanu.
2. **Możliwości techniczne dronów** — zasięg, czas lotu, sensory (termowizja, kamery RGB, LIDAR, retransmitor radiowy).
3. **Procedury operacyjne służb** — kto, co, kiedy — łańcuch dowodzenia + koordynacja wielosłużbowa.
4. **Scenariusze zagrożeń** — pożar HSW, powódź Sanu, zaginięcie, dual-use kryzys hybrydowy.

Plus: PAŻP / strefy DRA-R/DRA-P / U-Space / BVLOS / EASA dla operacji służb publicznych.

## Wymagania formalne dostarczenia

1. **Opis rozwiązania** — prezentacja max 10 slajdów LUB film max 3 minuty.
2. **Wizualizacja przestrzenna** — mapa / dashboard / link do interaktywnej aplikacji.
3. **Lista źródeł danych** — nazwy + linki dla danych publicznych.

## Stan kodu

W [frontend/](frontend/) działa aplikacja **Next.js 16 + Cesium 3D + Three.js (R3F)**. Frontend powstał jako Steel Sentinel (system obrony przed dronami), a następnie został zrefaktoryzowany do Sky Marshal — dyspozytorni floty dronów służb.

### Aktualna architektura aplikacji (jeden widok)

- **Cesium 3D mapa** Stalowej Woli jako tło (7 obiektów infrastruktury krytycznej + rzeka San + strefa operacyjna)
- **4 przyciski overlay** w siatce 2x2 ([ReconLauncher.tsx](frontend/app/components/ReconLauncher.tsx)) — po jednym na każdy obszar z briefu
- **Demo "drone reconnaissance"** ([DroneReconView.tsx](frontend/app/components/DroneReconView.tsx)):
  - Faza 1: Three.js `fpv_drone.glb` na jasnym pochmurnym niebie ze słońcem (drei `<Sky>` + `<Clouds>`), kamera płynnie zbliża się przez ~3s
  - Faza 2: transparent overlay nad mapą — kamera Cesium zoomuje do celu, animowane jednostki na mapie (GTA-style)
- **Animowane sceny per scenariusz** ([lib/scenarioRenderer.ts](frontend/app/lib/scenarioRenderer.ts)):
  - **Mapa** → dron leci po prostokątnej ścieżce skanowania nad HSW, 4 waypoints w rogach
  - **Możliwości** → 2 termalne hot-spoty (+280°C, +65°C) + 1 cool-spot (+42°C) nad Elektrownią
  - **Procedury** → animowany pościg: PODEJRZANY z pulsującym reticle ringiem + 3 patrole z FOV cones + blokada Wałowa + dron-tracker beacon nad uciekającym
  - **Zagrożenia** → pulsujący pożar HSW + strefa zadymienia + 3 wozy strażackie zbiegające się + punkt zborny + dashed evac route
- **Data card** po lewej (~360px): scenario title + status badge + opis + **PLAN DZIAŁANIA** (4 kroki z statusami AKTYWNY/WYKONANE/OCZEKUJE) + dane operacyjne + detekcje CV

Stack:
- Next.js 16.2.6 (App Router) + React 19 + TypeScript 5 (strict)
- Tailwind v4 (`@import "tailwindcss"`)
- Cesium 1.118 (CDN w `frontend/app/layout.tsx`, używamy CartoDB Voyager basemap)
- Three.js 0.184 + `@react-three/fiber@9.6.1` + `@react-three/drei@10.7.7` (Sky, Clouds, useGLTF)
- lucide-react@1.16.0

### Wewnętrzna konwencja nazw (historyczna)

Po refaktorze do Sky Marshal część kluczy TypeScript została czystych. Co warto wiedzieć:
- `CriticalNode` w [frontend/app/types/index.ts](frontend/app/types/index.ts) — typ POI na mapie (7 obiektów z [data/nodes.ts](frontend/app/data/nodes.ts))
- Wszystkie scenariusze i UI są już 100% Sky Marshal (brak relikt Steel Sentinel w stringach)
- Jedyne legacy w nazewnictwie folderowym — sam projekt sieci nazywa się `stalowa6767`

## Krytyczne pliki referencyjne

- [frontend/](frontend/) — działająca aplikacja Sky Marshal (Next.js 16)
- [frontend/README.md](frontend/README.md) — instrukcja uruchomienia + struktura katalogów
- [frontend/app/page.tsx](frontend/app/page.tsx) — orchestrator stanu (~55 linii, SkyMarshalDashboard)
- [frontend/app/data/reconScenarios.ts](frontend/app/data/reconScenarios.ts) — 4 scenariusze z planami + animowanymi jednostkami
- [frontend/app/lib/scenarioRenderer.ts](frontend/app/lib/scenarioRenderer.ts) — fabryka Cesium entity dla wszystkich jednostek (pojazdy, FOV, strefy)
- [frontend/app/hooks/useCesiumViewer.ts](frontend/app/hooks/useCesiumViewer.ts) — init mapy Cesium + `focusOnScenario` / `clearFocus`
- [frontend/CLAUDE.md](frontend/CLAUDE.md) — wcześniejsza dokumentacja per-plik (uwaga: pisana dla starej wersji Steel Sentinel, część kontekstu już nieaktualna)
- [ZADANIE.md](ZADANIE.md) — pierwotne zadanie hackathonowe (Steel Sentinel / Defence) — referencja historyczna
- [PROJEKT.md](PROJEKT.md) — specyfikacja techniczna z danymi GPS węzłów (nadal aktualna geografia)
- [DESIGN_PROMPT.md](DESIGN_PROMPT.md) — moodboard UI (military dark dashboard)

## Stalowa Wola — dane operacyjne

Środek miasta: **50.5630, 22.0490**.

Kluczowe obiekty (cele misji dronowych — patrole, monitorowanie, transport):

| ID | Obiekt | Lat/Lon | Typ |
|---|---|---|---|
| OBJ_01 | Huta Stalowa Wola | 50.5482, 22.0495 | przemysł obronny |
| OBJ_02 | Elektrownia Stalowa Wola | 50.5574, 22.0621 | energetyka |
| OBJ_03 | Ujęcie Wody MZK | 50.5841, 22.0315 | wodociągi |
| OBJ_04 | GPZ Maziarnia | 50.5395, 22.0682 | dystrybucja prądu |
| OBJ_05 | Węzeł Kolejowy Rozwadów | 50.5878, 22.0465 | logistyka |
| OBJ_06 | Most Bora-Komorowskiego | 50.5744, 22.0678 | przeprawa |
| OBJ_07 | Centrum Zarządzania Kryzysowego | 50.5701, 22.0524 | dowodzenie |

Rzeka San — po wschodniej stronie miasta — istotna dla scenariuszy powodziowych i jako korytarz nawigacyjny.

## Stan obecny i co dalej

- ✅ **Aplikacja działa w jednym widoku** — mapa Cesium + 4 przyciski + demo z GTA-style animowanymi jednostkami
- ✅ **Każdy scenariusz ma plan działania** (4 kroki z aktualnym statusem)
- ✅ **Demo pościgu policyjnego** — pojazd ucieka po moście, 3 patrole gonią z FOV cones, blokada na końcu, dron śledzi z góry
- ⏳ **Brakuje:** prezentacji 10-slajdowej / filmu 3 min, listy źródeł danych (PAŻP/RCB/EASA/OSM/dane KW Policji)
