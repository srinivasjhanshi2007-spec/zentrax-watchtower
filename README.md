# ZentraX SentinelAI — Hackathon Prototype

IBM Z Datathon 2026 · "Real-Time AI for Critical Decisions"

A demo dashboard for real-time fraud/risk scoring using **simulated, fictional data only**.

## What it is
- Browser-only simulator generates fake transactions (start/pause).
- Manual form: amount, usual amount, unusual location (yes/no), transactions in last hour.
- **Baseline rule-based score (0–100)** with human-readable reasons. Not a trained model, not a real fraud predictor. No accuracy or performance claims.
- Metrics, live feed, searchable/sortable table, alert queue, detail panel.

## Scoring rules (`src/lib/risk.ts`)
| Rule | Points |
|---|---|
| Amount ≥ 5× usual / ≥ 2× usual | +40 / +20 |
| Unusual location | +30 |
| ≥ 10 / ≥ 5 transactions in last hour | +30 / +15 |
| Amount ≥ 5,000 | +10 |

Capped at 100. Low < 40, Medium 40–69, High ≥ 70.

Python equivalent for the team:
```python
def score(amount, usual, unusual_loc, recent):
    s, r = 0, amount / usual
    s += 40 if r >= 5 else 20 if r >= 2 else 0
    s += 30 if unusual_loc else 0
    s += 30 if recent >= 10 else 15 if recent >= 5 else 0
    s += 10 if amount >= 5000 else 0
    return min(s, 100)
```

## Architecture
Simulator/Form → `scoreTx()` → React state → dashboard views. No backend, no storage, no auth.

## IBM Z / LinuxONE plan (not implemented)
This app is **not** deployed on IBM hardware. Planned next steps: Python scoring service on LinuxONE, train and compare a model on public synthetic data, evaluate IBM Z inference options, stream data via a queue, and measure latency on target hardware before claiming anything.
