export function pythonModule(file: string[]): string {
  return file
    .map((part) =>
      part
        .split("/")
        .filter((s) => s != "")
        .join("."),
    )
    .join(".");
}
