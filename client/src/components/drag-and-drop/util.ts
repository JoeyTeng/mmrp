/** Function that gets a single initial value for a param**/

import {
  FormatDefinition,
  ParameterDefinition,
  ParamValueType,
  NodePort,
} from "./types";

export function getInitialNodeParamValue(
  parameters: ParameterDefinition[],
): Record<string, ParamValueType> {
  return parameters.reduce(
    (initialParams, p) => {
      let val: ParamValueType;

      // 1) pick explicit default if there is one
      if (p.default != null || p.default != undefined) {
        val = p.default as ParamValueType;
      }
      // 2) else pick the first constraints entry (if any)
      else if (Array.isArray(p.constraints) && p.constraints.length > 0) {
        val = p.constraints[0] as ParamValueType;
      }
      // 3) final fallback
      else {
        val = p.type === "bool" ? false : ""; // safety val for type int and float is empty string
      }

      // 4) additional check if default is in [min,max] range
      if (
        Array.isArray(p.constraints) &&
        p.constraints.length === 2 &&
        (p.type === "int" || p.type === "float")
      ) {
        const [min, max] = p.constraints as [number, number];
        if (typeof val !== "number") {
          val = min;
        } else {
          val = Math.min(Math.max(val, min), max);
        }
      }

      initialParams[p.name] = val;
      return initialParams;
    },
    {} as Record<string, ParamValueType>,
  );
}

export function makePorts(
  formats: FormatDefinition[],
  prefix: "input" | "output",
): NodePort[] {
  return formats.map((fmt, i) => ({
    id: `${prefix}-${i}`,
    formats: fmt,
  })) as NodePort[];
}
