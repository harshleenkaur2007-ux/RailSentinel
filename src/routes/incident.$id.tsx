import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertOctagon, ArrowLeft, CheckCircle2, Eye, FileText, GitBranch, Megaphone, ShieldAlert, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/rail/TopBar";
import { getIncident, formatRelative } from "@/lib/rail-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/incident/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Incident ${params.id} — RailSentinel` },
      { name: "description", content: "Incident response console with autonomous agent actions, reroute proposals, and emergency coordination." },
    ],
  }),
  component: IncidentConsole,
});

function IncidentConsole() {
  const { id } = useParams({ from: "/incident/$id" });
  const incident = getIncident(id);
  const [decision, setDecision] = useState<"pending" | "approved" | "overridden">("pending");

  if (!incident) {
    return (
      <div className="flex h-screen flex-col">
        <TopBar />
        <div className="grid flex-1 place-items-center text-muted-foreground">
          <div className="text-center">
            <p>Incident not found.</p>
            <Link to="/" className="mt-3 inline-block text-primary underline">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-navy-deep">
      <TopBar />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to live map
          </Link>

          {/* Hero incident card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-status-red/40 bg-gradient-to-br from-status-red/15 via-card to-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-status-red">
                  <AlertOctagon className="h-4 w-4 pulse-alert rounded-full" />
                  {incident.severity} · {incident.id}
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-foreground text-glow-red">{incident.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{incident.location} · Detected {formatRelative(incident.ts)} by {incident.agent}</p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/90">{incident.summary}</p>
              </div>
              <div className="flex flex-col gap-2">
                <DecisionButton state={decision} />
              </div>
            </div>
          </motion.div>

          {/* Agent grid */}
          <section className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Autonomous Agent Actions</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AgentCard
                name="SentinelWatch" icon={Eye} color="text-primary"
                actions={[
                  "Confirmed obstruction via 3 camera streams",
                  "Confidence 0.97 — 2.3s detection latency",
                  "Pushed alert to control room + on-board AWS",
                ]}
              />
              <AgentCard
                name="CascadeRouter" icon={GitBranch} color="text-status-green"
                actions={[
                  "Computed 3 reroute options",
                  "Issued temporary speed restriction (40 km/h)",
                  "Reserved alt path for 4 downstream trains",
                ]}
              />
              <AgentCard
                name="CrowdGuard" icon={Users} color="text-status-yellow"
                actions={[
                  "Auto-throttle engaged at Lonavla concourse",
                  "Forecasting +18% platform load in 22 min",
                  "Diverted commuter flow to Platforms 2, 4",
                ]}
              />
              <AgentCard
                name="EmergencyOrch" icon={Megaphone} color="text-status-red"
                actions={[
                  "Notified RPF, station master, medical unit",
                  "Dispatched SMS to 12 stakeholders",
                  "ETA of response team: 7 min",
                ]}
              />
            </div>
          </section>

          {/* Reroute proposals */}
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reroute Proposals · CascadeRouter</h2>
              <span className="text-[11px] text-muted-foreground">Best option highlighted</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Proposal recommended title="Via Khandala Loop" delay="+8 min" risk={0.08} savings="Saves 14 min vs hold" />
              <Proposal title="Hold at Karjat" delay="+34 min" risk={0.02} savings="Lowest risk, longest delay" />
              <Proposal title="Reverse to Karjat + Reroute" delay="+22 min" risk={0.14} savings="Frees corridor for emergency unit" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setDecision("approved")}
                className="bg-status-green text-white hover:bg-status-green/90 h-11 px-6 text-sm font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve Recommended
              </Button>
              <Button
                onClick={() => setDecision("overridden")}
                className="bg-status-red text-white hover:bg-status-red/90 h-11 px-6 text-sm font-semibold"
              >
                <XCircle className="h-4 w-4" /> Override
              </Button>
              <Button variant="outline" className="h-11 px-6 text-sm">
                <FileText className="h-4 w-4" /> Generate AI Report
              </Button>
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" /> Auto-approves in 60s if no input
              </div>
            </div>
          </section>

          {/* Emergency notifications */}
          <section className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emergency Notifications</h3>
              <ul className="space-y-2 text-xs">
                {[
                  { ts: "14:22:11", who: "RPF Lonavla", state: "Acknowledged" },
                  { ts: "14:22:09", who: "Station Master, Lonavla", state: "Acknowledged" },
                  { ts: "14:22:08", who: "Medical Unit, Karjat", state: "Dispatched" },
                  { ts: "14:22:07", who: "Divisional Control, CR", state: "Notified" },
                ].map((r) => (
                  <li key={r.who} className="flex items-center justify-between border-b border-border/40 pb-1.5">
                    <span className="font-mono text-muted-foreground">{r.ts}</span>
                    <span className="flex-1 px-3 text-foreground">{r.who}</span>
                    <span className="text-status-green">{r.state}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decision Timeline</h3>
              <ol className="space-y-3 text-xs">
                <Timeline ts="14:21:42" text="SentinelWatch detected obstruction" />
                <Timeline ts="14:21:44" text="CascadeRouter computed reroute options" />
                <Timeline ts="14:21:51" text="EmergencyOrch contacted RPF + medical" />
                <Timeline ts="14:22:11" text="Awaiting controller decision…" pending />
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DecisionButton({ state }: { state: "pending" | "approved" | "overridden" }) {
  if (state === "approved") return <span className="rounded-md bg-status-green/20 px-3 py-1.5 text-xs font-semibold text-status-green">DECISION: APPROVED</span>;
  if (state === "overridden") return <span className="rounded-md bg-status-red/20 px-3 py-1.5 text-xs font-semibold text-status-red">DECISION: OVERRIDE</span>;
  return (
    <span className="rounded-md border border-status-yellow/40 bg-status-yellow/10 px-3 py-1.5 text-xs font-semibold text-status-yellow pulse-alert">
      AWAITING DECISION
    </span>
  );
}

function AgentCard({ name, icon: Icon, color, actions }: { name: string; icon: React.ComponentType<{ className?: string }>; color: string; actions: string[] }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-lg border border-border bg-card/80 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="ml-auto text-[10px] text-status-green">● live</span>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-foreground/85">
        {actions.map((a, i) => (
          <li key={i} className="flex gap-2"><span className="text-muted-foreground">›</span>{a}</li>
        ))}
      </ul>
    </motion.div>
  );
}

function Proposal({ recommended, title, delay, risk, savings }: { recommended?: boolean; title: string; delay: string; risk: number; savings: string }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative rounded-lg border p-4 ${recommended ? "border-status-green/60 bg-status-green/5 shadow-[0_0_30px_-10px_rgba(22,163,74,0.6)]" : "border-border bg-card/70"}`}
    >
      {recommended && <span className="absolute -top-2 left-3 rounded bg-status-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Recommended</span>}
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Metric label="Added delay" value={delay} />
        <Metric label="Risk score" value={risk.toFixed(2)} good={risk < 0.1} bad={risk > 0.15} />
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">{savings}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy-elev">
        <div className={recommended ? "h-full bg-status-green" : "h-full bg-primary"} style={{ width: `${Math.min(100, Math.max(20, 100 - risk * 400))}%` }} />
      </div>
    </motion.div>
  );
}

function Metric({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-navy/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${good ? "text-status-green" : bad ? "text-status-red" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Timeline({ ts, text, pending }: { ts: string; text: string; pending?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1 h-2 w-2 rounded-full ${pending ? "bg-status-yellow pulse-alert" : "bg-status-green"}`} />
      <div>
        <div className="font-mono text-[11px] text-muted-foreground">{ts}</div>
        <div className="text-foreground">{text}</div>
      </div>
    </li>
  );
}