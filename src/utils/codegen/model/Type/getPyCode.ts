import {
  CodeHolder,
  Requirements,
  MemberValue,
  PrimitiveMemberValue,
  pythonTypeMap,
  pythonMemberTypeMap,
  assertArrayIsValid,
  Value,
} from "../../index";
import { emitTypeTs } from "./getTsCode";
import { isStringObject } from "util/types";

export function getPyCode(
  definition: MemberValue,
  name: string,
  requirements: Requirements,
): string {
  let codeHolder = new CodeHolder("py");
  let namespaceCodeHolder = new CodeHolder("py");
  requirements.addRequirement("TypedDict", "typing");
  requirements.addRequirement("List", "typing");
  requirements.addRequirement("NotRequired", "typing");
  requirements.addRequirement("TypeAlias", "typing");
  requirements.addRequirement("EllipsisType", "types");
  requirements.addRequirement("annotations", "__future__");
  requirements.addRequirement("Optional", "typing");
  const flatName = appendTypePy(
    definition,
    name,
    codeHolder,
    namespaceCodeHolder,
  );
  // For primitive/array types a TypeAlias is still needed.
  // For object types the flat class definition IS the type - no alias required.
  if (flatName !== name) {
    codeHolder.line(name + ": TypeAlias = " + flatName);
  }
  // Append the namespace aliases after all flat definitions.
  if (namespaceCodeHolder.code.trim()) {
    codeHolder.line(namespaceCodeHolder);
  }
  return codeHolder.code;
}

function appendTypePy(
  definition: MemberValue,
  baseName: string,
  codeHolder: CodeHolder,
  namespaceCodeHolder: CodeHolder,
): string {
  if (!definition) {
    throw `External types cannot be emitted. Type definition is undefined.`;
  }
  if (typeof definition === "string") {
    let pythonType = pythonTypeMap?.[definition];
    if (pythonType) return pythonType;
    else
      throw `Unsupported type definition: ${definition} when emitting Python type. Only ${Object.keys(pythonTypeMap).join(", ")}, nested objects, and arrays are supported.`;
  } else if (Array.isArray(definition)) {
    assertArrayIsValid(definition);
    return (
      "List[ " +
      appendSubtypePy(
        definition[0] as Value,
        baseName + "_item",
        baseName + "_item",
        codeHolder,
        namespaceCodeHolder,
        2,
        false,
      ) +
      " ]" +
      (definition?.[1]
        ? " | " + pythonTypeMap?.[definition[1] as PrimitiveMemberValue]
        : "")
    );
  } else if (!isStringObject(definition)) {
    // Accumulate the flat class definition — appended AFTER subtypes so that
    // any nested TypedDicts it references are already defined above it.
    const flatClassHolder = new CodeHolder("py")
      .line(`class ${baseName}(TypedDict):`)
      .line('"""', 2)
      .line("```ts:", 2)
      .line(emitTypeTs(definition), 2)
      .line("```", 2)
      .line('"""', 2);

    namespaceCodeHolder
      .line(`class ${baseName}_:`)
      .line(`type_: TypeAlias = ${baseName}`, 2);

    for (const key in definition) {
      if (definition[key]) {
        const subtypeName = appendSubtypePy(
          definition[key],
          key + "_",
          baseName + "_" + key,
          codeHolder,
          namespaceCodeHolder,
          2,
        );
        flatClassHolder
          .line(key + ": " + subtypeName, 2)
          .line('"""', 2)
          .line("```ts:", 2)
          .line(emitTypeTs(definition[key]), 2)
          .line("```", 2)
          .line('"""', 2);
      }
    }
    if (definition.__or__) {
      flatClassHolder.line(" | " + definition.__or__, 2);
    }
    codeHolder.line(flatClassHolder.code);

    return baseName;
  }
  throw `Unsupported type definition: ${definition} when emitting Python type. Only ${Object.keys(pythonTypeMap).join(", ")}, nested objects, and arrays are supported.`;
}

function appendSubtypePy(
  definition: MemberValue,
  additional: string,
  total: string,
  codeHolder: CodeHolder,
  namespaceCodeHolder: CodeHolder,
  _indent: number,
  first_item: boolean = true,
): string {
  if (!definition) {
    throw `External types cannot be emitted. Type definition is undefined.`;
  }
  if (typeof definition === "string") {
    let pythonType = pythonMemberTypeMap?.[definition];
    if (pythonType) return pythonType;
    else
      throw `Unsupported type definition: ${definition} when emitting Python type. Only ${Object.keys(pythonMemberTypeMap).join(", ")}, nested objects, and arrays are supported.`;
  } else if (Array.isArray(definition)) {
    assertArrayIsValid(definition);
    return (
      "List[ " +
      appendSubtypePy(
        definition[0] as Value,
        additional + (first_item ? "item" : ""),
        total + (first_item ? "_item" : ""),
        codeHolder,
        namespaceCodeHolder,
        _indent,
        false,
      ) +
      " ]" +
      (definition?.[1]
        ? " | " + pythonTypeMap?.[definition[1] as PrimitiveMemberValue]
        : "")
    );
  } else if (!isStringObject(definition)) {
    // Accumulate the flat class definition — appended AFTER subtypes.
    const flatClassHolder = new CodeHolder("py")
      .line(`class ${total}(TypedDict):`)
      .line('"""', 2)
      .line("```ts:", 2)
      .line(emitTypeTs(definition), 2)
      .line("```", 2)
      .line('"""', 2);

    namespaceCodeHolder
      .line(`class ${additional}:`, _indent)
      .line(`type_: TypeAlias = ${total}`, _indent + 2);

    for (const key in definition) {
      if (definition[key]) {
        const fieldFlatName = appendSubtypePy(
          definition[key],
          key + "_",
          total + "_" + key,
          codeHolder,
          namespaceCodeHolder,
          _indent + 2,
        );
        flatClassHolder
          .line(key + ": " + fieldFlatName, 2)
          .line('"""', 2)
          .line("```ts:", 2)
          .line(emitTypeTs(definition[key]), 2)
          .line("```", 2)
          .line('"""', 2);
      }
    }
    if (definition.__or__) {
      flatClassHolder.line(" | " + definition.__or__, 2);
    }
    codeHolder.line(flatClassHolder.code);

    return total;
  }
  throw `Unsupported type definition: ${definition} when emitting Python type. Only ${Object.keys(pythonMemberTypeMap).join(", ")}, nested objects, and arrays are supported.`;
}
