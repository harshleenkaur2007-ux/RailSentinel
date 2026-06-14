import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/rail/TopBar";
import { Sidebar } from "@/components/rail/Sidebar";
import type { Train, Incident } from "@/lib/rail-data";

const RailMap = lazy(() => import("@/components/rail/RailMap").then((m) => ({ default: m.RailMap })));
const TrainDrawer = lazy(() => import("@/components/rail/RailMap").then((m) => ({ default: m.TrainDrawer })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RailSentinel — Autonomous Rail Command Center" },
      { name: "description", content: "Real-time national rail network monitoring with autonomous AI agents for safety, rerouting, crowd control, and emergency coordination." },
      { property: "og:title", content: "RailSentinel — Autonomous Rail Command Center" },
      { property: "og:description", content: "Live mission-critical dashboard for national rail operations." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [selected, setSelected] = useState<Train | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);

  function focusIncident(i: Incident) {
    // Approximate focus location by corridor
    const map: Record<string, [number, number]> = {
      "Mumbai – Pune corridor": [18.75, 73.5],
      "CSMT Mumbai": [18.94, 72.835],
      "Delhi – Agra corridor": [27.8, 77.6],
    };
    setFocus(map[i.location] ?? null);
  }

  return (
    <div className="flex h-screen flex-col bg-navy-deep text-foreground">
      <TopBar />
      <div className="relative flex flex-1 overflow-hidden">
        <main className="relative flex-1">
          <Suspense fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading map…</div>}>
            <RailMap onSelectTrain={setSelected} focus={focus} />
          </Suspense>
          <AnimatePresence>
            {selected && (
              <Suspense fallback={null}>
                <TrainDrawer train={selected} onClose={() => setSelected(null)} />
              </Suspense>
            )}
          </AnimatePresence>
          {/* Legend */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-md border border-border bg-card/85 px-3 py-2 text-[11px] backdrop-blur-md">
            <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="flex items-center gap-3">
              <Legend color="bg-status-green" label="Normal" />
              <Legend color="bg-status-yellow" label="Warning" />
              <Legend color="bg-status-red" label="Critical" />
            </div>
          </div>
        </main>
        <Sidebar onFocusIncident={focusIncident} />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
    </span>
  );
}
