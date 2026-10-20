import type { PartConfig } from "./Part";
import { Part, PartMap } from "./Part";
import {
  FileWriteMode,
  FileWriter,
  type FileLineCount,
  type Formatter,
  type WriteMetrics,
} from "./utils/FileWriter";
import type { Resource } from "./Resource";

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
   * `prettierFormatter(prettier)`. Files are written as generated when omitted.
   */
  format?: Formatter;
};

export type GenerateOptions = {
  /**
   * Write nothing, and throw if any file would be created, updated or
   * removed. Use it in CI to check generated code is up to date.
   */
  check?: boolean;
};

/** What was staged per write mode, then what actually changed on disk. */
function formatSummary(stats: WriteMetrics) {
  const { initialise, write, total } = stats.attempted;
  const initialised = stats.changed.filter(
    ({ mode }) => mode === FileWriteMode.initialise,
  ).length;
  const count = ({ files, lines }: FileLineCount) =>
    `${String(files).padStart(4)} files, ${lines} lines`;
  return [
    `  Initialise: ${count(initialise)} (${initialised} created, ${initialise.files - initialised} already exist)`,
    `  Write:      ${count(write)}`,
    `  Total:      ${count(total)}`,
    `  Changes:    ${stats.created} created, ${stats.updated} updated, ${stats.removed} removed, ${stats.unchanged} unchanged (${stats.linesInChanges} lines in changes)`,
  ].join("\n");
}

export class Config<Environment extends string> {
  configProps: ConfigProps<Environment>;
  constructor(configProps: ConfigProps<Environment>) {
    this.configProps = configProps;
  }
  async generate({ check = false }: GenerateOptions = {}): Promise<WriteMetrics> {
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
      part.ownGenerated();
    }

    const stats = await fileWriter.applyChanges(this.configProps.format, { check });
    const summary = formatSummary(stats);

    if (check) {
      if (stats.changed.length > 0) {
        const files = stats.changed
          .map(({ action, file }) => `  ${action} ${file}`)
          .join("\n");
        throw new Error(
          `Generated code is out of date:\n${summary}\n${files}\nRun generate to update it.`,
        );
      }
      console.log(`Generated code is up to date.\n${summary}`);
    } else {
      console.log(`Success!\n${summary}`);
    }
    return stats;
  }
}
