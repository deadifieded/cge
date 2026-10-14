import type { EnvironmentConfig } from "../../types";
import { CodeHolder } from "@utils/codegen";

/**
 * `process.env.<variable>` is written out literally because Next.js only
 * inlines `NEXT_PUBLIC_*` variables accessed that way.
 */
export default function render<Environment extends string>(environments: EnvironmentConfig<Environment>): string {
  const { names, variable } = environments;
  return new CodeHolder("ts")
    .line(`export const ENVIRONMENTS = ${JSON.stringify(names)} as const;`)
    .line("export type Environment = (typeof ENVIRONMENTS)[number];")
    .line()
    .block(
      "function isEnvironment(value: string): value is Environment",
      new CodeHolder("ts").append(
        "return (ENVIRONMENTS as readonly string[]).includes(value);",
      ),
    )
    .line()
    .line(
      `const environment = process.env.${variable} || ${JSON.stringify(environments.default)};`,
    )
    .block(
      "if (!isEnvironment(environment))",
      new CodeHolder("ts").append(
        `throw new Error(\`${variable} is "\${environment}", expected one of: ${names.join(", ")}.\`);`,
      ),
    )
    .line("export const ENVIRONMENT: Environment = environment;").code;
}
