import type { Environment } from "@config";
import type { EndpointShared } from "@resources/api";
import type { EnvironmentConfig } from "codegen-engine";

/** Maps each environment name to the provider's origin in it. */
export function getOrigins(
  environments: EnvironmentConfig<Environment>,
  shared: Record<Environment, EndpointShared>,
): Record<string, string> {
  return Object.fromEntries(
    environments.names.map((name) => [name, shared[name].origin]),
  );
}
