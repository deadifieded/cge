import type { EndpointSchema } from "@resources/api";
import { ClassDiagram } from "../../classes";

/** Every endpoint the provider exposes, linked to its own diagram. */
export default function render(
  provider: string,
  endpoints: EndpointSchema[],
): string {
  const diagram = new ClassDiagram();
  for (const endpoint of endpoints) {
    diagram.addClass(endpoint.name, [
      `+method ${endpoint.method}`,
      `+route ${endpoint.route}`,
    ]);
  }
  return [
    `# ${provider} endpoints`,
    "",
    "```mermaid",
    diagram.render(),
    "```",
    "",
    ...endpoints.map(({ name }) => `- [${name}](./${name}.md)`),
    "",
  ].join("\n");
}
