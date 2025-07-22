import { camelizeKeys } from "@/utils/camelize";
import { snakeCasedModules } from "../fixtures/moduleResponse";
import type { ModuleMeta } from "@/types/module";

describe("camelizeKeys()", () => {
  /** Recursively asserts that no object key contains an underscore */
  function assertNoUnderscores(obj: unknown): void {
    if (Array.isArray(obj)) {
      obj.forEach(assertNoUnderscores);
    } else if (obj && typeof obj === "object") {
      for (const [key, val] of Object.entries(obj)) {
        expect(key).not.toMatch(/_/);
        assertNoUnderscores(val);
      }
    }
  }

  it("passes primitives and null through unchanged", () => {
    expect(camelizeKeys<number>(42)).toBe(42);
    expect(camelizeKeys<string>("foo_bar")).toBe("foo_bar");
    expect(camelizeKeys<null>(null)).toBeNull();
  });

  it("preserves array length and core module values", () => {
    const result = camelizeKeys(snakeCasedModules) as unknown as ModuleMeta[];
    expect(result).toHaveLength(snakeCasedModules.length);

    const original = snakeCasedModules[0];
    const mod = result[0];
    expect(mod).toMatchObject({
      id: original.id,
      name: original.name,
      role: original.role,
    });
  });

  it("leaves snakecased values untouched even in nested objects", () => {
    const [mod] = camelizeKeys(snakeCasedModules) as unknown as ModuleMeta[];

    expect(mod.parameters[0]).toHaveProperty("name", "kernel_size");
  });

  it("camelCases all format object keys", () => {
    const [mod] = camelizeKeys(snakeCasedModules) as unknown as ModuleMeta[];

    expect(mod.inputFormats[0]).toHaveProperty("pixelFormat");
    expect(mod.inputFormats[0]).toHaveProperty("colorSpace");
    expect(mod.inputFormats[0]).toHaveProperty("frameRate");

    expect(mod.outputFormats[0]).toHaveProperty("pixelFormat");
    expect(mod.outputFormats[0]).toHaveProperty("frameRate");
  });

  it("no underscore is part of the object keys", () => {
    const result = camelizeKeys(snakeCasedModules);
    assertNoUnderscores(result);
  });
});
