export interface CriticalNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: "industrial" | "power" | "water" | "electrical" | "logistic" | "transit" | "hq";
  description: string;
  health: number;
  status: "OPERATIONAL" | "DEGRADED" | "DESTROYED";
  backupPower: boolean;
  notes: string;
}

export type NodeStatus = "OPERATIONAL" | "DEGRADED" | "DESTROYED";
