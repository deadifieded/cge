export function indent(nofSpaces: number, str: string): string {
  const indentation = " ".repeat(nofSpaces);
  return str
    .split("\n")
    .map((line) => (line === "" ? line : indentation + line))
    .join("\n");
}
