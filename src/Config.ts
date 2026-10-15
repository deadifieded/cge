import type { PartConfig } from "./Part";
import { Part, PartMap } from "./Part";
import { FileWriter, type Formatter } from "@utils/FileWriter";
import type { Resource } from "./Resource";

/**
 * Every environment generated code can run in. `shared` in `schemas/` is
 * keyed by these names, so adding one here makes typecheck point at every
 * schema that needs an entry for it.
 */
export const environments = ["development", "staging", "production"] as const;
export type Environment = (typeof environments)[number];

export type PartConfigInput<Environment extends string> = PartConfig<Environment> & {
  /**
   * The environment variable the part's generated code reads at runtime.
   * Defaults to `Config.environmentVariable`.
   */
  environmentVariable?: string;
  /** The environment used when `environmentVariable` is unset. */
  defaultEnvironment?: Environment;
};

export type ConfigProps<Environment extends string> = {
  root: string;
  environments: readonly Environment[];
  defaultEnvironment: Environment;
  /** The environment variable parts read unless they set their own. */
  environmentVariable: string;
  parts: PartConfigInput<Environment>[];
  /**
   * Formats every generated file before it is written, e.g.
   * `prettierFormatter(await import("prettier"))`. Pass `(content) => content`
   * to write files as generated.
   */
  format: Formatter;
};

export class Config<Environment extends string> {
  configProps: ConfigProps<Environment>;
  constructor(configProps: ConfigProps<Environment>) {
    this.configProps = configProps;
  }
  async generate() {
    const fileWriter = new FileWriter(this.configProps.root);

    const resources = new Set<Resource<any, any, Environment>>(
      this.configProps.parts.flatMap((part) =>
        (part.modules ?? []).flatMap((module) => module.resources),
      ),
    );

    const parts: PartMap<Environment> = {};
    for (const {
      environmentVariable,
      defaultEnvironment,
      ...partConfig
    } of this.configProps.parts) {
      if (parts[partConfig.name]) {
        throw new Error(`Part with name ${partConfig.name} already exists.`);
      }
      parts[partConfig.name] = new Part(
        fileWriter.getScope(partConfig.path),
        {
          names: this.configProps.environments,
          variable: environmentVariable ?? this.configProps.environmentVariable,
          default: defaultEnvironment ?? this.configProps.defaultEnvironment,
        },
        partConfig,
        resources,
      );
    }

    for (const part of Object.values(parts)) {
      part.stageChanges(parts);
    }
    for (const part of Object.values(parts)) {
      part.clearGenerated();
    }

    try {
      const stats = await fileWriter.applyChanges(this.configProps.format);
      console.log(`Success!\nFiles in changes: ${stats.filesInChanges}, Lines in changes: ${stats.linesInChanges}`);
    } catch (error) {
      throw error;
    }
  }
}
