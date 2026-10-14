import type { GetPartResourceConfig } from "./types";

/** A kind of thing parts provide and use, such as API endpoints. */
export class Resource<Schema, Shared, Environment extends string> {
  name: string;
  getSchemasAndShared: GetPartResourceConfig<Schema, Shared, Environment>;

  constructor(
    name: string,
    getSchemasAndShared: GetPartResourceConfig<Schema, Shared, Environment>,
  ) {
    this.name = name;
    this.getSchemasAndShared = getSchemasAndShared;
  }
}
