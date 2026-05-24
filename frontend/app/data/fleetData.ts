// ============================================================================
// INWENTARYZACJA FLOTY DRONÓW — STALOWA WOLA
// ============================================================================

export interface DroneAsset {
  id: string;
  callsign: string;
  agency: string;
  agencyShort: string;
  model: string;
  sensors: string[];
  maxRange: string;
  maxFlight: string;
  maxWind: string;
  maxAlt: string;
  certBVLOS: boolean;
  status: "available" | "mission" | "charging" | "maintenance";
  baseLocation: string;
  baseLat: number;
  baseLon: number;
}

export const DRONE_FLEET: DroneAsset[] = [
  {
    id: "ZK-01",
    callsign: "STW-ZK-01",
    agency: "Zarządzanie Kryzysowe",
    agencyShort: "ZK",
    model: "DJI Matrice 300 RTK",
    sensors: ["RGB-4K", "LIDAR", "GPS RTK"],
    maxRange: "15 km",
    maxFlight: "55 min",
    maxWind: "15 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: true,
    status: "mission",
    baseLocation: "CZK Stalowa Wola",
    baseLat: 50.5701,
    baseLon: 22.0524
  },
  {
    id: "ZK-02",
    callsign: "STW-ZK-02",
    agency: "Zarządzanie Kryzysowe",
    agencyShort: "ZK",
    model: "DJI Mavic 3 Enterprise",
    sensors: ["RGB-4K", "IR 640×512"],
    maxRange: "10 km",
    maxFlight: "45 min",
    maxWind: "12 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: false,
    status: "available",
    baseLocation: "CZK Stalowa Wola",
    baseLat: 50.5701,
    baseLon: 22.0524
  },
  {
    id: "ZK-03",
    callsign: "STW-ZK-03",
    agency: "Zarządzanie Kryzysowe",
    agencyShort: "ZK",
    model: "Autel EVO II Dual 640T",
    sensors: ["RGB-8K", "IR 640×512", "LIDAR"],
    maxRange: "9 km",
    maxFlight: "42 min",
    maxWind: "13 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: true,
    status: "charging",
    baseLocation: "CZK Stalowa Wola",
    baseLat: 50.5701,
    baseLon: 22.0524
  },
  {
    id: "POL-01",
    callsign: "STW-POL-01",
    agency: "Policja — KPP Stalowa Wola",
    agencyShort: "POLICJA",
    model: "DJI Matrice 30T",
    sensors: ["RGB-4K", "IR 640×512", "ZOOM 200×"],
    maxRange: "15 km",
    maxFlight: "41 min",
    maxWind: "15 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: true,
    status: "available",
    baseLocation: "KPP Stalowa Wola",
    baseLat: 50.5710,
    baseLon: 22.0420
  },
  {
    id: "POL-02",
    callsign: "STW-POL-02",
    agency: "Policja — KPP Stalowa Wola",
    agencyShort: "POLICJA",
    model: "DJI Mavic 3 Enterprise",
    sensors: ["RGB-4K", "IR 640×512"],
    maxRange: "10 km",
    maxFlight: "45 min",
    maxWind: "12 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: false,
    status: "mission",
    baseLocation: "KPP Stalowa Wola",
    baseLat: 50.5710,
    baseLon: 22.0420
  },
  {
    id: "PSP-01",
    callsign: "STW-PSP-01",
    agency: "PSP — JRG Stalowa Wola",
    agencyShort: "PSP",
    model: "DJI Matrice 300 RTK",
    sensors: ["RGB-4K", "IR FLIR Boson 640", "LIDAR"],
    maxRange: "15 km",
    maxFlight: "55 min",
    maxWind: "15 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: true,
    status: "mission",
    baseLocation: "JRG PSP Stalowa Wola",
    baseLat: 50.5605,
    baseLon: 22.0555
  },
  {
    id: "PSP-04",
    callsign: "STW-PSP-04",
    agency: "PSP — JRG Stalowa Wola",
    agencyShort: "PSP",
    model: "DJI Mavic 3T",
    sensors: ["RGB-4K", "IR 640×512"],
    maxRange: "10 km",
    maxFlight: "45 min",
    maxWind: "12 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: false,
    status: "available",
    baseLocation: "JRG PSP Stalowa Wola",
    baseLat: 50.5605,
    baseLon: 22.0555
  },
  {
    id: "OSP-PYS",
    callsign: "STW-OSP-P1",
    agency: "OSP Pysznica",
    agencyShort: "OSP",
    model: "DJI Mini 3 Pro",
    sensors: ["RGB-4K"],
    maxRange: "6 km",
    maxFlight: "34 min",
    maxWind: "10 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: false,
    status: "available",
    baseLocation: "OSP Pysznica",
    baseLat: 50.5350,
    baseLon: 22.1200
  },
  {
    id: "OSP-BOJ",
    callsign: "STW-OSP-B1",
    agency: "OSP Bojanów",
    agencyShort: "OSP",
    model: "Autel EVO Nano+",
    sensors: ["RGB-4K", "IR basic"],
    maxRange: "5 km",
    maxFlight: "28 min",
    maxWind: "10 m/s",
    maxAlt: "120 m AGL",
    certBVLOS: false,
    status: "maintenance",
    baseLocation: "OSP Bojanów",
    baseLat: 50.4900,
    baseLon: 22.0700
  }
];

export const DATA_SOURCES = [
  { name: "OpenStreetMap", type: "Mapa bazowa", url: "https://openstreetmap.org" },
  { name: "CartoDB Basemaps", type: "Kafelki mapowe", url: "https://carto.com" },
  { name: "CesiumJS", type: "Silnik 3D globe", url: "https://cesium.com" },
  { name: "Geoportal.gov.pl", type: "Ortofotomapy, dane GIS", url: "https://geoportal.gov.pl" },
  { name: "ULC / PANSA", type: "Strefy lotnicze, NOTAM", url: "https://ulc.gov.pl" },
  { name: "Huta Stalowa Wola S.A.", type: "Informacje o obiekcie", url: "https://hsw.pl" },
  { name: "KG PSP", type: "Procedury ratownicze", url: "https://gov.pl/web/kgpsp" },
  { name: "IMGW-PIB", type: "Dane hydrologiczne (San)", url: "https://imgw.pl" },
  { name: "SESAR / U-Space", type: "Model zarządzania UTM", url: "https://sesarju.eu" },
  { name: "DJI Enterprise", type: "Specyfikacje dronów", url: "https://enterprise.dji.com" },
  { name: "Autel Robotics", type: "Specyfikacje dronów", url: "https://autelrobotics.com" },
  { name: "Dz.U. 2023 poz. 1364", type: "Rozp. ws. dronów UE", url: "https://isap.sejm.gov.pl" },
  { name: "3. Brygada OT", type: "Dane dual-use (C-UAS)", url: "https://3bot.wp.mil.pl" },
  { name: "GUS BDL", type: "Dane demograficzne miasta", url: "https://bdl.stat.gov.pl" },
];
