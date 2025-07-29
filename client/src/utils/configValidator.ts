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
  if (
    config.type !== "application/json" ||
    config.name !== "config.json" ||
    config.size === 0
  ) {
    return false;
  }
  // Check the content of the config file
  const text = await config.text();
  const json = JSON.parse(text);

  // Check required fields
  const hasName = typeof json.name === "string";
  const hasExecutable = typeof json.executable === "string";
  const hasParameters = Array.isArray(json.parameters);

  if (!hasName || !hasExecutable || !hasParameters) {
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
