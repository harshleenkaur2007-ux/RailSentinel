import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { useTrains, type Train } from "@/lib/rail-data";

function trainIcon(status: Train["status"], heading: number) {
  const color =
    status === "critical" ? "#D93636" : status === "warning" ? "#CA8A04" : "#16A34A";
  const pulse = status === "critical" ? "pulse-alert" : "";
  const html = `
    <div class="relative">
      <div class="${pulse} grid h-4 w-4 place-items-center rounded-full" style="background:${color};box-shadow:0 0 10px ${color}aa,0 0 0 2px #0F2547;">
        <div style="transform:rotate(${heading}deg);font-size:9px;line-height:1;color:#0F2547;font-weight:900;">▲</div>
      </div>
    </div>`;
  return L.divIcon({ html, className: "rail-train-marker", iconSize: [16, 16], iconAnchor: [8, 8] });
}

const corridorPaths: [number, number][][] = [
  [[19.076, 72.877],[19.02, 73.05],[18.95, 73.25],[18.85, 73.45],[18.75, 73.65],[18.52, 73.85]],
  [[28.61, 77.21],[28.4, 77.3],[28.0, 77.5],[27.6, 77.7],[27.18, 78.01]],
  [[22.58, 88.36],[22.8, 87.95],[23.1, 87.6],[23.5, 87.1],[23.68, 86.97]],
  [[13.08, 80.27],[13.0, 79.7],[12.95, 79.0],[12.95, 78.2],[12.97, 77.59]],
  [[19.076, 72.877],[19.6, 72.85],[20.4, 72.9],[21.2, 72.85],[22.3, 72.6],[23.03, 72.58]],
  [[28.61, 77.21],[28.5, 77.9],[28.2, 78.8],[27.8, 79.7],[27.2, 80.4],[26.85, 80.95]],
  [[17.385, 78.486],[17.3, 79.1],[17.0, 79.7],[16.7, 80.3],[16.51, 80.65]],
  [[22.58, 88.36],[22.2, 87.9],[21.7, 87.3],[21.0, 86.6],[20.27, 85.84]],
  [[26.92, 75.78],[27.2, 76.2],[27.5, 76.6],[27.9, 77.0],[28.61, 77.21]],
  [[18.52, 73.85],[18.0, 74.6],[17.7, 75.7],[17.5, 76.9],[17.385, 78.486]],
];

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 7, { duration: 1.2 });
  }, [target, map]);
  return null;
}

export function RailMap({ onSelectTrain, focus }: { onSelectTrain?: (t: Train) => void; focus?: [number, number] | null }) {
  const trains = useTrains();
  // Limit visible markers slightly for perf if needed; keeping all is fine here.
  const items = useMemo(() => trains, [trains]);
  return (
    <MapContainer
      center={[22.5, 80]}
      zoom={5}
      minZoom={4}
      maxZoom={11}
      className="h-full w-full"
      worldCopyJump={false}
      preferCanvas
      zoomControl
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {corridorPaths.map((p, i) => (
        <Polyline key={i} positions={p} pathOptions={{ color: "#2E6DB4", weight: 2.5, opacity: 0.55 }} />
      ))}
      {items.map((t) => (
        <Marker
          key={t.id}
          position={[t.lat, t.lng]}
          icon={trainIcon(t.status, t.heading)}
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
      ))}
      <FlyTo target={focus ?? null} />
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