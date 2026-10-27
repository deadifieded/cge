import type { Environment } from "@config";
import { apis } from "@schemas/apis";
import { EndpointSchema, EndpointShared } from "./types";
import { Resource } from "codegen-engine";

export const apiResource = new Resource<EndpointSchema, EndpointShared, Environment>(
  "api",
  (partFileReader, partName) =>
    apis.find((config) => config.provider === partName),
);
