import type { EndpointSchema } from "@resources/api";
import { buildClientModel } from "../../clientModel";

export default function render(endpoint: EndpointSchema): string {
  return buildClientModel(endpoint).getCodeWithImports("ts");
}
