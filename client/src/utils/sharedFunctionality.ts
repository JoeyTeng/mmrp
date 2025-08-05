export function isFrameworkHandledParameter(parameter: string): boolean {
  return parameter === "input" || parameter === "output";
}
