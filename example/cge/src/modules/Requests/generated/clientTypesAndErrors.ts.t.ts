export default function render(names: string[]): string {
  return names
    .map(
      (name) =>
        `export { type InputType as ${name}InputType, type OutputType as ${name}OutputType, ${name}Error } from './clients/${name}';`,
    )
    .join("\n");
}
