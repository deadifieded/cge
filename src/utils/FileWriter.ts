import { readFileSync, mkdirSync, existsSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";

type WriteMetrics = {
  filesInChanges: number;
  linesInChanges: number;
}

/**
 * Formats a file's content before it is written. Return the content unchanged
 * for files it doesn't know how to format.
 */
export type Formatter = (
  content: string,
  filePath: string,
) => string | Promise<string>;

/** The parts of the `prettier` module `prettierFormatter` needs. */
export type PrettierLike = {
  resolveConfig(filePath: string): Promise<object | null>;
  getFileInfo(filePath: string): Promise<{ inferredParser: string | null }>;
  format(source: string, options: object): Promise<string>;
};

/**
 * Formats with prettier, using the `.prettierrc` that applies to each file and
 * skipping files prettier has no parser for.
 * Usage: `format: prettierFormatter(await import("prettier"))`.
 */
export function prettierFormatter(prettier: PrettierLike): Formatter {
  return async (content, filePath) => {
    if (!(await prettier.getFileInfo(filePath)).inferredParser) return content;
    const config = await prettier.resolveConfig(filePath);
    return prettier.format(content, { ...config, filepath: filePath });
  };
}

export class FileReader {
  protected root: string;
  constructor(root: string) {
    this.root = root;
    
  }

  readFile(filePath: string) {
    return readFileSync(join(this.root, filePath), "utf-8");
  }
}

export enum FileWriteMode {
  initialise = "initialise",
  write = "write",
  append = "append",
}

type fileChange = { mode: FileWriteMode; content: string };

type ChangeMap = {
  [filePath: string]: fileChange;
};



export class FileWriter extends FileReader {
  private changes: ChangeMap = {};

  constructor(root: string) {
    super(root);
    this.changes = {};
  }

  stageFileChange(relative_file: string, mode: FileWriteMode, content: string) {
    const file = relative_file;

    if (!this.changes[file]) {
      this.changes[file] = { mode, content };
    } else if (
      mode === FileWriteMode.append &&
      this.changes[file].mode === FileWriteMode.append
    ) {
      this.changes[file].content += "\n" + content;
    } else {
      throw `File ${file} has already been staged for changes.`;
    }
  }

  async applyChanges(format?: Formatter): Promise<WriteMetrics> {
    const nofFiles = Object.keys(this.changes).length;
    let nofLines = 0

    for (const [file, change] of Object.entries(this.changes)) {
      const fullPath = join(this.root, file);
      
      if (change === undefined) {
        throw `Change for file ${fullPath} is undefined. This should not happen.`;
      }
      let content = change.content || "";

      if (format) {
        try {
          content = await format(content, fullPath);
        } catch (err) {
          console.warn(
            `Could not format ${fullPath}, writing raw content instead.`,
            err,
          );
        }
      }
      nofLines += Array.from(content.matchAll(/\n/g)).length;
      // Ensure directory exists and write
      mkdirSync(dirname(fullPath), { recursive: true });

      if (
        change.mode === FileWriteMode.write ||
        change.mode === FileWriteMode.append ||
        (change.mode === FileWriteMode.initialise && !existsSync(fullPath) && !existsSync(fullPath.split(".").slice(0, -1).join(".")))
      ) {
        writeFileSync(fullPath, content);
      }
    }
    this.changes = {};
    return {
      filesInChanges: nofFiles,
      linesInChanges: nofLines,
    };
  }

  getScope(relativeRoot: string): Scope {
    return new Scope(this, relativeRoot);
  }

  clear(path: string) {
    const fullPath = join(this.root, path);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

export class Scope extends FileWriter {
  fileWriter: FileWriter;
  constructor(fileWriter: FileWriter, relativeRoot: string) {
    if (fileWriter instanceof Scope) {
      super(join(fileWriter.root, relativeRoot));
      this.fileWriter = fileWriter.fileWriter;
    } else {
      super(relativeRoot);
      this.fileWriter = fileWriter;
    }
  }

  stageFileChange(relative_file: string, mode: FileWriteMode, content: string) {
    this.fileWriter.stageFileChange(
      join(this.root, relative_file),
      mode,
      content,
    );
  }

  readFile(filePath: string): string {
    return this.fileWriter.readFile(join(this.root, filePath));
  }

  async applyChanges(format?: Formatter): Promise<WriteMetrics> {
    throw "Cannot apply changes from a Scope. Call applyChanges on the parent FileWriter instead.";
  }

  clear(path: string) {
    this.fileWriter.clear(join(this.root, path));
  }
}
