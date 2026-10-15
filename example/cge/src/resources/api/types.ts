import type { Environment } from "@config";
import { Value, PrimitiveValue } from "codegen-engine";
import { ResourceSchema, GlobalPartResourceConfig, GlobalPartResourceConfigs } from "codegen-engine";

export type Error = {
  code: string;
  /** e.g. "UserNotFound" */
  name: string;
  statusCode: number;
  detail: string;
};

export type Method =
  "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

export type EndpointSchema = RouteSchema & {
  method: Method;
  input?: Value;
  output?: Value;
  errors?: Error[];
};

export type EndpointShared = RouteShared;

export type RouteSchema = ResourceSchema & {
  route: string;
  params?: { [key: string]: PrimitiveValue };
};

export type RouteShared = {
  origin: string;
};

export type PartEndpointConfig = GlobalPartResourceConfig<EndpointSchema, EndpointShared, Environment>

export type ProjectEndpoints = GlobalPartResourceConfigs<EndpointSchema, EndpointShared, Environment>;
