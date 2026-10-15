import type { Environment } from "@config";
import type { EndpointShared } from "@resources/api";
import type { EnvironmentConfig } from "codegen-engine";
import { CodeHolder } from "codegen-engine";
import { getOrigins } from "../origins";

/** The provider's origin in the environment the part's `constants` picked. */
export default function render(
  environments: EnvironmentConfig<Environment>,
  shared: Record<Environment, EndpointShared>,
): string {
  return new CodeHolder("ts")
    .append(
      'import { ENVIRONMENT, type Environment } from "../../../constants";',
    )
    .line()
    .line(
      `export const ORIGINS: Record<Environment, string> = ${JSON.stringify(getOrigins(environments, shared))};`,
    )
    .line("export const ORIGIN = ORIGINS[ENVIRONMENT];").code;
}
