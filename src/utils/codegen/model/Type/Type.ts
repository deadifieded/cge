import { MemberValue, Code } from "../../index";
import { Requirements } from "../../index";
import { Language } from "../../../Language";
import { getPyCode } from "./getPyCode";
import { getTsCode } from "./getTsCode";

export class Type {
  name: Code;
  definition: MemberValue | undefined;
  withRuntimeTypeCheckerTs: boolean | undefined;

  constructor(
    name: string | Code,
    definition?: MemberValue,
    withRuntimeTypeCheckerTs?: boolean,
  ) {
    this.name = name instanceof Object ? name : { py: name, ts: name };
    this.definition = definition;
    this.withRuntimeTypeCheckerTs = withRuntimeTypeCheckerTs;
  }

  getName(language: Language) {
    return this.name[language];
  }

  getCode(language: Language, requirements: Requirements): string {
    if (!this.definition) {
      throw new Error(`External types cannot be emitted. Type ${this.name[language]} is marked as external because its definition is undefined.`);
    }
    switch (language) {
      case "py":
        return getPyCode(this.definition, this.name["py"], requirements);
      case "ts":
        return getTsCode(
          this.definition,
          this.name["ts"],
          this.withRuntimeTypeCheckerTs,
        );
      default:
        throw new Error(`Unsupported language for Type code generation: ${language}. Code may not be generated correctly.\n`);
    }
  }
} //{ [key: string]: stringMap } | string | stringMap[];
