import { camelizeKeys } from "@/utils/camelize";
import type { ModuleMeta } from "@/types/module";

export const snakeCasedModules = [
  {
    id: 0,
    name: "blur",
    role: "process_node",
    parameters: [
      {
        name: "kernel_size",
        type: "int",
        description: null,
        default: 5,
        constraints: null,
        required: true,
      },
      {
        name: "method",
        type: "str",
        description: null,
        default: "gaussian",
        constraints: ["gaussian", "median", "bilateral"],
        required: true,
      },
    ],
    input_formats: [
      {
        pixel_format: "bgr24",
        color_space: "BT.709 Full",
        width: null,
        height: null,
        frame_rate: null,
      },
    ],
    output_formats: [
      {
        pixel_format: "bgr24",
        color_space: "BT.709 Full",
        width: null,
        height: null,
        frame_rate: null,
      },
    ],
  },
];

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
