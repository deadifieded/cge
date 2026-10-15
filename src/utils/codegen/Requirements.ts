import { Language } from "../Language";
export type CodeRequirements = { [key in Language]: Requirements };

export function newCodeRequirements(): CodeRequirements {
  return {
    py: new Requirements(),
    ts: new Requirements(),
  };
}

export class Requirements {
  requirements: Map<string, string>;

  constructor(requirements: { [name: string]: string } = {}) {
    this.requirements = new Map<string, string>(Object.entries(requirements));
  }

  addRequirement(name: string, from: string) {
    if (this.requirements.has(name) && this.requirements.get(name) !== from) {
      throw `Requirement ${name} already exists from ${this.requirements.get(name)}, cannot add from ${from}`;
    }
    this.requirements.set(name, from);
  }

  mergeRequirements(other: Requirements) {
    for (const [name, from] of other.requirements.entries()) {
      this.addRequirement(name, from);
    }
  }

  private getGroupedByProvider() {
    const grouped_by_provider: { [key: string]: string[] } = {};
    for (const [name, from] of this.requirements.entries()) {
      if (!grouped_by_provider[from]) {
        grouped_by_provider[from] = [];
      }
      grouped_by_provider[from].push(name);
    }
    return grouped_by_provider;
  }

  getImportStatements(language: string) {
    switch (language) {
      case "py":
        return this.getPyImportStatements();
      case "ts":
        return this.getTsImportStatements();
      default:
        throw `Unsupported language for import statement generation: ${language}. Code may not be generated correctly.\n`;
    }
  }

  getPyImportStatements() {
    const grouped_by_provider = this.getGroupedByProvider();

    let importStatements = "";
    for (const [from, names] of Object.entries(grouped_by_provider).sort(
      ([fromA], [fromB]) => {
        if (fromA === "__future__") return -1;
        if (fromB === "__future__") return 1;
        return fromA.localeCompare(fromB);
      },
    )) {
      importStatements += `from ${from} import ${names.join(", ")}\n`;
    }
    return importStatements;
  }

  getTsImportStatements() {
    const grouped_by_provider = this.getGroupedByProvider();
    let importStatements = "";
    for (const [from, names] of Object.entries(grouped_by_provider).sort(
      ([fromA], [fromB]) => fromA.localeCompare(fromB),
    )) {
      const normalNames = names
        .filter((name) => name.trim()[0] !== "{")
        .join(", ");
      let bracketNames = names
        .filter((name) => name.trim()[0] === "{")
        .map((name) => name.replace(/[{}]/g, "").trim())
        .join(", ");
      if (bracketNames) bracketNames = `{ ${bracketNames} }`;
      importStatements += `import ${[normalNames, bracketNames]
        .filter(Boolean)
        .join(", ")}from "${from}";\n`;
    }
    return importStatements;
  }
}
