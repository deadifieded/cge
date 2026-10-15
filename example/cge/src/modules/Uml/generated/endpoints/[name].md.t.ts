import type { EndpointSchema } from "@resources/api";
import { ClassDiagram } from "../../classes";

/** The endpoint as a class, with its params, input and output types. */
export default function render(endpoint: EndpointSchema): string {
  const diagram = new ClassDiagram();
  const members = [`+method ${endpoint.method}`, `+route ${endpoint.route}`];
  const parts = [
    ["params", endpoint.params],
    ["input", endpoint.input],
    ["output", endpoint.output],
  ] as const;
  for (const [field, value] of parts) {
    if (value === undefined) continue;
    const type = diagram.typeOf(value, `${endpoint.name}_${field}`, {
      name: endpoint.name,
      field,
    });
    members.push(`+${type} ${field}`);
  }
  for (const error of endpoint.errors ?? []) {
    members.push(`+error ${error.code} ${error.statusCode}`);
  }
  // The endpoint class goes first so Mermaid lays it out at the top.
  diagram.classes.unshift({ name: endpoint.name, members });

  return [
    `# ${endpoint.name}`,
    "",
    "```mermaid",
    diagram.render(),
    "```",
    "",
  ].join("\n");
}
