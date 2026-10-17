// Transparent, rule-based BASELINE risk scoring. Not a trained model.
export type Tier = "low" | "medium" | "high";
export interface TxInput {
  amount: number;
  usualAmount: number;
  unusualLocation: boolean;
  recentCount: number; // transactions in the last hour
}
export interface Tx extends TxInput {
  id: string;
  account: string;
  merchant: string;
  time: number;
  score: number;
  tier: Tier;
  reasons: string[];
  procMs: number;
}

export function scoreTx(t: TxInput): { score: number; tier: Tier; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const ratio = t.usualAmount > 0 ? t.amount / t.usualAmount : 1;
  if (ratio >= 5) { score += 40; reasons.push(`Amount is ${ratio.toFixed(1)}x the usual amount (+40)`); }
  else if (ratio >= 2) { score += 20; reasons.push(`Amount is ${ratio.toFixed(1)}x the usual amount (+20)`); }
  if (t.unusualLocation) { score += 30; reasons.push("Transaction from an unusual location (+30)"); }
  if (t.recentCount >= 10) { score += 30; reasons.push(`${t.recentCount} transactions in the last hour (+30)`); }
  else if (t.recentCount >= 5) { score += 15; reasons.push(`${t.recentCount} transactions in the last hour (+15)`); }
  if (t.amount >= 5000) { score += 10; reasons.push("High absolute amount ≥ 5,000 (+10)"); }
  score = Math.min(100, score);
  if (!reasons.length) reasons.push("No rules triggered");
  const tier: Tier = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { score, tier, reasons };
}

const merchants = ["Demo Grocery", "Sample Air", "Test Electronics", "Mock Cafe", "Fake Fuel", "Example Books"];
let n = 1000;
export function makeTx(input: TxInput, merchant?: string): Tx {
  const t0 = performance.now();
  const r = scoreTx(input);
  const procMs = performance.now() - t0;
  return {
    ...input, ...r, procMs,
    id: `TX-${++n}`,
    account: `DEMO-${String(Math.floor(Math.random() * 900) + 100)}`,
    merchant: merchant ?? merchants[Math.floor(Math.random() * merchants.length)] ?? "Demo Merchant",
    time: Date.now(),
  };
}
export function randomTx(): Tx {
  const usual = Math.round(20 + Math.random() * 300);
  const spike = Math.random() < 0.2;
  return makeTx({
    usualAmount: usual,
    amount: Math.round(usual * (spike ? 2 + Math.random() * 8 : 0.3 + Math.random() * 1.4)),
    unusualLocation: Math.random() < 0.15,
    recentCount: Math.random() < 0.15 ? 5 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 4),
  });
}
