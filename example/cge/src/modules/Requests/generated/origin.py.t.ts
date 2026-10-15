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
  return new CodeHolder("py")
    .append("from generated.constants import ENVIRONMENT, Environment")
    .line()
    .line(
      `ORIGINS: dict[Environment, str] = ${JSON.stringify(getOrigins(environments, shared))}`,
    )
    .line("ORIGIN = ORIGINS[ENVIRONMENT]").code;
}
