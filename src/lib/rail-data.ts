import { useEffect, useState } from "react";

export type TrainStatus = "normal" | "warning" | "critical";

export interface Train {
  id: string;
  name: string;
  number: string;
  lat: number;
  lng: number;
  heading: number; // deg
  speedKmh: number;
  status: TrainStatus;
  route: string;
  nextStation: string;
  delayMin: number;
  passengers: number;
  // path waypoints to animate along
  path: [number, number][];
  pathIdx: number;
  progress: number; // 0..1 between pathIdx and pathIdx+1
}

export interface Incident {
  id: string;
  trainId?: string;
  title: string;
  severity: "info" | "warning" | "critical";
  location: string;
  ts: number;
  summary: string;
  agent: string;
  resolved?: boolean;
}

export interface AgentLog {
  id: string;
  agent: "SentinelWatch" | "CascadeRouter" | "CrowdGuard" | "EmergencyOrch";
  message: string;
  ts: number;
  level: "info" | "action" | "alert";
}

/* ---------- Seed network ---------- */

// Approximate Indian rail corridor waypoints (Mumbai → Pune, Delhi → Agra, Howrah → Asansol, Chennai → Bengaluru, etc.)
const corridors: { name: string; path: [number, number][] }[] = [
  {
    name: "Mumbai – Pune",
    path: [
      [19.076, 72.877], [19.02, 73.05], [18.95, 73.25], [18.85, 73.45], [18.75, 73.65], [18.52, 73.85],
    ],
  },
  {
    name: "Delhi – Agra",
    path: [[28.61, 77.21], [28.4, 77.3], [28.0, 77.5], [27.6, 77.7], [27.18, 78.01]],
  },
  {
    name: "Howrah – Asansol",
    path: [[22.58, 88.36], [22.8, 87.95], [23.1, 87.6], [23.5, 87.1], [23.68, 86.97]],
  },
  {
    name: "Chennai – Bengaluru",
    path: [[13.08, 80.27], [13.0, 79.7], [12.95, 79.0], [12.95, 78.2], [12.97, 77.59]],
  },
  {
    name: "Mumbai – Ahmedabad",
    path: [[19.076, 72.877], [19.6, 72.85], [20.4, 72.9], [21.2, 72.85], [22.3, 72.6], [23.03, 72.58]],
  },
  {
    name: "Delhi – Lucknow",
    path: [[28.61, 77.21], [28.5, 77.9], [28.2, 78.8], [27.8, 79.7], [27.2, 80.4], [26.85, 80.95]],
  },
  {
    name: "Hyderabad – Vijayawada",
    path: [[17.385, 78.486], [17.3, 79.1], [17.0, 79.7], [16.7, 80.3], [16.51, 80.65]],
  },
  {
    name: "Howrah – Bhubaneswar",
    path: [[22.58, 88.36], [22.2, 87.9], [21.7, 87.3], [21.0, 86.6], [20.27, 85.84]],
  },
  {
    name: "Jaipur – Delhi",
    path: [[26.92, 75.78], [27.2, 76.2], [27.5, 76.6], [27.9, 77.0], [28.61, 77.21]],
  },
  {
    name: "Pune – Hyderabad",
    path: [[18.52, 73.85], [18.0, 74.6], [17.7, 75.7], [17.5, 76.9], [17.385, 78.486]],
  },
];

const trainNames = [
  "Rajdhani Exp", "Shatabdi Exp", "Duronto Exp", "Vande Bharat", "Tejas Exp",
  "Garib Rath", "Jan Shatabdi", "Sampark Kranti", "Humsafar Exp", "Antyodaya Exp",
  "Mahanagari Exp", "Konkan Kanya", "Deccan Queen", "Coromandel Exp", "Howrah Mail",
  "Gitanjali Exp", "Punjab Mail", "Frontier Mail", "Karnataka Exp", "Tamil Nadu Exp",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateTrains(count = 160): Train[] {
  const trains: Train[] = [];
  for (let i = 0; i < count; i++) {
    const corridor = corridors[i % corridors.length];
    const reverse = Math.random() > 0.5;
    const path = reverse ? [...corridor.path].reverse() : corridor.path;
    const pathIdx = Math.floor(Math.random() * (path.length - 1));
    const progress = Math.random();
    const [lat1, lng1] = path[pathIdx];
    const [lat2, lng2] = path[pathIdx + 1];
    const lat = lat1 + (lat2 - lat1) * progress;
    const lng = lng1 + (lng2 - lng1) * progress;
    const heading = (Math.atan2(lng2 - lng1, lat2 - lat1) * 180) / Math.PI;
    const r = Math.random();
    const status: TrainStatus = r < 0.78 ? "normal" : r < 0.95 ? "warning" : "critical";
    trains.push({
      id: `T-${1000 + i}`,
      name: pick(trainNames),
      number: String(12000 + Math.floor(Math.random() * 8000)),
      lat, lng, heading,
      speedKmh: Math.round(rand(40, 130)),
      status,
      route: corridor.name,
      nextStation: corridor.name.split(" – ")[reverse ? 0 : 1],
      delayMin: status === "normal" ? 0 : Math.round(rand(2, 45)),
      passengers: Math.round(rand(400, 1800)),
      path, pathIdx, progress,
    });
  }
  return trains;
}

export function stepTrain(t: Train, dt: number): Train {
  const speedFactor = (t.speedKmh / 100) * dt * 0.0009; // tune
  let progress = t.progress + speedFactor;
  let pathIdx = t.pathIdx;
  if (progress >= 1) {
    progress = 0;
    pathIdx += 1;
    if (pathIdx >= t.path.length - 1) {
      // loop: reverse path
      t.path = [...t.path].reverse();
      pathIdx = 0;
    }
  }
  const [lat1, lng1] = t.path[pathIdx];
  const [lat2, lng2] = t.path[pathIdx + 1];
  const lat = lat1 + (lat2 - lat1) * progress;
  const lng = lng1 + (lng2 - lng1) * progress;
  const heading = (Math.atan2(lng2 - lng1, lat2 - lat1) * 180) / Math.PI;
  return { ...t, lat, lng, heading, progress, pathIdx };
}

/* ---------- Realtime simulation hook ---------- */

let _trains: Train[] | null = null;
let _incidents: Incident[] = [];
let _logs: AgentLog[] = [];
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

function seedIncidents() {
  _incidents = [
    {
      id: "INC-2041",
      trainId: "T-1003",
      title: "Track obstruction detected — KM 142",
      severity: "critical",
      location: "Mumbai – Pune corridor",
      ts: Date.now() - 1000 * 60 * 2,
      summary:
        "Computer vision flagged a stationary object on Down line near Lonavla. Train 12123 approaching at 96 km/h.",
      agent: "SentinelWatch",
    },
    {
      id: "INC-2040",
      title: "Crowd density critical — Platform 14, CSMT",
      severity: "warning",
      location: "CSMT Mumbai",
      ts: Date.now() - 1000 * 60 * 6,
      summary: "Density at 4.8 pax/m² on Platform 14. CrowdGuard recommending gate throttling.",
      agent: "CrowdGuard",
    },
    {
      id: "INC-2039",
      title: "Signal SPAD risk — Junction JX-22",
      severity: "warning",
      location: "Delhi – Agra corridor",
      ts: Date.now() - 1000 * 60 * 14,
      summary: "Predicted SPAD probability 0.34. CascadeRouter prepared automatic speed restriction.",
      agent: "CascadeRouter",
    },
  ];
  _logs = [
    { id: "L1", agent: "SentinelWatch", level: "alert", ts: Date.now() - 90_000, message: "Obstruction confirmed via 3 camera streams. Confidence 0.97." },
    { id: "L2", agent: "CascadeRouter", level: "action", ts: Date.now() - 80_000, message: "Computed 3 reroute options. Top option saves 14 min, risk score 0.08." },
    { id: "L3", agent: "CrowdGuard", level: "info", ts: Date.now() - 60_000, message: "Platform 14 throttle engaged. Density trending down (4.8 → 4.3)." },
    { id: "L4", agent: "EmergencyOrch", level: "action", ts: Date.now() - 30_000, message: "Notified Lonavla station master + RPF unit. ETA 7 min." },
  ];
}

function ensure() {
  if (_trains) return;
  _trains = generateTrains(170);
  seedIncidents();
  if (typeof window !== "undefined") {
    setInterval(() => {
      _trains = _trains!.map((t) => stepTrain(t, 16));
      emit();
    }, 100);
    setInterval(() => {
      // random new log entry
      const agents: AgentLog["agent"][] = ["SentinelWatch", "CascadeRouter", "CrowdGuard", "EmergencyOrch"];
      const messages: Record<AgentLog["agent"], string[]> = {
        SentinelWatch: ["Scanned 1,284 video frames in last cycle.", "No new anomalies on 47 active feeds.", "Camera CAM-2118 frame loss detected, switched to backup."],
        CascadeRouter: ["Recomputed network risk: 0.21.", "Reserved alternate path for T-1042.", "Speed advisory pushed to 6 trains in sector NW-4."],
        CrowdGuard: ["Howrah Platform 9 density nominal (2.1).", "New Delhi concourse density 3.2 — monitoring.", "Auto-throttle disengaged at CSMT P-14."],
        EmergencyOrch: ["Heartbeat OK with 14 agencies.", "Dispatched advisory SMS to 12 station masters.", "RPF unit acknowledged at Lonavla."],
      };
      const a = pick(agents);
      _logs = [
        { id: `L${Date.now()}`, agent: a, level: "info", ts: Date.now(), message: pick(messages[a]) },
        ..._logs,
      ].slice(0, 40);
      emit();
    }, 3500);
  }
}

export function useTrains() {
  ensure();
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => (n + 1) % 1000000);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return _trains!;
}

export function useIncidents() {
  ensure();
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => (n + 1) % 1000000);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return _incidents;
}

export function useAgentLogs() {
  ensure();
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => (n + 1) % 1000000);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return _logs;
}

export function getIncident(id: string) {
  ensure();
  return _incidents.find((i) => i.id === id);
}

export function formatRelative(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}