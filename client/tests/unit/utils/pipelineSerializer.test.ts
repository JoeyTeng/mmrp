import { dumpPipelineToJson } from "@/utils/pipelineSerializer";
import { makeNode } from "../helpers/helpers";
import type { Edge } from "@xyflow/react";
import { ModuleParameter } from "@/types/module";

describe("dumpPipelineToJson", () => {
  it("correctly records one incoming edge per node", () => {
    const nodeA = makeNode("1", "A");
    const nodeB = makeNode("2", "B");
    const edges: Edge[] = [{ id: "e1", source: "1", target: "2" }];

    const { modules } = dumpPipelineToJson([nodeA, nodeB], edges);
    const modA = modules.find((m) => m.id === "1")!;
    const modB = modules.find((m) => m.id === "2")!;

    expect(modA.source).toEqual([]);
    expect(modB.source).toEqual(["1"]);
  });

  // impossible test case for MVP but maybe applicable for future, used here to cover branches
  it("initializes the source array on first seeing a target node", () => {
    const target = makeNode("1", "Target", []);
    const edges: Edge[] = [
      { id: "e1", source: "2", target: "1" }, // first hit: creates the array
      { id: "e2", source: "3", target: "1" }, // second hit: reuses it
    ];

    const { modules } = dumpPipelineToJson([target], edges);
    const mod = modules.find((m) => m.id === "1")!;
    expect(mod.source).toEqual(["2", "3"]);
  });
  it("serializes node.data.params into a parameters array", () => {
    const parameters: ModuleParameter[] = [
      {
        name: "kernel_size",
        metadata: {
          value: 5,
          type: "int",
          constraints: {
            type: "int",
            default: 5,
            min: 1,
            max: 31,
            required: true,
            description: "Kernel size (must be odd)",
          },
        },
      },
      {
        name: "method",
        metadata: {
          value: "gaussian",
          type: "select",
          constraints: {
            type: "select",
            default: "gaussian",
            options: ["gaussian", "median", "average"],
            required: true,
            description: "Blur algorithm type",
          },
        },
      },
    ];

    // { kernel_size: 5, method: "gaussian" }
    const node = makeNode("42", "testNode", parameters);

    const { modules } = dumpPipelineToJson([node], []);
    expect(modules).toHaveLength(1);

    const [mod] = modules;
    // Expect a parameters array, not an object
    expect(Array.isArray(mod.parameters)).toBe(true);

    // And that array should exactly match the entries of params
    expect(mod.parameters).toEqual([
      { key: "kernel_size", value: 5 },
      { key: "method", value: "gaussian" },
    ]);
  });
});
