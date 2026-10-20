import {
  assertArrayIsValid,
  MemberValue,
  PrimitiveMemberValue,
  indent,
  CodeHolder,
} from "../../index";
import { isStringObject } from "util/types";

export function getTsCode(
  definition: MemberValue,
  name: string,
  withRuntimeTypeChecker?: boolean,
): string {
  const codeHolder = new CodeHolder("ts");
  codeHolder.append(`type ${name} = ${emitTypeTs(definition)}`);
  if (withRuntimeTypeChecker) {
    codeHolder
      .line(`// eslint-disable-next-line @typescript-eslint/no-explicit-any`)
      .block(
        `function assertIs${name}(value: any): asserts value is ${name}`,
        emitTypeCheckTs("value", definition),
      );
  }
  return codeHolder.code;
}

export function emitTypeTs(definition?: MemberValue): string {
  if (!definition) {
    throw new Error(`External types cannot be emitted. Type definition is undefined.`);
  }
  if (typeof definition === "string") {
    return definition;
  } else if (Array.isArray(definition)) {
    assertArrayIsValid(definition);
    return (
      emitTypeTs(definition[0]) +
      "[]" +
      (definition?.[1] ? ((" | " + definition[1]) as PrimitiveMemberValue) : "")
    );
  } else if (!isStringObject(definition)) {
    let type_text = "";
    switch (definition.__or__) {
      case "null":
        type_text += "null |";
        break;
      case "undefined":
        type_text += "undefined |";
        break;
      case "null | undefined":
        type_text += "null | undefined | ";
        break;
    }

    type_text += "{";

    for (const key in definition) {
      if (definition[key]) {
        type_text += indent(
          2,
          "\n" + key + ": " + emitTypeTs(definition[key]) + ";",
        );
      }
    }
    type_text += "\n}";
    return type_text;
  }
  throw new Error(`Unsupported type definition: ${definition} when emitting TypeScript type. Only "string", nested objects, and arrays are supported.`);
}

export function emitTypeCheckTs(
  name: string,
  definition?: MemberValue,
  variableName: string = name,
  arrayDepth: number = 0,
): string {
  if (!definition) {
    throw new Error(`External types cannot be emitted. Type definition is undefined.`);
  }
  if (typeof definition === "string") {
    switch (definition) {
      case "boolean | null | undefined":
        return `if (${variableName} !== null && ${variableName} !== undefined && typeof ${variableName} !== "boolean") throw new Error(\`${name} is not of type boolean | null | undefined\`);`;
      case "boolean | undefined":
        return `if (${variableName} !== undefined && typeof ${variableName} !== "boolean") throw new Error(\`${name} is not of type boolean | undefined\`);`;
      case "null":
        return `if (${variableName} !== null) throw new Error(\`${name} is not of type null\`);`;
      case "null | undefined":
        return `if (${variableName} !== null && ${variableName} !== undefined) throw new Error(\`${name} is not of type null | undefined\`);`;
      case "number | null | undefined":
        return `if (${variableName} !== null && ${variableName} !== undefined && typeof ${variableName} !== "number") throw new Error(\`${name} is not of type number | null | undefined\`);`;
      case "number | undefined":
        return `if (${variableName} !== undefined && typeof ${variableName} !== "number") throw new Error(\`${name} is not of type number | undefined\`);`;
      case "boolean | null":
        return `if (${variableName} !== null && typeof ${variableName} !== "boolean") throw new Error(\`${name} is not of type boolean | null\`);`;
      case "string | undefined":
        return `if (${variableName} !== undefined && typeof ${variableName} !== "string") throw new Error(\`${name} is not of type string | undefined\`);`;
      case "string | null":
        return `if (${variableName} !== null && typeof ${variableName} !== "string") throw new Error(\`${name} is not of type string | null\`);`;
      case "string | null | undefined":
        return `if (${variableName} !== null && ${variableName} !== undefined && typeof ${variableName} !== "string") throw new Error(\`${name} is not of type string | null | undefined\`);`;
      case "number | null":
        return `if (${variableName} !== null && typeof ${variableName} !== "number") throw new Error(\`${name} is not of type number | null\`);`;
      case "undefined":
        return `if (${variableName} !== undefined) throw new Error(\`${name} is not of type undefined\`);`;
      default:
        return `if (typeof ${variableName} !== "${definition}") throw new Error(\`${name} is not of type ${definition}\`);`;
    }
  } else if (Array.isArray(definition)) {
    assertArrayIsValid(definition);
    const index_var = "item" + String(arrayDepth);
    if (definition.length > 1) {
      return new CodeHolder("ts").if([
        {
          condition: `Array.isArray(${variableName})`,
          code: new CodeHolder("ts").block(
            `for (const ${index_var} of ${variableName})`,
            emitTypeCheckTs(
              name + "[]",
              definition[0],
              index_var,
              arrayDepth + 1,
            ),
          ),
        },
        {
          condition: `${variableName} !== ${definition[1]}`,
          code: `throw new Error(\`${name} is not of type ${emitTypeTs(definition)}\`);`,
        },
      ]).code;
    }
    return new CodeHolder("ts")
      .line(
        `if (!Array.isArray(${variableName})) throw new Error(\`${name} is not of type ${emitTypeTs(definition)}\`);`,
      )
      .block(
        `for (const ${index_var} of ${variableName})`,
        emitTypeCheckTs(name + "[]", definition[0], index_var, arrayDepth + 1),
      ).code;
  } else if (!isStringObject(definition)) {
    let condition = `typeof ${variableName} !== 'object'`;
    switch (definition.__or__) {
      case "null":
        condition += ` && ${variableName} !== null`;
        break;
      case "undefined":
        condition += ` && ${variableName} !== undefined`;
        break;
      case "null | undefined":
        condition += ` && ${variableName} !== null && ${variableName} !== undefined`;
        break;
    }
    const codeHolder = new CodeHolder("ts");
    codeHolder.if([
      {
        condition,
        code: `throw new Error(\`${name} is not of type ${emitTypeTs(definition)}\`);`,
      },
    ]);
    Object.entries(definition).forEach(([key, sub_definition]) => {
      if (key !== "__or__") {
        codeHolder.line(
          emitTypeCheckTs(
            name + "." + key,
            sub_definition,
            variableName + "." + key,
            arrayDepth,
          ),
        );
      }
    });
    return codeHolder.code;
  }
  throw new Error(`Unsupported type definition: ${definition} when emitting TypeScript type. Only "string", nested objects, and arrays are supported.`);
}
