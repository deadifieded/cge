import type { Environment } from "@config";
import { apiResource, EndpointSchema, EndpointShared } from "@resources/api";
import { Module } from "codegen-engine";
import type { SchemaIngester, SchemaIngesterContext } from "codegen-engine";
import { FileWriteMode, FileWriter } from "codegen-engine";
import endpointDiagram from "./generated/endpoints/[name].md.t";
import endpointIndex from "./generated/endpoints/index.md.t";

/**
 * Writes Mermaid class diagrams of a provider's endpoints. Output is
 * Markdown, so the part's `language` doesn't matter.
 */
export class UmlEndpointIngester implements SchemaIngester<EndpointSchema> {
  fileWriter: FileWriter;
  provider: string;
  endpoints: EndpointSchema[] = [];

  constructor({
    generatedFileWriter,
    provider,
  }: SchemaIngesterContext<EndpointShared, Environment>) {
    this.fileWriter = generatedFileWriter.getScope("endpoints");
    this.provider = provider;
  }

  ingest(endpoint: EndpointSchema) {
    this.endpoints.push(endpoint);
    this.fileWriter.stageFileChange(
      `${endpoint.name}.md`,
      FileWriteMode.write,
      endpointDiagram(endpoint),
    );
  }

  stageChanges() {
    this.fileWriter.stageFileChange(
      "index.md",
      FileWriteMode.write,
      endpointIndex(this.provider, this.endpoints),
    );
  }
}

export const Uml = new Module<Environment>("Uml").uses(
  apiResource,
  (context) => new UmlEndpointIngester(context),
);
