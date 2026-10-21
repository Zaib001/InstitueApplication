import { describe, it, expect } from "vitest";
import frMessages from "../../src/messages/fr.json";
import enMessages from "../../src/messages/en.json";

function getFlattenedKeys(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getFlattenedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("Architecture d'Internationalisation (i18n) — Monsieur Fanyi", () => {
  it("contient exactement les mêmes clés entre les dictionnaires français et anglais", () => {
    const frKeys = getFlattenedKeys(frMessages).sort();
    const enKeys = getFlattenedKeys(enMessages).sort();

    expect(frKeys).toEqual(enKeys);
  });

  it("ne possède aucune valeur vide dans le dictionnaire français (fr.json)", () => {
    const frKeys = getFlattenedKeys(frMessages);
    for (const key of frKeys) {
      const parts = key.split(".");
      let val: any = frMessages;
      for (const p of parts) {
        val = val[p];
      }
      expect(typeof val).toBe("string");
      expect(val.trim().length).toBeGreaterThan(0);
    }
  });

  it("ne possède aucune valeur vide dans le dictionnaire anglais (en.json)", () => {
    const enKeys = getFlattenedKeys(enMessages);
    for (const key of enKeys) {
      const parts = key.split(".");
      let val: any = enMessages;
      for (const p of parts) {
        val = val[p];
      }
      expect(typeof val).toBe("string");
      expect(val.trim().length).toBeGreaterThan(0);
    }
  });
});
