import { describe, expect, it } from "vitest";
import { nearestZone } from "./zones";

describe("nearestZone", () => {
  it("trouve la zone la plus proche", () => {
    expect(nearestZone(6.17, 1.25).zone_id).toBe("maritime_lome");
    expect(nearestZone(7.0, 0.6).zone_id).toBe("plateaux_kpalime");
    expect(nearestZone(10.3, 0.9).zone_id).toBe("kara_kara");
  });
});
