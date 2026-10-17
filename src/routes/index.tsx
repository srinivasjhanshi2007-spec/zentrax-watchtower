import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { makeTx, randomTx, type Tx, type Tier } from "@/lib/risk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZentraX SentinelAI — Simulated Fraud Risk Dashboard" },
      { name: "description", content: "Hackathon prototype: real-time simulated transaction risk scoring with explainable baseline rules." },
      { property: "og:title", content: "ZentraX SentinelAI" },
      { property: "og:description", content: "Explainable baseline fraud-risk demo for IBM Z Datathon 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const seed = (): Tx[] => Array.from({ length: 12 }, randomTx);
const tierCls: Record<Tier, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/20 text-destructive",
};
function Badge({ tier }: { tier: Tier }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${tierCls[tier]}`}>{tier}</span>;
}
function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
      {children}
    </section>
  );
}

function App() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [live, setLive] = useState(false);
  const [sel, setSel] = useState<Tx | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: keyof Tx; d: 1 | -1 }>({ k: "time", d: -1 });
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ amount: "250", usual: "80", loc: "no", freq: "3" });

  useEffect(() => setTxs(seed()), []);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTxs((p) => [randomTx(), ...p].slice(0, 300)), 1500);
    return () => clearInterval(id);
  }, [live]);

  const flagged = txs.filter((t) => t.tier !== "low");
  const high = txs.filter((t) => t.tier === "high");
  const avg = txs.length ? txs.reduce((s, t) => s + t.procMs, 0) / txs.length : 0;
  const alerts = flagged.filter((t) => !reviewed.has(t.id));

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return txs
      .filter((t) => !s || [t.id, t.account, t.merchant, t.tier].some((v) => v.toLowerCase().includes(s)))
      .sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : a[sort.k] < b[sort.k] ? -1 : 0) * sort.d);
  }, [txs, q, sort]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount), usual = Number(form.usual), freq = Number(form.freq);
    if (!(amount > 0) || !(usual > 0) || !(freq >= 0)) return;
    const t = makeTx({ amount, usualAmount: usual, unusualLocation: form.loc === "yes", recentCount: freq }, "Manual Entry");
    setTxs((p) => [t, ...p]);
    setSel(t);
  };
  const th = (k: keyof Tx, label: string) => (
    <th className="cursor-pointer px-2 py-2 text-left hover:text-foreground" onClick={() => setSort((s) => ({ k, d: s.k === k ? (s.d === 1 ? -1 : 1) : -1 }))}>
      {label}{sort.k === k ? (sort.d === 1 ? " ▲" : " ▼") : ""}
    </th>
  );
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      <div className="bg-warning/15 py-2 text-center text-xs font-medium text-warning">
        DEMO PROTOTYPE · All data is simulated and fictional · Baseline rule-based scoring, not a trained model or real fraud predictor
      </div>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ZentraX <span className="text-primary">SentinelAI</span></h1>
          <p className="text-sm text-muted-foreground">IBM Z Datathon 2026 · Real-Time AI for Critical Decisions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLive((l) => !l)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {live ? "❚❚ Pause feed" : "▶ Start live feed"}
          </button>
          <button onClick={() => { setTxs(seed()); setReviewed(new Set()); setSel(null); }} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Reset</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 pb-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[["Transactions processed", txs.length], ["Flagged (med+high)", flagged.length], ["High risk", high.length], ["Avg scoring time (browser)", `${avg.toFixed(3)} ms`]].map(([l, v]) => (
            <Card key={l as string}><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-bold">{v}</div></Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={`Live feed ${live ? "· running" : "· paused"}`}>
            <ul className="max-h-80 space-y-1 overflow-auto text-sm">
              {txs.slice(0, 15).map((t) => (
                <li key={t.id} onClick={() => setSel(t)} className="flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-accent">
                  <span className="font-mono text-xs">{t.id}</span><span>${t.amount}</span><span className="w-8 text-right">{t.score}</span><Badge tier={t.tier} />
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Score a transaction">
            <form onSubmit={submit} className="space-y-3 text-sm">
              <label className="block">Amount (demo $)<input className={input} type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              <label className="block">Usual amount (demo $)<input className={input} type="number" min="0.01" step="0.01" value={form.usual} onChange={(e) => setForm({ ...form, usual: e.target.value })} /></label>
              <label className="block">Unusual location?
                <select className={input} value={form.loc} onChange={(e) => setForm({ ...form, loc: e.target.value })}><option value="no">No</option><option value="yes">Yes</option></select>
              </label>
              <label className="block">Transactions in last hour<input className={input} type="number" min="0" value={form.freq} onChange={(e) => setForm({ ...form, freq: e.target.value })} /></label>
              <button className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground hover:opacity-90">Score & add</button>
              <p className="text-xs text-muted-foreground">No personal or banking details are requested.</p>
            </form>
          </Card>

          <Card title="Transaction detail">
            {sel ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="font-mono">{sel.id}</span><Badge tier={sel.tier} /></div>
                <div className="text-4xl font-bold">{sel.score}<span className="text-base text-muted-foreground">/100</span></div>
                <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${sel.score}%` }} /></div>
                <dl className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <dt>Account</dt><dd className="text-foreground">{sel.account}</dd>
                  <dt>Merchant</dt><dd className="text-foreground">{sel.merchant}</dd>
                  <dt>Amount / usual</dt><dd className="text-foreground">${sel.amount} / ${sel.usualAmount}</dd>
                  <dt>Unusual location</dt><dd className="text-foreground">{sel.unusualLocation ? "Yes" : "No"}</dd>
                  <dt>Last-hour count</dt><dd className="text-foreground">{sel.recentCount}</dd>
                </dl>
                <h3 className="pt-2 font-semibold">Why this score</h3>
                <ul className="list-disc pl-5">{sel.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            ) : <p className="text-sm text-muted-foreground">Select a transaction to see its explanation.</p>}
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Transactions" className="lg:col-span-2">
            <input className={`${input} mb-3`} placeholder="Search ID, account, merchant, tier…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                  <tr>{th("id", "ID")}{th("merchant", "Merchant")}{th("amount", "Amount")}{th("score", "Score")}{th("tier", "Tier")}{th("time", "Time")}</tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} onClick={() => setSel(t)} className={`cursor-pointer border-t border-border hover:bg-accent ${sel?.id === t.id ? "bg-accent" : ""}`}>
                      <td className="px-2 py-1.5 font-mono text-xs">{t.id}</td><td className="px-2">{t.merchant}</td><td className="px-2">${t.amount}</td>
                      <td className="px-2">{t.score}</td><td className="px-2"><Badge tier={t.tier} /></td><td className="px-2 text-xs text-muted-foreground">{new Date(t.time).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title={`Alert queue (${alerts.length})`}>
            <ul className="max-h-96 space-y-2 overflow-auto">
              {alerts.sort((a, b) => b.score - a.score).map((t) => (
                <li key={t.id} className="rounded-lg border border-border p-2 text-sm">
                  <div className="flex items-center justify-between"><button onClick={() => setSel(t)} className="font-mono text-xs underline">{t.id}</button><Badge tier={t.tier} /></div>
                  <div className="mt-1 text-xs text-muted-foreground">{t.reasons[0]}</div>
                  <button onClick={() => setReviewed((s) => new Set(s).add(t.id))} className="mt-2 rounded border border-border px-2 py-0.5 text-xs hover:bg-accent">Mark reviewed</button>
                </li>
              ))}
              {!alerts.length && <li className="text-sm text-muted-foreground">No open alerts.</li>}
            </ul>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="How scoring works (baseline)">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Amount ≥ 5× usual: +40 · ≥ 2× usual: +20</li>
              <li>Unusual location: +30</li>
              <li>≥ 10 transactions/hour: +30 · ≥ 5: +15</li>
              <li>Amount ≥ 5,000: +10 · capped at 100</li>
              <li>Tiers: Low &lt; 40 · Medium 40–69 · High ≥ 70</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Hand-written rules for demonstration. Weights are illustrative, not validated against real data. No accuracy is claimed.</p>
          </Card>
          <Card title="IBM Z / LinuxONE Integration Plan">
            <p className="mb-2 text-xs font-semibold text-warning">Planned only — this prototype is NOT deployed on IBM Z or LinuxONE hardware.</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Port the scoring rules to a Python service (e.g. FastAPI) that could run on LinuxONE.</li>
              <li>Train a model (e.g. scikit-learn) on a public synthetic fraud dataset and compare it to this baseline.</li>
              <li>Explore IBM Z options for in-transaction inference (e.g. ONNX models, IBM's AI toolkits for Z) — to be evaluated.</li>
              <li>Stream transactions via a message queue instead of browser simulation.</li>
              <li>Measure latency on target hardware before making any performance claims.</li>
            </ol>
          </Card>
        </div>

        <Card title="Project overview & architecture">
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <p>ZentraX SentinelAI is a student hackathon prototype showing how a risk-scoring dashboard could support real-time decisions. Everything runs in the browser: a simulator generates fictional transactions, a transparent rule function scores each one, and the UI shows metrics, alerts and explanations.</p>
            <pre className="overflow-auto rounded-md bg-background p-3 text-xs">{`Simulator / Form
      │
      ▼
scoreTx() rules  ──► score 0-100 + reasons + tier
      │
      ▼
Dashboard state ──► metrics · feed · table · alerts · detail`}</pre>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">No backend, no security hardening, no real data. See README.md for details.</p>
        </Card>
      </main>
    </div>
  );
}
