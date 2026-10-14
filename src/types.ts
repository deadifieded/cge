import type { Module } from "./Module";
import { FileReader, FileWriter } from "@utils/FileWriter";
import { Language } from "@utils/Language";

export interface ResourceSchema {
  name: string;
  users: string[];
}

export type ResourceShared = any;

/** What a part provides for a resource, and the modules that handle it. */
export type ResourceEntry<Schema, Shared, Environment extends string> = {
  schemas: Array<Schema & ResourceSchema>;
  /** `undefined` when the part doesn't provide the resource. */
  shared: Record<Environment, Shared> | undefined;
  providerFactories: NamedSchemaIngesterFactory<Schema, Shared, Environment>[];
  userFactories: NamedSchemaIngesterFactory<Schema, Shared, Environment>[];
};

/** How a part picks its environment at runtime. */
export type EnvironmentConfig<Environment extends string> = {
  names: readonly Environment[];
  /** The environment variable the generated code reads. */
  variable: string;
  /** The environment used when `variable` is unset. */
  default: Environment;
};

/**
 * Everything an ingester gets when it is built. The file writers and
 * `language` belong to the part the ingester writes into; `shared` belongs to
 * the providing part.
 */
export type SchemaIngesterContext<Shared, Environment extends string> = {
  /** The name of the part that provides the resource. */
  provider: string;
  srcFileWriter: FileWriter;
  generatedFileWriter: FileWriter;
  language: Language;
  environments: EnvironmentConfig<Environment>;
  shared: Record<Environment, Shared>;
};

export type SchemaIngester<Schema> = {
  ingest: (schema: Schema) => void;
  /** Called once, after every schema has been ingested. */
  stageChanges?: () => void;
};

export type SchemaIngesterFactory<Schema, Shared, Environment extends string> = (
  context: SchemaIngesterContext<Shared, Environment>,
) => SchemaIngester<Schema>;

export type NamedSchemaIngesterFactory<Schema, Shared, Environment extends string> = {
  module: Module<Environment>;
  factory: SchemaIngesterFactory<Schema, Shared, Environment>;
};

export type PartResourceConfig<Schema, Shared, Environment extends string> = {
  schemas: Schema[];
  shared: Record<Environment, Shared>;
};

export type GetPartResourceConfig<Schema, Shared, Environment extends string> = (
  partFileReader: FileReader,
  partName: string,
) => PartResourceConfig<Schema, Shared, Environment> | undefined;

export type GlobalPartResourceConfig<Schema, Shared, Environment extends string> = {
  provider: string;
} & PartResourceConfig<Schema, Shared, Environment>;

export type GlobalPartResourceConfigs<Schema, Shared, Environment extends string> = GlobalPartResourceConfig<
  Schema,
  Shared,
  Environment
>[];
