export function stringSanitizer(rawName: string): string {
  // Replace all non-alphanumeric characters with space
  let cleaned = rawName.replace(/[^a-zA-Z0-9]+/g, " ");
  // Replace multiple spaces with a single space
  cleaned = cleaned.replace(/\s+/g, " ");
  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();
  // Capitalize each word
  cleaned = cleaned.replace(/\b\w/g, (char) => char.toUpperCase());

  return cleaned;
}

export function isFrameworkHandledParameter(parameter: string): boolean {
  return parameter === "input" || parameter === "output";
}
