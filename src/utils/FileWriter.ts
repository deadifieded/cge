import { readFileSync, mkdirSync, existsSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import * as prettier from "prettier"; // Import the Prettier API

type WriteMetrics = {
  filesInChanges: number;
  linesInChanges: number;
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

  async applyChanges(format: boolean = true): Promise<WriteMetrics> {
    // 1. Fetch your project's .prettierrc configuration if it exists
    const prettierConfig = await prettier.resolveConfig(process.cwd());
    const nofFiles = Object.keys(this.changes).length;
    let nofLines = 0

    for (const [file, change] of Object.entries(this.changes)) {
      const fullPath = join(this.root, file);
      nofLines += Array.from(change.content.matchAll(/\n/g)).length;
      if (change === undefined) {
        throw `Change for file ${fullPath} is undefined. This should not happen.`;
      }
      let content = change.content || "";

      if (format && (await prettier.getFileInfo(fullPath)).inferredParser) {
        // 2. Format the content before writing
        try {
          content = await prettier.format(content, {
            ...prettierConfig,
            filepath: fullPath, // Automatically infers the correct parser (TS, JS, etc.)
          });
        } catch (err) {
          console.warn(
            `Could not format ${fullPath}, writing raw content instead.`,
            err,
          );
        }
      }
      // 3. Ensure directory exists and write
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

  async applyChanges(format: boolean = true): Promise<WriteMetrics> {
    throw "Cannot apply changes from a Scope. Call applyChanges on the parent FileWriter instead.";
  }

  clear(path: string) {
    this.fileWriter.clear(join(this.root, path));
  }
}
