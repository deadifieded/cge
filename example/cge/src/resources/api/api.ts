import type { Environment } from "@config";
import { endpoints as endpointConfigs } from "@schemas/endpoints";
import { EndpointSchema, EndpointShared } from "./types";
import { Resource } from "codegen-engine";

export const apiResource = new Resource<EndpointSchema, EndpointShared, Environment>(
  "api",
  (partFileReader, partName) =>
    endpointConfigs.find((config) => config.provider === partName),
);
