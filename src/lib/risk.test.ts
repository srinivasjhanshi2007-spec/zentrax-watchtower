import { describe, it, expect } from "vitest";
import { scoreTx } from "./risk";

describe("baseline scoring", () => {
  it("low when nothing triggers", () => {
    expect(scoreTx({ amount: 50, usualAmount: 50, unusualLocation: false, recentCount: 1 }).tier).toBe("low");
  });
  it("high for big spike + unusual location", () => {
    const r = scoreTx({ amount: 600, usualAmount: 100, unusualLocation: true, recentCount: 1 });
    expect(r.score).toBe(70);
    expect(r.tier).toBe("high");
  });
  it("caps at 100", () => {
    expect(scoreTx({ amount: 9000, usualAmount: 10, unusualLocation: true, recentCount: 20 }).score).toBe(100);
  });
});
