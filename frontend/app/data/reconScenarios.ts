import { Map as MapIcon, Cpu, Users, Flame, Waves, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ScenarioId = "mapa" | "mozliwosci" | "procedury" | "zagrozenia" | "powodz" | "dualuse";
export type HighlightColor = "red" | "amber" | "cyan";

export interface ReconDataPoint {
  label: string;
  value: string;
}

export interface ReconDetection {
  label: string;
  confidence: number;
  color: HighlightColor;
  meta?: string;
}

export interface ResolutionStep {
  num: number;
  text: string;
  status: "active" | "pending" | "done";
}

export type UnitKind =
  | "police-car"
  | "fire-truck"
  | "fleeing-vehicle"
  | "fire-zone"
  | "smoke-zone"
  | "blockade"
  | "evac-point"
  | "evac-route"
  | "thermal-hot"
  | "thermal-cool"
  | "drone-tracker"
  | "scan-path"
  | "waypoint";

export interface MapUnit {
  id: string;
  kind: UnitKind;
  label?: string;
  staticPos?: [number, number];      // [lon, lat]
  path?: [number, number][];           // path waypoints
  loopSeconds?: number;                // duration for full path traversal
  fov?: boolean;                       // attach FOV cone (vehicles)
  radiusM?: number;                    // for zones (fire, smoke)
}

export interface ReconScenario {
  id: ScenarioId;
  title: string;
  brief: string;
  buttonCta: string;
  icon: LucideIcon;

  targetNodeId: string;
  scenarioTitle: string;
  scenarioStatus: string;
  description: string;
  droneAgency: string;
  mode: string;
  mapHighlightColor: HighlightColor;

  cameraAltM?: number;
  dataPoints: ReconDataPoint[];
  detections: ReconDetection[];
  plan: ResolutionStep[];
  mapUnits: MapUnit[];
}

// ---------------------------------------------------------------------------
// SCENARIO 1 — MAPA MIASTA (aerofotogrametria HSW)
// HSW center: 22.0495 / 50.5482. Scan a ~600m x 250m rectangle around it.
// ---------------------------------------------------------------------------
const HSW_LON = 22.0495;
const HSW_LAT = 50.5482;

const SCAN_RECT: [number, number][] = [
  [HSW_LON - 0.004, HSW_LAT - 0.0012],
  [HSW_LON + 0.004, HSW_LAT - 0.0012],
  [HSW_LON + 0.004, HSW_LAT - 0.0004],
  [HSW_LON - 0.004, HSW_LAT - 0.0004],
  [HSW_LON - 0.004, HSW_LAT + 0.0004],
  [HSW_LON + 0.004, HSW_LAT + 0.0004],
  [HSW_LON + 0.004, HSW_LAT + 0.0012],
  [HSW_LON - 0.004, HSW_LAT + 0.0012]
];

// ---------------------------------------------------------------------------
// SCENARIO 3 — POŚCIG POLICYJNY (Most Bora-Komorowskiego)
// Bridge crosses the San north-south. Fleeing car comes from south (HSW area),
// crosses bridge, heads north toward Rozwadów. Police chase + intercept + blockade.
// ---------------------------------------------------------------------------
const FLEEING_PATH: [number, number][] = [
  [22.0670, 50.5710],   // south, west bank
  [22.0678, 50.5735],   // bridge approach
  [22.0680, 50.5750],   // mid bridge
  [22.0690, 50.5768],   // north exit
  [22.0710, 50.5785]    // approaching blockade
];

const POLICE1_PATH: [number, number][] = [
  [22.0655, 50.5708],   // tail behind from south
  [22.0673, 50.5733],
  [22.0678, 50.5750],
  [22.0688, 50.5767],
  [22.0708, 50.5783]
];

const POLICE2_PATH: [number, number][] = [
  [22.0760, 50.5760],   // from east — intercepting
  [22.0738, 50.5765],
  [22.0720, 50.5774],
  [22.0712, 50.5784]
];

// ---------------------------------------------------------------------------
// SCENARIO 4 — POŻAR HSW: fire trucks converging from PSP base, OSP, ZK
// ---------------------------------------------------------------------------
const FIRE_TRUCK_1: [number, number][] = [
  [22.0555, 50.5605],   // from north (PSP JRG mock loc)
  [22.0530, 50.5560],
  [22.0510, 50.5520],
  [HSW_LON, HSW_LAT + 0.0006]
];

const FIRE_TRUCK_2: [number, number][] = [
  [22.0600, 50.5482],   // from east
  [22.0560, 50.5482],
  [22.0525, 50.5482],
  [HSW_LON + 0.0005, HSW_LAT]
];

const FIRE_TRUCK_3: [number, number][] = [
  [22.0470, 50.5410],   // from south
  [22.0480, 50.5440],
  [22.0488, 50.5470],
  [HSW_LON, HSW_LAT - 0.0005]
];

const EVAC_ROUTE: [number, number][] = [
  [HSW_LON, HSW_LAT],            // building
  [HSW_LON - 0.0010, HSW_LAT + 0.0010],
  [HSW_LON - 0.0020, HSW_LAT + 0.0018]   // parking
];

export const RECON_SCENARIOS: ReconScenario[] = [
  // =========================================================================
  // 1. MAPA MIASTA I OTOCZENIA
  // =========================================================================
  {
    id: "mapa",
    title: "MAPA MIASTA I OTOCZENIA",
    brief: "Aerofotogrametria infrastruktury krytycznej Stalowej Woli — kluczowy obiekt obronny w jednym przelocie.",
    buttonCta: "ROZPOCZNIJ ZWIAD",
    icon: MapIcon,

    targetNodeId: "OBJ_01",
    scenarioTitle: "MAPOWANIE HUTY STALOWA WOLA",
    scenarioStatus: "ZWIAD POWIETRZNY • TRWA",
    description:
      "Dron ZK wykonuje aerofotogrametrię terenu Huty Stalowa Wola S.A. — kluczowego producenta armatohaubic Krab i BWP Borsuk. Wynik: aktualna mapa 3D obiektu strategicznego.",
    droneAgency: "DRON ZK • #STW-ZK-01",
    mode: "RGB-4K + LIDAR + GPS RTK",
    mapHighlightColor: "cyan",
    cameraAltM: 1200,
    dataPoints: [
      { label: "Powierzchnia obiektu", value: "≈ 220 ha" },
      { label: "Hale produkcyjne", value: "14 obiektów" },
      { label: "Klasa strategiczna", value: "OBRONNY • TIER 1" },
      { label: "Pułap drona", value: "120 m AGL" },
      { label: "Pokrycie LIDAR", value: "94%" }
    ],
    detections: [
      { label: "Hala produkcyjna #3", confidence: 96, color: "cyan", meta: "Krab linia montażowa" },
      { label: "Magazyn komponentów", confidence: 92, color: "cyan" },
      { label: "Strefa załadowcza", confidence: 89, color: "cyan", meta: "12 ciężarówek" }
    ],
    plan: [
      { num: 1, text: "Skan LIDAR 220 ha w siatce 8×3 (boustrophedon)", status: "active" },
      { num: 2, text: "Fotogrametria RGB-4K każdej hali produkcyjnej", status: "active" },
      { num: 3, text: "Generacja modelu 3D + warstwy GIS", status: "pending" },
      { num: 4, text: "Przekazanie do bazy CZK Stalowa Wola", status: "pending" }
    ],
    mapUnits: [
      // Drone flying scan pattern
      {
        id: "scan-drone",
        kind: "drone-tracker",
        label: "DRON ZK",
        path: SCAN_RECT,
        loopSeconds: 24
      },
      // Scan pattern trail
      {
        id: "scan-path",
        kind: "scan-path",
        path: SCAN_RECT
      },
      // Waypoints — corners of scan area
      { id: "wp-1", kind: "waypoint", label: "WP-01", staticPos: SCAN_RECT[0] },
      { id: "wp-2", kind: "waypoint", label: "WP-02", staticPos: SCAN_RECT[1] },
      { id: "wp-3", kind: "waypoint", label: "WP-03", staticPos: SCAN_RECT[6] },
      { id: "wp-4", kind: "waypoint", label: "WP-04", staticPos: SCAN_RECT[7] }
    ]
  },

  // =========================================================================
  // 2. PREWENCYJNA ANALIZA HUTY
  // =========================================================================
  {
    id: "mozliwosci",
    title: "PREWENCYJNA ANALIZA HUTY",
    brief: "Wielosensorowy skan prewencyjny HSW — wykrywanie zagrożeń zanim się pojawią. Termowizja, AI, LIDAR.",
    buttonCta: "ANALIZA PREWENCYJNA",
    icon: Cpu,

    targetNodeId: "OBJ_01",
    scenarioTitle: "PREWENCYJNA ANALIZA HUTY STALOWA WOLA",
    scenarioStatus: "SKAN PREWENCYJNY • W TOKU",
    description:
      "Dron ZK wykonuje rutynowy skan prewencyjny terenu Huty Stalowa Wola S.A. — identyfikacja potencjalnych zagrożeń zanim się zmaterializują. Kontrola: integralność budynków, ogrodzenie, wycieki substancji, anomalie termiczne, punkty dostępu, systemy p.poż.",
    droneAgency: "DRON ZK • #STW-ZK-02",
    mode: "MULTI-SENSOR • IR + RGB + LIDAR",
    mapHighlightColor: "amber",
    cameraAltM: 800,
    dataPoints: [
      { label: "Obszar skanu", value: "220 ha • HSW" },
      { label: "Czujniki aktywne", value: "IR + RGB-4K + LIDAR" },
      { label: "Punkty kontrolne", value: "38 / 38 zaplanowanych" },
      { label: "Anomalie wykryte", value: "3 (niski priorytet)" },
      { label: "Czas skanu", value: "≈ 45 min • 67% ukończono" }
    ],
    detections: [
      { label: "Ogrodzenie sektor N-7", confidence: 94, color: "amber", meta: "Uszkodzenie siatki — 2.4 m" },
      { label: "Anomalia termiczna hala #4", confidence: 89, color: "amber", meta: "+58°C — powyżej normy" },
      { label: "Wyciek cieczy — rampa załadunkowa", confidence: 82, color: "red", meta: "Substancja nieznana" },
      { label: "System p.poż. hala #11", confidence: 96, color: "cyan", meta: "Sprawny — OK" },
      { label: "Dostęp brama wschodnia", confidence: 100, color: "cyan", meta: "Zamknięta — OK" },
      { label: "Oświetlenie perymetryczne", confidence: 91, color: "cyan", meta: "38/40 lamp — 2 niesprawne" }
    ],
    plan: [
      { num: 1, text: "Termowizja hal produkcyjnych — wykrywanie przegrzań i anomalii", status: "done" },
      { num: 2, text: "Kontrola integralności ogrodzenia perymetrycznego (LIDAR)", status: "active" },
      { num: 3, text: "Skan wycieków substancji chemicznych i paliw (CV + IR)", status: "active" },
      { num: 4, text: "Weryfikacja systemów p.poż. i punktów ewakuacyjnych", status: "active" },
      { num: 5, text: "Kontrola zamknięcia bram i punktów dostępu", status: "pending" },
      { num: 6, text: "Raport prewencyjny → CZK Stalowa Wola", status: "pending" }
    ],
    mapUnits: [
      { id: "drone-thermal", kind: "drone-tracker", label: "DRON ZK", staticPos: [HSW_LON, HSW_LAT] },
      { id: "hot-anomaly", kind: "thermal-hot", label: "+58°C", staticPos: [HSW_LON - 0.001, HSW_LAT + 0.0005], radiusM: 45 },
      { id: "fence-breach", kind: "thermal-cool", label: "OGRODZENIE", staticPos: [HSW_LON + 0.003, HSW_LAT + 0.001], radiusM: 30 },
      { id: "leak-zone", kind: "thermal-hot", label: "WYCIEK", staticPos: [HSW_LON + 0.002, HSW_LAT - 0.0008], radiusM: 35 }
    ]
  },

  // =========================================================================
  // 3. PROCEDURY OPERACYJNE — POŚCIG POLICYJNY (GTA-style)
  // =========================================================================
  {
    id: "procedury",
    title: "PROCEDURY OPERACYJNE",
    brief: "Pościg policyjny w czasie rzeczywistym. Trzy służby koordynują akcję przez dyspozytornię SkyMarshal.",
    buttonCta: "PODGLĄD KOORDYNACJI",
    icon: Users,

    targetNodeId: "OBJ_06",
    scenarioTitle: "POŚCIG POLICYJNY • MOST BORA-KOMOROWSKIEGO",
    scenarioStatus: "AKTYWNY POŚCIG • CODE 3",
    description:
      "Pojazd uciekający z miejsca zdarzenia kieruje się na most im. Bora-Komorowskiego. Dron Policji prowadzi obserwację z powietrza, 3 patrole w pościgu, ZK koordynuje blokadę drogową na północnym brzegu.",
    droneAgency: "DRON POLICJI • #STW-POL-02",
    mode: "RGB-4K + AI TRACKING",
    mapHighlightColor: "red",
    cameraAltM: 1400,
    dataPoints: [
      { label: "Pojazd ścigany", value: "Renault Megane — czarny" },
      { label: "Jednostki Policji", value: "3 patrole" },
      { label: "Wsparcie PSP", value: "ETA 4 min • 1 zastęp" },
      { label: "Prędkość obiektu", value: "78 km/h" },
      { label: "Koordynacja", value: "ZK Centrum • LIVE" }
    ],
    detections: [
      { label: "Pojazd uciekający", confidence: 87, color: "red", meta: "Tablice nieczytelne" },
      { label: "Radiowóz #112", confidence: 96, color: "cyan" },
      { label: "Punkt blokady", confidence: 100, color: "amber", meta: "ul. Wałowa" }
    ],
    plan: [
      { num: 1, text: "Dron śledzi pojazd uciekający z powietrza (AI tracking)", status: "active" },
      { num: 2, text: "3 patrole Policji w pościgu — kanał R1", status: "active" },
      { num: 3, text: "Blokada drogowa na północnym brzegu (Wałowa)", status: "active" },
      { num: 4, text: "Zatrzymanie podejrzanego + przejęcie pojazdu", status: "pending" }
    ],
    mapUnits: [
      // The wanted vehicle being tracked
      {
        id: "suspect",
        kind: "fleeing-vehicle",
        label: "PODEJRZANY",
        path: FLEEING_PATH,
        loopSeconds: 18
      },
      // Drone always above suspect (vertical beacon)
      {
        id: "drone-tracker",
        kind: "drone-tracker",
        label: "DRON POLICJI",
        path: FLEEING_PATH,
        loopSeconds: 18
      },
      // Police patrol 112 — tail
      {
        id: "patrol-112",
        kind: "police-car",
        label: "PATROL 112",
        path: POLICE1_PATH,
        loopSeconds: 18,
        fov: true
      },
      // Police patrol 218 — intercept
      {
        id: "patrol-218",
        kind: "police-car",
        label: "PATROL 218",
        path: POLICE2_PATH,
        loopSeconds: 14,
        fov: true
      },
      // Police patrol 305 — blockade
      {
        id: "patrol-305",
        kind: "police-car",
        label: "PATROL 305",
        staticPos: [22.0712, 50.5798],
        fov: true
      },
      // Blockade marker
      {
        id: "blockade",
        kind: "blockade",
        label: "BLOKADA — Wałowa",
        staticPos: [22.0712, 50.5803]
      }
    ]
  },

  // =========================================================================
  // 4. SCENARIUSZE ZAGROŻEŃ — POŻAR HALI HSW
  // =========================================================================
  {
    id: "zagrozenia",
    title: "SCENARIUSZE ZAGROŻEŃ",
    brief: "Computer vision wykrył pożar w hali HSW. Trzy zastępy PSP w drodze, ewakuacja w toku.",
    buttonCta: "DETEKCJA CV",
    icon: Flame,

    targetNodeId: "OBJ_01",
    scenarioTitle: "POŻAR HALI PRODUKCYJNEJ HSW",
    scenarioStatus: "AKCJA RATOWNICZA • CODE RED",
    description:
      "Computer vision drona PSP wykryła ogień w hali produkcyjnej #7 Huty Stalowa Wola. Termowizja potwierdza źródło ciepła >700°C. Trzy zastępy PSP w drodze, dron koordynuje ewakuację i wskazuje punkt zborny.",
    droneAgency: "DRON PSP • #STW-PSP-01",
    mode: "COMPUTER VISION + TERMOWIZJA",
    mapHighlightColor: "red",
    cameraAltM: 1500,
    dataPoints: [
      { label: "Temperatura źródła", value: "≈ 720°C" },
      { label: "Powierzchnia pożaru", value: "≈ 180 m²" },
      { label: "Zastępy PSP", value: "3 • ETA 2 min" },
      { label: "Ewakuacja", value: "W TOKU • 47 osób" },
      { label: "Punkt zborny", value: "Parking północny" }
    ],
    detections: [
      { label: "OGIEŃ", confidence: 94, color: "red", meta: "Hala #7" },
      { label: "Strefa zadymienia", confidence: 87, color: "amber" },
      { label: "Punkt zborny ewakuacji", confidence: 100, color: "cyan" }
    ],
    plan: [
      { num: 1, text: "Dron PSP utrzymuje pozycję — termowizja na żywo", status: "active" },
      { num: 2, text: "3 zastępy PSP — ETA 2 min (PSP JRG / OSP Pysznica / OSP Bojanów)", status: "active" },
      { num: 3, text: "Ewakuacja 47 osób na parking północny (zielone strzałki)", status: "active" },
      { num: 4, text: "Akcja gaśnicza + zabezpieczenie terenu HSW", status: "pending" }
    ],
    mapUnits: [
      // Fire & smoke zone
      { id: "fire", kind: "fire-zone", label: "POŻAR • Hala #7", staticPos: [HSW_LON, HSW_LAT], radiusM: 90 },
      { id: "smoke", kind: "smoke-zone", staticPos: [HSW_LON, HSW_LAT], radiusM: 220 },
      // Drone overhead
      { id: "drone-fire", kind: "drone-tracker", label: "DRON PSP", staticPos: [HSW_LON, HSW_LAT] },
      // 3 fire trucks converging
      {
        id: "truck-1",
        kind: "fire-truck",
        label: "PSP JRG #1",
        path: FIRE_TRUCK_1,
        loopSeconds: 16
      },
      {
        id: "truck-2",
        kind: "fire-truck",
        label: "OSP PYSZNICA",
        path: FIRE_TRUCK_2,
        loopSeconds: 14
      },
      {
        id: "truck-3",
        kind: "fire-truck",
        label: "OSP BOJANÓW",
        path: FIRE_TRUCK_3,
        loopSeconds: 18
      },
      // Evacuation point
      {
        id: "evac-pt",
        kind: "evac-point",
        label: "PUNKT ZBORNY",
        staticPos: [HSW_LON - 0.0020, HSW_LAT + 0.0018]
      },
      // Evacuation route
      {
        id: "evac-route",
        kind: "evac-route",
        label: "EWAKUACJA",
        path: EVAC_ROUTE
      }
    ]
  },

  // =========================================================================
  // 5. POWÓDŹ NA SANIE
  // =========================================================================
  {
    id: "powodz",
    title: "POWÓDŹ — RZEKA SAN",
    brief: "Wezbranie Sanu zagraża mostowi i stacji uzdatniania. Drony monitorują poziom wody i koordynują ewakuację.",
    buttonCta: "MONITORING POWODZI",
    icon: Waves,

    targetNodeId: "OBJ_06",
    scenarioTitle: "WEZBRANIE SANU • ZAGROŻENIE POWODZIOWE",
    scenarioStatus: "ALARM POWODZIOWY • AKTYWNY",
    description:
      "Poziom rzeki San przekroczył stan alarmowy (620 cm). Zagrożony most gen. Bora-Komorowskiego i stacja uzdatniania MZK. Drony ZK i PSP dokumentują zasięg zalania, wskazują drogi ewakuacyjne i monitorują filary mostu.",
    droneAgency: "DRON ZK • #STW-ZK-03",
    mode: "RGB-4K + LIDAR BATYMETRYCZNY",
    mapHighlightColor: "cyan",
    cameraAltM: 1200,
    dataPoints: [
      { label: "Poziom Sanu", value: "620 cm (alarm: 580)" },
      { label: "Prognoza IMGW", value: "wezbranie +40 cm / 6h" },
      { label: "Zagrożone budynki", value: "≈ 120 w strefie" },
      { label: "Ewakuacja", value: "W TOKU • 340 osób" },
      { label: "Drony aktywne", value: "3 (ZK + 2×PSP)" }
    ],
    detections: [
      { label: "Strefa zalania — ul. Nadbrzeżna", confidence: 94, color: "cyan", meta: "≈ 0.8 m wody" },
      { label: "Filary mostu — erozja", confidence: 78, color: "amber", meta: "Filar #3 — monitorowany" },
      { label: "Stacja MZK — zagrożona", confidence: 88, color: "red", meta: "Woda 200m od ujęcia" },
      { label: "Droga ewakuacyjna DK77", confidence: 100, color: "cyan", meta: "Przejezdna" }
    ],
    plan: [
      { num: 1, text: "Ciągły pomiar poziomu Sanu + transmisja do IMGW", status: "active" },
      { num: 2, text: "LIDAR dokumentacja zasięgu zalania (ortomapa)", status: "active" },
      { num: 3, text: "Monitoring filarów mostu gen. Bora-Komorowskiego", status: "active" },
      { num: 4, text: "Koordynacja ewakuacji — wyznaczanie bezpiecznych dróg", status: "active" },
      { num: 5, text: "Dron cargo — transport worków z piaskiem na wał", status: "pending" },
      { num: 6, text: "Raport szkód → CZK + wojewoda podkarpacki", status: "pending" }
    ],
    mapUnits: [
      { id: "drone-flood-1", kind: "drone-tracker", label: "DRON ZK", staticPos: [22.0678, 50.5744] },
      { id: "drone-flood-2", kind: "drone-tracker", label: "DRON PSP", staticPos: [22.0315, 50.5841] },
      { id: "flood-zone-1", kind: "smoke-zone", staticPos: [22.0678, 50.5744], radiusM: 300 },
      { id: "flood-zone-2", kind: "smoke-zone", staticPos: [22.0315, 50.5841], radiusM: 200 }
    ]
  },

  // =========================================================================
  // 6. DUAL-USE — SCENARIUSZ HYBRYDOWY
  // =========================================================================
  {
    id: "dualuse",
    title: "SCENARIUSZ HYBRYDOWY",
    brief: "Wykryto nieautoryzowany dron w strefie HSW. Koordynacja Policji, ZK i wojska — procedura dual-use.",
    buttonCta: "REAKCJA HYBRYDOWA",
    icon: ShieldAlert,

    targetNodeId: "OBJ_01",
    scenarioTitle: "ZAGROŻENIE HYBRYDOWE • STREFA HSW",
    scenarioStatus: "ALERT DUAL-USE • CODE AMBER",
    description:
      "System detekcji RF wykrył nieautoryzowany dron (ELINT) w strefie ochronnej Huty Stalowa Wola — strategicznego zakładu obronnego (Krab, Borsuk). Uruchomiono procedurę dual-use: Policja, ZK i 3. Brygada OT koordynują rozpoznanie i neutralizację.",
    droneAgency: "DRON POLICJI • #STW-POL-01",
    mode: "RGB-4K + RF DETECTION + EO/IR",
    mapHighlightColor: "red",
    cameraAltM: 1000,
    dataPoints: [
      { label: "Obiekt chroniony", value: "HSW S.A. • TIER 1" },
      { label: "Detekcja RF", value: "DJI Phantom 4 (cywilny)" },
      { label: "Pułap intruza", value: "≈ 85 m AGL" },
      { label: "Czas w strefie", value: "4 min 22 s" },
      { label: "Jednostki zaangażowane", value: "Policja + ZK + 3.BOT" }
    ],
    detections: [
      { label: "Dron nieautoryzowany", confidence: 97, color: "red", meta: "DJI Phantom 4 — sygnał RC 2.4 GHz" },
      { label: "Operator — lokalizacja RC", confidence: 72, color: "amber", meta: "≈ 800m SE od HSW" },
      { label: "Strefa naruszenia", confidence: 100, color: "red", meta: "NOTAM P-23 (HSW)" },
      { label: "Jednostka C-UAS", confidence: 100, color: "cyan", meta: "3.BOT — ETA 8 min" }
    ],
    plan: [
      { num: 1, text: "Dron Policji — śledzenie i identyfikacja intruza (EO/IR)", status: "active" },
      { num: 2, text: "Detekcja RF — triangulacja pozycji operatora RC", status: "active" },
      { num: 3, text: "Patrol Policji — przechwycenie operatora (kierunek SE)", status: "active" },
      { num: 4, text: "3.BOT C-UAS — standby do neutralizacji (jammer)", status: "pending" },
      { num: 5, text: "Zabezpieczenie dowodów + raport do ABW", status: "pending" }
    ],
    mapUnits: [
      { id: "drone-police-dual", kind: "drone-tracker", label: "DRON POLICJI", staticPos: [HSW_LON, HSW_LAT] },
      { id: "intruder-drone", kind: "fleeing-vehicle", label: "INTRUZ", path: [
        [HSW_LON + 0.001, HSW_LAT + 0.001],
        [HSW_LON - 0.001, HSW_LAT + 0.002],
        [HSW_LON + 0.002, HSW_LAT - 0.001],
        [HSW_LON, HSW_LAT + 0.001]
      ], loopSeconds: 12 },
      { id: "rc-operator", kind: "blockade", label: "OPERATOR RC", staticPos: [HSW_LON + 0.008, HSW_LAT - 0.006] },
      { id: "hsw-zone", kind: "fire-zone", label: "STREFA OCHRONNA HSW", staticPos: [HSW_LON, HSW_LAT], radiusM: 400 }
    ]
  }
];
