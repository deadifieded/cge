export type PrimitiveValue =
  | "string"
  | "number"
  | "boolean"
  | "string | null"
  | "number | null"
  | "boolean | null"
  | "null";

export type PrimitiveMemberValue =
  | PrimitiveValue
  | "string | undefined"
  | "number | undefined"
  | "boolean | undefined"
  | "string | null | undefined"
  | "number | null | undefined"
  | "boolean | null | undefined"
  | "undefined"
  | "null | undefined";

export type PrimitiveValues = {
  [key: string]: PrimitiveValue;
};

export type MemberValue =
  | PrimitiveMemberValue
  | ({ [key: string]: MemberValue } & {
      __or__?: "null" | "undefined" | "null | undefined";
    })
  | Value
  | [Value, "undefined" | "null | undefined"]

export type Value =
  | PrimitiveValue
  | ({ [key: string]: MemberValue } & {
      __or__?: "null";
    })
  | [Value]
  | [Value, "null"];

export type Values = { [key: string]: Value };

export function primitiveIsUndefineable(value: PrimitiveMemberValue): boolean {
  switch (value) {
    case "string | undefined":
    case "number | undefined":
    case "boolean | undefined":
    case "string | null | undefined":
    case "number | null | undefined":
    case "boolean | null | undefined":
    case "undefined":
    case "null | undefined":
      return true;
    default:
      return false;
  }
}

export function arrayIsUndefineable(value: MemberValue): boolean {
  if (Array.isArray(value)) {
    if (value.length < 2) {
      return false;
    }
    return primitiveIsUndefineable(value[1] as PrimitiveMemberValue);
  }
  return false;
}

export function objectIsUndefineable(value: MemberValue): boolean {
  if (typeof value === "object" && !Array.isArray(value)) {
    return primitiveIsUndefineable(value.__or__ as PrimitiveMemberValue);
  }
  return false;
}

export function isUndefineable(value: MemberValue): boolean {
  if (typeof value === "string") {
    return primitiveIsUndefineable(value as PrimitiveMemberValue);
  } else if (Array.isArray(value)) {
    return arrayIsUndefineable(value);
  } else if (typeof value === "object") {
    return objectIsUndefineable(value);
  } else
    throw new Error(`Unsupported value type: ${value} when checking if value is undefineable. Only primitive member values, arrays, and objects are supported.`);
}

export function primitiveIsNullable(value: PrimitiveMemberValue): boolean {
  switch (value) {
    case "string | null":
    case "number | null":
    case "boolean | null":
    case "null":
      return true;
    default:
      return false;
  }
}
