import { FileWriteMode, FileWriter } from "codegen-engine";
import {
  apiResource,
  EndpointSchema,
  EndpointShared,
} from "@resources/api";
import { Module } from "codegen-engine";
import type {
  EnvironmentConfig,
  SchemaIngester,
  SchemaIngesterContext,
} from "codegen-engine";
import type { Environment } from "@config";
import { Language } from "codegen-engine";
import tsClient from "./generated/clients/[name].ts.t";
import pyClient from "./generated/clients/[name].py.t";
import clientClasses from "./generated/clientClasses.ts.t";
import clientTypesAndErrors from "./generated/clientTypesAndErrors.ts.t";
import tsOrigin from "./generated/origin.ts.t";
import pyOrigin from "./generated/origin.py.t";

export class RequestsIngester implements SchemaIngester<EndpointSchema> {
  language: Language;
  fileWriter: FileWriter;
  environments: EnvironmentConfig<Environment>;
  shared: Record<Environment, EndpointShared>;
  names: string[] = [];

  constructor({
    language,
    generatedFileWriter,
    environments,
    shared,
  }: SchemaIngesterContext<EndpointShared, Environment>) {
    this.language = language;
    this.fileWriter = generatedFileWriter;
    this.environments = environments;
    this.shared = shared;
  }

  ingest(endpoint: EndpointSchema) {
    this.names.push(endpoint.name);
    if (this.language === "ts") {
      this.fileWriter.stageFileChange(
        `clients/${endpoint.name}.ts`,
        FileWriteMode.write,
        tsClient(endpoint),
      );
    }
    if (this.language === "py") {
      this.fileWriter.stageFileChange(
        `clients/${endpoint.name}.py`,
        FileWriteMode.write,
        pyClient(endpoint),
      );
    }
  }

  stageChanges() {
    if (this.language === "ts") {
      this.fileWriter.stageFileChange(
        "clientClasses.ts",
        FileWriteMode.write,
        clientClasses(this.names),
      );
      this.fileWriter.stageFileChange(
        "clientTypesAndErrors.ts",
        FileWriteMode.write,
        clientTypesAndErrors(this.names),
      );
      this.fileWriter.stageFileChange(
        "origin.ts",
        FileWriteMode.write,
        tsOrigin(this.environments, this.shared),
      );
    }
    if (this.language === "py") {
      this.fileWriter.stageFileChange(
        "origin.py",
        FileWriteMode.write,
        pyOrigin(this.environments, this.shared),
      );
    }
  }
}

export const Requests = new Module<Environment>("Requests").uses(
  apiResource,
  (context) => new RequestsIngester(context),
);
