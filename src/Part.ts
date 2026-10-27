import type { Resource } from "./Resource";
import type { Module } from "./Module";
import { Language } from "./utils/Language";
import { FileWriteMode, FileWriter } from "./utils/FileWriter";
import type {
  EnvironmentConfig,
  ResourceEntry,
  ResourceSchema,
  SchemaIngester,
} from "./types";
import tsConstants from "./part/generated/constants.ts.t";
import pyConstants from "./part/generated/constants.py.t";

const constants: Record<Language, <Environment extends string>(environments: EnvironmentConfig<Environment>) => string> =
  { ts: tsConstants, py: pyConstants };

export type PartMap<Environment extends string> = Record<string, Part<Environment>>;

export type PartConfig<Environment extends string> = {
  name: string;
  path: string;
  src: string;
  language: Language;
  modules?: Module<Environment>[];
  /** Parts that use every resource this part provides, on top of each schema's `users`. */
  users?: string[];
};

export class Part<Environment extends string> {
  srcFileWriter: FileWriter;
  generatedFileWriter: FileWriter;
  config: PartConfig<Environment>;
  environments: EnvironmentConfig<Environment>;
  entries = new Map<Resource<any, any, Environment>, ResourceEntry<any, any, Environment>>();

  constructor(
    fileWriter: FileWriter,
    environments: EnvironmentConfig<Environment>,
    config: PartConfig<Environment>,
    resources: Iterable<Resource<any, any, Environment>>,
  ) {
    this.config = config;
    this.environments = environments;
    this.srcFileWriter = fileWriter.getScope(config.src);
    this.generatedFileWriter = this.srcFileWriter.getScope("generated");

    for (const resource of resources) {
      this.entries.set(resource, loadPartResource(this, resource));
    }
  }

  getEntry<Schema, Shared>(
    resource: Resource<Schema, Shared, Environment>,
  ): ResourceEntry<Schema, Shared, Environment> {
    const entry = this.entries.get(resource);
    if (!entry) {
      throw new Error(
        `Part ${this.config.name} has no entry for resource ${resource.name}.`,
      );
    }
    return entry;
  }

  stageChanges(partMap: PartMap<Environment>) {
    if (this.config.language === "py") {
      this.generatedFileWriter.stageFileChange(
        "__init__.py",
        FileWriteMode.append,
        "",
      );
    }
    // Every part gets its own constants, whether or not a module needs them.
    this.generatedFileWriter.stageFileChange(
      `constants.${this.config.language}`,
      FileWriteMode.write,
      constants[this.config.language](this.environments),
    );
    for (const resource of this.entries.keys()) {
      stagePartResourceChanges(this, partMap, resource);
    }
  }

  /** Marks `generated/` as fully generated, so files no module wrote are removed. */
  ownGenerated() {
    this.srcFileWriter.own("generated");
  }
}

/** Builds the part's entry for `resource`: what it provides, and which of its modules handle it. */
function loadPartResource<Schema extends ResourceSchema, Shared, Environment extends string>(
  part: Part<Environment>,
  resource: Resource<Schema, Shared, Environment>,
  
): ResourceEntry<Schema, Shared, Environment> {
  const entry: ResourceEntry<Schema, Shared, Environment> = {
    schemas: [],
    shared: undefined,
    providerFactories: [],
    userFactories: [],
  };
  for (const module of part.config.modules ?? []) {
    for (const { resource: r, factory } of module.providerFactories) {
      if (r === resource) entry.providerFactories.push({ module, factory });
    }
    for (const { resource: r, factory } of module.userFactories) {
      if (r === resource) entry.userFactories.push({ module, factory });
    }
  }

  const partResourceConfig = resource.getSchemasAndShared(
    part.srcFileWriter,
    part.config.name,
  );
  if (!partResourceConfig) return entry;

  // The schemas are type-checked today, but this guards configs read from files.
  const missing = part.environments.names.filter(
    (name) => !(name in partResourceConfig.shared),
  );
  if (missing.length > 0) {
    throw new Error(
      `Part ${part.config.name} has no "shared" entry for resource ${resource.name} in: ${missing.join(", ")}.`,
    );
  }
  entry.shared = partResourceConfig.shared;
  entry.schemas = partResourceConfig.schemas.sort((a, b) => a.name.localeCompare(b.name));
  return entry;
}

function stagePartResourceChanges<Schema, Shared, Environment extends string>(
  part: Part<Environment>,
  partMap: PartMap<Environment>,
  resource: Resource<Schema, Shared, Environment>,
) {
  const entry = part.getEntry(resource);
  const shared = entry.shared;
  if (!shared || entry.schemas.length === 0) return;

  const providerIngesters = entry.providerFactories.map(({ module, factory }) =>
    factory({
      srcFileWriter: part.srcFileWriter,
      generatedFileWriter: part.generatedFileWriter.getScope(module.name),
      language: part.config.language,
      environments: part.environments,
      shared,
      provider: part.config.name,
    }),
  );

  const userIngesters: Record<string, SchemaIngester<Schema>[]> = {};
  const getUserIngesters = (userName: string) => {
    const existing = userIngesters[userName];
    if (existing) return existing;
    const userPart = partMap[userName];
    if (!userPart) {
      throw new Error(
        `Part ${part.config.name}'s ${resource.name} is used by part ${userName}, which isn't in the config.`,
      );
    }
    const { userFactories } = userPart.getEntry(resource);
    if (userFactories.length === 0) {
      console.warn(
        `Part ${userName} uses ${part.config.name}'s ${resource.name} schemas but has no module that uses ${resource.name}, so nothing is generated for it.`,
      );
    }
    return (userIngesters[userName] = userFactories.map(({ module, factory }) =>
        factory({
          srcFileWriter: userPart.srcFileWriter,
          generatedFileWriter: userPart.generatedFileWriter.getScope(
            "extern/" + part.config.name + "/" + module.name,
          ),
          language: userPart.config.language,
          environments: userPart.environments,
          shared,
          provider: part.config.name,
        }),
      ));
  };

  const defaultUsers = part.config.users ?? [];
  for (const schema of entry.schemas) {
    const duplicate = schema.users.find((user) => defaultUsers.includes(user));
    if (duplicate) {
      throw new Error(
        `${resource.name} "${schema.name}" of part ${part.config.name} lists ${duplicate} in users, but ${duplicate} is already a default user of ${part.config.name}.`,
      );
    }
    providerIngesters.forEach((ingester) => ingester.ingest(schema));
    for (const userName of [...defaultUsers, ...schema.users]) {
      getUserIngesters(userName).forEach((ingester) => ingester.ingest(schema));
    }
  }

  const stage = (ingester: SchemaIngester<Schema>) => ingester.stageChanges?.();
  providerIngesters.forEach(stage);
  Object.values(userIngesters).forEach((ingesters) => ingesters.forEach(stage));
}
