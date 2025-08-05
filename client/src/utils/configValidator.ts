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
  } catch (error) {
    console.error("Failed to read or parse config file:", error);
    throw new Error("Invalid or unreadable JSON in config file.");
  }

  // Check required fields
  const hasName = typeof json.name === "string";
  const hasExecutable = typeof json.executable === "string";
  const hasInputFormat = Array.isArray(json.input_formats);
  const hasOutputFormat = Array.isArray(json.output_formats);
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
