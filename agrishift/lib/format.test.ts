import { describe, expect, it } from "vitest";
import { addDekads, dekadLabel, dekadOf, friendlyDekad } from "./format";

describe("décades lisibles", () => {
  it("traduit les libellés du paquet", () => {
    expect(friendlyDekad("août D3")).toBe("fin août");
    expect(friendlyDekad("janv. D1")).toBe("début janvier");
    expect(friendlyDekad("sept. D2")).toBe("mi-septembre");
  });

  it("traduit un index", () => {
    expect(dekadLabel(13)).toBe("début mai");
    expect(dekadLabel(36)).toBe("fin décembre");
  });

  it("calcule la décade d'une date et boucle après 36", () => {
    expect(dekadOf(new Date(2026, 10, 9))).toBe(31);
    expect(dekadOf(new Date(2026, 0, 21))).toBe(3);
    expect(addDekads(36, 1)).toBe(1);
    expect(addDekads(35, 3)).toBe(2);
  });
});
