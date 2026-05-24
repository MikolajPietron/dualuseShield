import { CriticalNode } from "../types";

export const CENTER_LAT = 50.5630;
export const CENTER_LON = 22.0490;

// SkyMarshal POIs — 7 kluczowych obiektów Stalowej Woli, które są celem misji
// rozpoznawczych, monitoringu i koordynacji służb. Tym samym zbiorem są
// obiekty infrastruktury krytycznej, które mogą stać się epicentrum incydentu
// (pożar, podtopienie, wypadek) wymagającego reakcji floty dronów.
export const INITIAL_NODES: CriticalNode[] = [
  {
    id: "OBJ_01",
    name: "Huta Stalowa Wola S.A.",
    lat: 50.5482,
    lon: 22.0495,
    type: "industrial",
    description: "Strategiczny zakład przemysłu obronnego (Krab, Borsuk). Wysokie ryzyko pożaru technologicznego — priorytet dla dronów PSP z termowizją.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Misje: monitoring hal produkcyjnych, mapowanie pożarów wewnętrznych, dokumentacja powypadkowa."
  },
  {
    id: "OBJ_02",
    name: "Elektrownia Stalowa Wola",
    lat: 50.5574,
    lon: 22.0621,
    type: "power",
    description: "Blok gazowo-parowy, kluczowe źródło energii i ciepła dla miasta i przemysłu. Strefa ATEX — drony tylko do zwiadu z zewnątrz.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Misje: kontrola kominów, wykrywanie wycieków termalnych, koordynacja ewakuacji w razie awarii bloku."
  },
  {
    id: "OBJ_03",
    name: "Stacja Uzdatniania MZK",
    lat: 50.5841,
    lon: 22.0315,
    type: "water",
    description: "Ujęcie i stacja uzdatniania wody dla mieszkańców i przemysłu. Wysokie ryzyko przy powodzi na Sanie.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Misje: monitoring poziomów wody, wczesne wykrywanie powodzi, ocena uszkodzeń ujęcia."
  },
  {
    id: "OBJ_04",
    name: "GPZ 'Maziarnia'",
    lat: 50.5395,
    lon: 22.0682,
    type: "electrical",
    description: "Główny Punkt Zasilający — stacja transformatorowa wysokiego napięcia. Krytyczna dla łączności miejskiej.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Misje: inspekcja transformatorów, wykrywanie iskrzenia, dokumentacja zniszczeń burzowych."
  },
  {
    id: "OBJ_05",
    name: "Węzeł Kolejowy Rozwadów",
    lat: 50.5878,
    lon: 22.0465,
    type: "logistic",
    description: "Węzeł logistyki towarowej i wojskowej (NATO Hub). Kluczowy w scenariuszach dual-use.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Misje: monitoring rozjazdów, dokumentacja kolizji, koordynacja transportu kryzysowego."
  },
  {
    id: "OBJ_06",
    name: "Most gen. Bora-Komorowskiego",
    lat: 50.5744,
    lon: 22.0678,
    type: "transit",
    description: "Kluczowa przeprawa przez San. Pierwszy obiekt zagrożony przy wezbraniu rzeki.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Misje: monitoring poziomu Sanu, kontrola filarów, dokumentacja wypadków drogowych."
  },
  {
    id: "OBJ_07",
    name: "Centrum Zarządzania Kryzysowego",
    lat: 50.5701,
    lon: 22.0524,
    type: "hq",
    description: "Sztab dowodzenia kryzysowego, Urząd Miasta. Punkt dyspozytorski systemu SkyMarshal.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Baza dronów ZK — łączność, retransmisja, dyżur 24/7. Dual-use w sytuacjach hybrydowych."
  }
];

export const NODE_COLORS: Record<string, string> = {
  industrial: "#0e7490",
  power: "#c2410c",
  water: "#1d4ed8",
  electrical: "#a16207",
  logistic: "#475569",
  transit: "#7c3aed",
  hq: "#047857"
};
