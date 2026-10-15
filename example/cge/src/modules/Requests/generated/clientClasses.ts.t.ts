export default function render(names: string[]): string {
  return names
    .map((name) => `export { ${name} } from './clients/${name}';`)
    .join("\n");
}
