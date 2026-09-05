/**
 * @jest-environment node
 */

import { haversineKm } from "@/utils/geo";

describe("haversineKm", () => {
  it("returns ~0 for the same point", () => {
    expect(haversineKm(5.55, -0.19, 5.55, -0.19)).toBeLessThan(0.01);
  });

  it("computes a plausible Accra → Kumasi distance (roughly 200-260 km)", () => {
    const d = haversineKm(5.55, -0.19, 6.6946, -1.6203);
    expect(d).toBeGreaterThan(180);
    expect(d).toBeLessThan(280);
  });

  it("is symmetric", () => {
    const a = haversineKm(5.55, -0.19, 9.3999, -0.8387);
    const b = haversineKm(9.3999, -0.8387, 5.55, -0.19);
    expect(Math.abs(a - b)).toBeLessThan(1e-9);
  });
});