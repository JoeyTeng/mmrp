import { ALLOWED_FRAME_RATES, FrameRate, IOFormat } from "@/types/module";
import { camelizeKeys } from "./camelize";

type ConfigParameter = {
  name: string;
  flag: string;
  type: string;
  required: boolean;
  description?: string;
  default?: unknown;
  [key: string]: unknown;
};

export async function validateConfigFile(config: File): Promise<boolean> {
  // Check if the file is a valid JSON config file
  if (config.type !== "application/json" || config.size === 0) {
    return false;
  }

  // Check the content of the config file
  const text = await config.text();
  let json;
  try {
    json = JSON.parse(text);
    json = camelizeKeys(json);
  } catch (error) {
    console.error("Failed to read or parse config file:", error);
    throw new Error("Invalid or unreadable JSON in config file.");
  }

  // Check required fields
  const hasName = typeof json.name === "string";
  const hasExecutable = typeof json.executable === "string";
  const hasInputFormat = Array.isArray(json.inputFormats);
  const hasOutputFormat = Array.isArray(json.outputFormats);
  const hasParameters = Array.isArray(json.parameters);

  if (
    !hasName ||
    !hasExecutable ||
    !hasInputFormat ||
    !hasOutputFormat ||
    !hasParameters
  ) {
    return false;
  }

  if (!validateFormats(json.inputFormats))
    throw Error(
      "The input formats could not be validated. Please check the height, width, and frame rate.",
    );
  if (!validateFormats(json.outputFormats))
    throw Error(
      "The output formats could not be validated. Please check the height, width, and frame rate.",
    );

  // Check parameters keys
  const requiredParamKeys = ["name", "flag", "type", "required"];

  const hasValidParams = json.parameters.every((param: ConfigParameter) => {
    if (typeof param !== "object" || !param) return false;
    // Check required keys exist
    for (const key of requiredParamKeys) {
      if (!(key in param)) return false;
    }
    return true;
  });

  return hasValidParams;
}

const validateFormats = (formatsArr: IOFormat[]): boolean => {
  return formatsArr.every((fmt) => {
    if (typeof fmt !== "object" || !fmt.formats) return false;
    const f = fmt.formats;

    // Validate width / height if provided
    if (typeof f.width === "number") {
      if (f.width < 32 || f.width > 16384) return false;
    }
    if (typeof f.height === "number") {
      if (f.height < 32 || f.height > 8704) return false;
    }

    // Validate frame rate if provided
    if (typeof f.frameRate === "string") {
      if (!ALLOWED_FRAME_RATES.includes(f.frameRate as FrameRate)) return false;
    }

    return true;
  });
};
