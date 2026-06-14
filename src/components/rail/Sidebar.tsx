import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { AlertOctagon, Brain, Eye, GitBranch, Megaphone, Users } from "lucide-react";
import { formatRelative, useAgentLogs, useIncidents, useTrains, type Incident } from "@/lib/rail-data";

export function Sidebar({ onFocusIncident }: { onFocusIncident?: (i: Incident) => void }) {
  const incidents = useIncidents();
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-navy-deep/70 p-3">
      <NetworkHealth />
      <AgentGrid />
      <IncidentFeed incidents={incidents} onFocus={onFocusIncident} />
      <AgentLogStream />
    </aside>
  );
}

function NetworkHealth() {
  const trains = useTrains();
  const c = { normal: 0, warning: 0, critical: 0 };
  trains.forEach((t) => c[t.status]++);
  const total = trains.length;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <section className="rounded-lg border border-border bg-card/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Health</h3>
        <span className="text-[10px] text-muted-foreground">Live</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-navy-elev">
        <div className="bg-status-green" style={{ width: `${pct(c.normal)}%` }} />
        <div className="bg-status-yellow" style={{ width: `${pct(c.warning)}%` }} />
        <div className="bg-status-red" style={{ width: `${pct(c.critical)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Cell label="Normal" value={c.normal} color="text-status-green" />
        <Cell label="Warning" value={c.warning} color="text-status-yellow" />
        <Cell label="Critical" value={c.critical} color="text-status-red" />
      </div>
    </section>
  );
}

function Cell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-border bg-navy/40 py-2">
      <div className={`text-lg font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

const agents = [
  { key: "SentinelWatch", icon: Eye, color: "text-primary", desc: "Vision & anomaly" },
  { key: "CascadeRouter", icon: GitBranch, color: "text-status-green", desc: "Rerouting & risk" },
  { key: "CrowdGuard", icon: Users, color: "text-status-yellow", desc: "Station density" },
  { key: "EmergencyOrch", icon: Megaphone, color: "text-status-red", desc: "Coordination" },
] as const;

function AgentGrid() {
  return (
    <section className="rounded-lg border border-border bg-card/70 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Agents</h3>
      <div className="grid grid-cols-2 gap-2">
        {agents.map(({ key, icon: Icon, color, desc }) => (
          <motion.div
            key={key}
            whileHover={{ y: -2 }}
            className="rounded-md border border-border bg-navy/40 p-2.5"
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className="text-xs font-semibold text-foreground">{key}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{desc}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-status-green" style={{ animation: "pulse-glow 1.8s ease-in-out infinite" }} />
              <span className="text-status-green">Operational</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function IncidentFeed({ incidents, onFocus }: { incidents: Incident[]; onFocus?: (i: Incident) => void }) {
  return (
    <section className="rounded-lg border border-border bg-card/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Incidents</h3>
        <span className="text-[10px] text-muted-foreground">{incidents.length} open</span>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {incidents.map((i) => {
            const sev =
              i.severity === "critical" ? "border-status-red/60 bg-status-red/10" :
              i.severity === "warning" ? "border-status-yellow/50 bg-status-yellow/5" :
              "border-border bg-navy/40";
            return (
              <motion.li
                key={i.id}
                layout
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className={`rounded-md border ${sev} p-2.5 ${i.severity === "critical" ? "pulse-alert" : ""}`}
              >
                <Link
                  to="/incident/$id"
                  params={{ id: i.id }}
                  onClick={() => onFocus?.(i)}
                  className="block"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                      {i.severity === "critical" && <AlertOctagon className="h-3 w-3 text-status-red" />}
                      <span className={
                        i.severity === "critical" ? "text-status-red" :
                        i.severity === "warning" ? "text-status-yellow" : "text-muted-foreground"
                      }>{i.severity}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatRelative(i.ts)}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-foreground">{i.title}</div>
                  <div className="text-[11px] text-muted-foreground">{i.location} · {i.agent}</div>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}

function AgentLogStream() {
  const logs = useAgentLogs();
  return (
    <section className="rounded-lg border border-border bg-card/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Activity</h3>
        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <ul className="max-h-64 space-y-1.5 overflow-y-auto font-mono text-[11px]">
        <AnimatePresence initial={false}>
          {logs.slice(0, 12).map((l) => (
            <motion.li
              key={l.id}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 border-b border-border/40 pb-1.5"
            >
              <span className="text-muted-foreground">{new Date(l.ts).toLocaleTimeString("en-IN", { hour12: false })}</span>
              <span className="font-semibold text-primary">{l.agent}</span>
              <span className="text-foreground/90">{l.message}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}