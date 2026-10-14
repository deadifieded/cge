import type { Resource } from "./Resource";
import type { SchemaIngesterFactory } from "./types";

export type ModuleIngesterFactory<Schema, Shared, Environment extends string> = {
  resource: Resource<Schema, Shared, Environment>;
  factory: SchemaIngesterFactory<Schema, Shared, Environment>;
};

/**
 * A code generator. `provides` and `uses` register a factory per resource;
 * each part builds its own ingesters from them, so no state is shared between
 * parts.
 */
export class Module<Environment extends string> {
  name: string;
  providerFactories: ModuleIngesterFactory<any, any, Environment>[] = [];
  userFactories: ModuleIngesterFactory<any, any, Environment>[] = [];

  constructor(name: string) {
    this.name = name;
  }

  /** Generates code in the part that provides `resource`. */
  provides<Schema, Shared>(
    resource: Resource<Schema, Shared, Environment>,
    factory: SchemaIngesterFactory<Schema, Shared, Environment>,
  ) {
    this.providerFactories.push({ resource, factory });
    return this;
  }

  /** Generates code in each part listed in a schema's `users`. */
  uses<Schema, Shared>(
    resource: Resource<Schema, Shared, Environment>,
    factory: SchemaIngesterFactory<Schema, Shared, Environment>,
  ) {
    this.userFactories.push({ resource, factory });
    return this;
  }

  get resources(): Resource<any, any, Environment>[] {
    return [...this.providerFactories, ...this.userFactories].map(
      ({ resource }) => resource,
    );
  }
}
