import { camelizeKeys } from "@/utils/camelize";
import type { Module } from "@/types/module";

export const snakeCasedModules = [
  {
    id: 0,
    name: "blur",
    type: "process_node",
    position: { x: 0, y: 0 },
    data: {
      parameters: [
        {
          name: "kernel_size",
          metadata: {
            value: 5,
            type: "int",
            constraints: {
              type: "int",
              default: 5,
              required: true,
              description: null,
            },
          },
        },
        {
          name: "method",
          metadata: {
            value: "gaussian",
            type: "str",
            constraints: {
              type: "select",
              default: "gaussian",
              required: true,
              description: null,
              options: ["gaussian", "median", "bilateral"],
            },
          },
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
    const result = camelizeKeys(snakeCasedModules) as unknown as Module[];
    expect(result).toHaveLength(snakeCasedModules.length);

    const original = snakeCasedModules[0];
    const mod = result[0];
    expect(mod).toMatchObject({
      id: original.id,
      name: original.name,
      type: original.type,
    });
  });

  it("leaves snakecased values untouched even in nested objects", () => {
    const [mod] = camelizeKeys(snakeCasedModules) as unknown as Module[];

    expect(mod.data.parameters[0]).toHaveProperty("name", "kernel_size");
  });

  it("camelCases all format object keys", () => {
    const [mod] = camelizeKeys(snakeCasedModules) as unknown as Module[];

    expect(mod.data.inputFormats[0]).toHaveProperty("pixelFormat");
    expect(mod.data.inputFormats[0]).toHaveProperty("colorSpace");
    expect(mod.data.inputFormats[0]).toHaveProperty("frameRate");

    expect(mod.data.outputFormats[0]).toHaveProperty("pixelFormat");
    expect(mod.data.outputFormats[0]).toHaveProperty("frameRate");
  });

  it("no underscore is part of the object keys", () => {
    const result = camelizeKeys(snakeCasedModules);
    assertNoUnderscores(result);
  });
});
