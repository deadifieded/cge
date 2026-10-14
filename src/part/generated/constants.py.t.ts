import type { EnvironmentConfig } from "../../types";
import { CodeHolder } from "@utils/codegen";

export default function render<Environment extends string>(environments: EnvironmentConfig<Environment>): string {
  const { names, variable } = environments;
  const literals = names.map((name) => JSON.stringify(name)).join(", ");
  return new CodeHolder("py")
    .append("import os")
    .line("from typing import Literal")
    .line()
    .line(`Environment = Literal[${literals}]`)
    .line(`ENVIRONMENTS: tuple[Environment, ...] = (${literals}${names.length === 1 ? "," : ""})`)
    .line()
    .line(
      `_environment = os.environ.get(${JSON.stringify(variable)}) or ${JSON.stringify(environments.default)}`,
    )
    .block(
      "if _environment not in ENVIRONMENTS",
      new CodeHolder("py").append(
        `raise ValueError(f"${variable} is '{_environment}', expected one of: ${names.join(", ")}.")`,
      ),
    )
    .line("ENVIRONMENT: Environment = _environment").code;
}
