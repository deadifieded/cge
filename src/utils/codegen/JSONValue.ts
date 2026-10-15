import { Code } from "./index";

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export function jsoToCode(jsonValue: JSONValue): Code {
  const json = JSON.stringify(jsonValue) || "null";
  return {
    py: jsonToPythonLiterals(json),
    ts: json,
  };
}

function jsonToPythonLiterals(s: string): string {
  let result: string[] = [];
  let i = 0;
  let in_string = false;
  let escape = false;

  while (i < s.length) {
    const c = s[i] as string;

    if (in_string) {
      result.push(c);
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        in_string = false;
      }
      i += 1;
      continue;
    }

    // not in string
    if (c === '"') {
      in_string = true;
      result.push(c);
      i += 1;
      continue;
    }

    // token replacements
    if (s.startsWith("true", i)) {
      result.push("True");
      i += 4;
    } else if (s.startsWith("false", i)) {
      result.push("False");
      i += 5;
    } else if (s.startsWith("null", i)) {
      result.push("None");
      i += 4;
    } else {
      result.push(c);
      i += 1;
    }
  }

  return result.join("");
}
