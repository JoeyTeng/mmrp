export type ParamValueType = string | number | boolean;

export interface ParameterDefinition {
  name: string;
  type: "int" | "float" | "str" | "bool";
  description?: string | null;
  default?: ParamValueType;
  validValues?: ParamValueType[] | [number, number];
  required: boolean;
}

export interface FormatDefinition {
  pixelFormat?: string;
  colorSpace?: string;
  width?: number | string;
  height?: number | string;
  frameRate?: number;
}

export interface Port {
  id: string;
  formats: FormatDefinition;
}

/** Function that gets a single initial value for a param**/

export function getInitialNodeParamValue(
  parameters: ParameterDefinition[],
): Record<string, ParamValueType> {
  return parameters.reduce(
    (initialParams, p) => {
      let val: ParamValueType;

      if (Array.isArray(p.validValues)) {
        // Case 1: numeric range [min, max] for int/float
        if (
          p.validValues.length === 2 &&
          (p.type === "int" || p.type === "float") &&
          typeof p.validValues[0] === "number" &&
          typeof p.validValues[1] === "number"
        ) {
          const [min, max] = p.validValues as [number, number];
          // Use default if valid, otherwise fallback to min
          val =
            typeof p.default === "number" &&
            p.default >= min &&
            p.default <= max
              ? p.default
              : min;
        }
        // Case 2: enum of discrete options
        else if (p.validValues.length > 0) {
          val = p.validValues[0] as ParamValueType;
        }
        // Empty array: fall through to fallback
        else {
          val = p.type === "bool" ? false : "";
        }
      }
      // No validValues array: explicit default
      else if (p.default !== undefined && p.default !== null) {
        val = p.default as ParamValueType;
      }
      // Otherwise, choose a safe empty
      else {
        val = p.type === "bool" ? false : "";
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
): Port[] {
  return formats.map((fmt, i) => ({
    id: `${prefix}-${i}`,
    formats: fmt,
  })) as Port[];
}
