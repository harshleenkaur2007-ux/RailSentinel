import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { useTrains, useIncidents, type Train, type Incident } from "@/lib/rail-data";

function trainIcon(status: Train["status"], heading: number, dimmed: boolean, focused: boolean) {
  const color =
    status === "critical" ? "#D93636" : status === "warning" ? "#CA8A04" : "#16A34A";
  const pulse = focused || status === "critical" ? "pulse-alert" : "";
  const opacity = dimmed ? 0.3 : 1;
  const html = `
    <div class="relative" style="opacity:${opacity};transition:opacity .4s ease;">
      <div class="${pulse} grid h-4 w-4 place-items-center rounded-full" style="background:${color};box-shadow:0 0 10px ${color}aa,0 0 0 2px #0F2547;">
        <div style="transform:rotate(${heading}deg);font-size:9px;line-height:1;color:#0F2547;font-weight:900;">▲</div>
      </div>
    </div>`;
  return L.divIcon({ html, className: "rail-train-marker", iconSize: [16, 16], iconAnchor: [8, 8] });
}

// Main operational corridor: Mumbai (CSMT) → Pune
const mumbaiPuneCorridor: [number, number][] = [
  [19.076, 72.877], [19.02, 73.05], [18.95, 73.25],
  [18.85, 73.45], [18.75, 73.65], [18.52, 73.85],
];

// Dashed reroute branching via Khopoli detour to Pune
const rerouteAltPath: [number, number][] = [
  [18.95, 73.25], [18.82, 73.30], [18.70, 73.45],
  [18.60, 73.62], [18.52, 73.85],
];

// Approximate incident epicenters keyed by incident id
const incidentCoords: Record<string, [number, number]> = {
  "INC-2041": [18.7546, 73.4062], // KM 142, near Lonavla
  "INC-2040": [18.9402, 72.8356], // CSMT Mumbai
  "INC-2039": [27.85, 77.55],
};

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function FlyTo({ target, zoom = 11 }: { target: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, zoom, { duration: 2.2, easeLinearity: 0.25 });
  }, [target, zoom, map]);
  return null;
}

function CriticalAutoPan({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  const critical = incidents.find(
    (i) => i.severity === "critical" && !i.resolved && incidentCoords[i.id]
  );
  const id = critical?.id;
  useEffect(() => {
    if (!id) return;
    const coord = incidentCoords[id];
    const t = setTimeout(() => {
      map.flyTo(coord, 12, { duration: 3.0, easeLinearity: 0.2 });
    }, 1400);
    return () => clearTimeout(t);
  }, [id, map]);
  return null;
}

function IncidentHalo({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  useEffect(() => {
    const layers: L.Layer[] = [];
    incidents.forEach((i) => {
      const c = incidentCoords[i.id];
      if (!c) return;
      const color = i.severity === "critical" ? "#D93636" : "#CA8A04";
      const halo = L.circle(c, {
        radius: 50_000,
        color,
        weight: 1,
        opacity: 0.5,
        fillColor: color,
        fillOpacity: 0.06,
        dashArray: "4 6",
      }).addTo(map);
      layers.push(halo);
    });
    return () => { layers.forEach((l) => map.removeLayer(l)); };
  }, [incidents, map]);
  return null;
}

export function RailMap({
  onSelectTrain,
  focus,
  showReroute = true,
}: {
  onSelectTrain?: (t: Train) => void;
  focus?: [number, number] | null;
  showReroute?: boolean;
}) {
  const trains = useTrains();
  const incidents = useIncidents();

  const hotspots = useMemo(
    () =>
      incidents
        .filter((i) => !i.resolved && incidentCoords[i.id])
        .map((i) => incidentCoords[i.id]),
    [incidents]
  );

  const hasCritical = incidents.some(
    (i) => i.severity === "critical" && !i.resolved && incidentCoords[i.id]
  );

  return (
    <MapContainer
      center={[18.82, 73.35]}
      zoom={9}
      minZoom={5}
      maxZoom={13}
      className="h-full w-full"
      worldCopyJump={false}
      preferCanvas
      zoomControl
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Mumbai–Pune main corridor with neon glow */}
      <Polyline
        positions={mumbaiPuneCorridor}
        pathOptions={{ color: "#5BA8FF", weight: 10, opacity: 0.18 }}
      />
      <Polyline
        positions={mumbaiPuneCorridor}
        pathOptions={{ color: "#5BA8FF", weight: 5, opacity: 0.4 }}
      />
      <Polyline
        positions={mumbaiPuneCorridor}
        pathOptions={{ color: "#BFE0FF", weight: 2, opacity: 0.95 }}
      />

      {showReroute && hasCritical && (
        <>
          <Polyline
            positions={rerouteAltPath}
            pathOptions={{ color: "#22E7A1", weight: 7, opacity: 0.18 }}
          />
          <Polyline
            positions={rerouteAltPath}
            pathOptions={{
              color: "#22E7A1",
              weight: 2.5,
              opacity: 0.95,
              dashArray: "8 8",
            }}
          />
        </>
      )}

      <IncidentHalo incidents={incidents} />

      {trains.map((t) => {
        const pos: [number, number] = [t.lat, t.lng];
        const near = hotspots.some((h) => haversineKm(pos, h) <= 50);
        const dimmed = hotspots.length > 0 && !near;
        return (
          <Marker
            key={t.id}
            position={pos}
            icon={trainIcon(t.status, t.heading, dimmed, near)}
            eventHandlers={{ click: () => onSelectTrain?.(t) }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{t.number} · {t.name}</div>
                <div>{t.route}</div>
                <div>{t.speedKmh} km/h · {t.status.toUpperCase()}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <CriticalAutoPan incidents={incidents} />
      <FlyTo target={focus ?? null} zoom={11} />
    </MapContainer>
  );
}

export function TrainDrawer({ train, onClose }: { train: Train | null; onClose: () => void }) {
  if (!train) return null;
  const statusColor =
    train.status === "critical" ? "bg-status-red" : train.status === "warning" ? "bg-status-yellow" : "bg-status-green";
  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
      className="absolute right-4 top-4 z-[1000] w-80 rounded-lg border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Train #{train.number}</div>
          <div className="text-base font-semibold text-foreground">{train.name}</div>
          <div className="text-xs text-muted-foreground">{train.route}</div>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
        <span className="text-sm font-medium capitalize text-foreground">{train.status}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Field label="Speed" value={`${train.speedKmh} km/h`} />
        <Field label="Delay" value={`${train.delayMin} min`} />
        <Field label="Next Station" value={train.nextStation} />
        <Field label="Passengers" value={train.passengers.toLocaleString()} />
        <Field label="Latitude" value={train.lat.toFixed(3)} />
        <Field label="Longitude" value={train.lng.toFixed(3)} />
      </dl>
    </motion.div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}