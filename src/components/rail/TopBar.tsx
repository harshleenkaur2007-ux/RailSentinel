import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Radio, Train as TrainIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useIncidents, useTrains } from "@/lib/rail-data";

export function TopBar() {
  const trains = useTrains();
  const incidents = useIncidents();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const critical = incidents.filter((i) => i.severity === "critical" && !i.resolved).length;
  const risk = critical > 0 ? "ELEVATED" : "NORMAL";
  const riskColor = critical > 0 ? "text-status-red" : "text-status-green";
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-navy-deep/95 px-4 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="relative grid h-8 w-8 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/40">
          <Radio className="h-4 w-4 text-primary" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-status-green pulse-alert" style={{ animationDuration: "2.4s" }} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-foreground">RailSentinel</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Autonomous Command Center</div>
        </div>
      </Link>
      <div className="flex items-center gap-5 text-xs">
        <Stat icon={<TrainIcon className="h-3.5 w-3.5" />} label="Active Trains" value={trains.length} />
        <Stat icon={<AlertTriangle className="h-3.5 w-3.5 text-status-yellow" />} label="Open Incidents" value={incidents.filter(i => !i.resolved).length} />
        <Stat icon={<Activity className={`h-3.5 w-3.5 ${riskColor}`} />} label="Network Risk" value={risk} valueClass={riskColor} />
        <div className="ml-2 rounded-md border border-border bg-navy/60 px-3 py-1.5 font-mono text-sm tabular-nums text-foreground">
          {now.toLocaleTimeString("en-IN", { hour12: false })}
          <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">IST</span>
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-sm font-semibold ${valueClass ?? "text-foreground"}`}>{value}</div>
      </div>
    </div>
  );
}