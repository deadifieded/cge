import type { Environment } from "@config";
import { apiResource, EndpointSchema, EndpointShared } from "@resources/api";
import { Module, SchemaIngester, SchemaIngesterContext, Language, FileWriteMode, FileWriter } from "codegen-engine";
import handler from "./src/handlers/[name].py.t";
import handlersInit from "./src/handlers/__init__.py.t";
import lifespan from "./src/lifespan.py.t";
import configInit from "./src/config/__init__.py.t";
import generatedInit from "./generated/__init__.py.t";
import mainFastApi from "./generated/mainFastApi.py.t";
import commonInit from "./generated/FastApiCommon/__init__.py.t";
import baseAppError from "./generated/FastApiCommon/baseAppError.py.t";
import endpointCommon from "./generated/FastApiCommon/[name].py.t";

export class FastApiIngester implements SchemaIngester<EndpointSchema> {
  language: Language;
  srcFileWriter: FileWriter;
  generatedFileWriter: FileWriter;
  endpoints: EndpointSchema[] = [];

  constructor({
    language,
    srcFileWriter,
    generatedFileWriter,
  }: SchemaIngesterContext<EndpointShared, Environment>) {
    this.language = language;
    this.srcFileWriter = srcFileWriter;
    this.generatedFileWriter = generatedFileWriter;
  }

  ingest(endpoint: EndpointSchema) {
    if (this.language !== "py") return;
    this.endpoints.push(endpoint);
    this.srcFileWriter.stageFileChange(
      `handlers/${endpoint.name}.py`,
      FileWriteMode.initialise,
      handler(endpoint),
    );
    this.generatedFileWriter.stageFileChange(
      `FastApiCommon/${endpoint.name}.py`,
      FileWriteMode.write,
      endpointCommon(endpoint),
    );
  }

  stageChanges() {
    if (this.language !== "py") return;
    this.generatedFileWriter.stageFileChange(
      "__init__.py",
      FileWriteMode.initialise,
      generatedInit(),
    );
    this.generatedFileWriter.stageFileChange(
      "mainFastApi.py",
      FileWriteMode.write,
      mainFastApi(this.endpoints),
    );
    this.generatedFileWriter.stageFileChange(
      "FastApiCommon/__init__.py",
      FileWriteMode.write,
      commonInit(),
    );
    this.generatedFileWriter.stageFileChange(
      "FastApiCommon/baseAppError.py",
      FileWriteMode.write,
      baseAppError(),
    );
    this.srcFileWriter.stageFileChange(
      "lifespan.py",
      FileWriteMode.initialise,
      lifespan(),
    );
    this.srcFileWriter.stageFileChange(
      "config/__init__.py",
      FileWriteMode.initialise,
      configInit(),
    );
    this.srcFileWriter.stageFileChange(
      "handlers/__init__.py",
      FileWriteMode.initialise,
      handlersInit(),
    );
  }
}

export const FastApi = new Module<Environment>("FastApi").provides(
  apiResource,
  (context) => new FastApiIngester(context),
);
