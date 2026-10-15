import type { MemberValue } from "codegen-engine";

type DiagramClass = { name: string; members: string[] };

/** The class an object type hangs off, and whether it holds many of them. */
type Parent = { name: string; field: string; many?: boolean };

/**
 * Builds a Mermaid `classDiagram`. Member text avoids `|` and `<>`, which
 * Mermaid's class parser misreads; optional and nullable types get a `?`.
 */
export class ClassDiagram {
  classes: DiagramClass[] = [];
  relations: string[] = [];

  addClass(name: string, members: string[] = []) {
    this.classes.push({ name, members });
  }

  /**
   * Returns the member type for `value`. Object types become classes named
   * `className` (array elements get an `_item` suffix), linked to `parent`
   * by composition under `field`.
   */
  typeOf(
    value: MemberValue,
    className: string,
    parent?: Parent,
  ): string {
    if (typeof value === "string") {
      const [base, ...rest] = value.split(" | ");
      return base + (rest.length > 0 ? "?" : "");
    }
    if (Array.isArray(value)) {
      const [element, optionality] = value;
      if (element === undefined) {
        throw new Error(`Empty array type in ${className}.`);
      }
      const elementType = this.typeOf(
        element,
        className + "_item",
        parent && { ...parent, many: true },
      );
      return elementType + "[]" + (optionality ? "?" : "");
    }

    const members = Object.entries(value)
      .filter(([key]) => key !== "__or__")
      .map(
        ([key, member]) =>
          `+${this.typeOf(member as MemberValue, className + "_" + key, { name: className, field: key })} ${key}`,
      );
    this.addClass(className, members);
    if (parent) {
      const many = parent.many ? ` "*"` : "";
      this.relations.push(
        `${parent.name} *--${many} ${className} : ${parent.field}`,
      );
    }
    return className + (value.__or__ ? "?" : "");
  }

  render(): string {
    const lines = ["classDiagram"];
    for (const { name, members } of this.classes) {
      if (members.length === 0) {
        lines.push(`  class ${name}`);
        continue;
      }
      lines.push(`  class ${name} {`);
      members.forEach((member) => lines.push(`    ${member}`));
      lines.push("  }");
    }
    this.relations.forEach((relation) => lines.push(`  ${relation}`));
    return lines.join("\n");
  }
}
