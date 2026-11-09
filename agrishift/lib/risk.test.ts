import { describe, expect, it } from "vitest";
import { riskFromStress } from "./risk";

describe("riskFromStress", () => {
  it("classe selon les seuils 0.15 et 0.35", () => {
    expect(riskFromStress(0)).toBe("good");
    expect(riskFromStress(0.149)).toBe("good");
    expect(riskFromStress(0.15)).toBe("warning");
    expect(riskFromStress(0.349)).toBe("warning");
    expect(riskFromStress(0.35)).toBe("risky");
    expect(riskFromStress(1)).toBe("risky");
  });
});
