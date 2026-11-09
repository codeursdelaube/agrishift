import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePack } from "@/lib/packs";
import { fmt, recommend, simulate, type Priority, type ZonePack } from ".";
import cases from "./__fixtures__/api-cases.json";

const packs: Record<string, ZonePack> = Object.fromEntries(
  ["maritime_lome", "plateaux_kpalime", "kara_kara"].map((zone) => [
    zone,
    parsePack(JSON.parse(readFileSync(`public/packs/${zone}.json`, "utf8"))),
  ]),
);

const near = (a: number, b: number) => Math.abs(a - b) <= 0.01;

function deepCompare(actual: unknown, expected: unknown, path = "$"): string[] {
  if (typeof expected === "number") {
    return typeof actual === "number" && near(actual, expected) ? [] : [path];
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return [path];
    return expected.flatMap((e, i) => deepCompare(actual[i], e, `${path}[${i}]`));
  }
  if (expected && typeof expected === "object") {
    const a = actual as Record<string, unknown>;
    return Object.keys(expected).flatMap((k) =>
      deepCompare(a?.[k], (expected as Record<string, unknown>)[k], `${path}.${k}`),
    );
  }
  return actual === expected ? [] : [path];
}

type Input = {
  zone_id: string;
  crop_id: string;
  soil_id: string;
  scenario_id: string;
  sowing_dekad?: number;
  previous_crop_id: string | null;
  priority: Priority;
  horizon: number;
};

describe("moteur, comparé aux réponses réelles de l'API", () => {
  for (const c of cases as unknown as { fn: string; input: Input; expected: unknown }[]) {
    it(`${c.fn} ${JSON.stringify(c.input)}`, () => {
      const i = c.input;
      const pack = packs[i.zone_id];
      const actual =
        c.fn === "simulate"
          ? simulate(pack, i.crop_id, i.soil_id, i.scenario_id, i.sowing_dekad)
          : recommend(pack, i, i.priority, i.scenario_id, i.horizon);
      expect(deepCompare(actual, c.expected)).toEqual([]);
    });
  }
});

describe("propriétés du moteur", () => {
  const pack = packs.kara_kara;

  it("met en forme les nombres comme le serveur", () => {
    expect(fmt(0.456)).toBe("0,46");
    expect(fmt(20)).toBe("20");
    expect(fmt(-20, 1, true)).toBe("-20");
    expect(fmt(0, 1, true)).toBe("+0");
  });

  it("donne plus de stress quand il pleut moins", () => {
    const base = simulate(pack, "maize", "sandy", "baseline", 24);
    const dry = simulate(pack, "maize", "sandy", "dry_minus30", 24);
    expect(dry.stress_index).toBeGreaterThanOrEqual(base.stress_index);
  });

  it("refuse un paquet corrompu", () => {
    const broken = { ...pack, climate: { ...pack.climate, dekads: pack.climate.dekads.slice(1) } };
    expect(() => parsePack(broken)).toThrow();
  });

  it("signale un scénario inconnu", () => {
    expect(() => simulate(pack, "maize", "sandy", "mars")).toThrow("Scénario inconnu");
  });
});
