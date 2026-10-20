import {
  CodeHolder,
  Field,
  Requirements,
  Code,
  Type,
  CodeRequirements,
  newCodeRequirements,
  uniformCode,
  isUndefineable,
  pythonTypeMap,
} from "../index";
import { Language, Languages } from "../../Language";

export type Inputs = { [name: string]: Type };
export type OptionalInputs = {
  [name: string]: { type: Type; default: Code };
};

export class Method {
  name: string;
  inputs: Inputs;
  optionalInputs: OptionalInputs;
  outputType: Type | null;
  body: Code;
  bodyRequirements: CodeRequirements;
  async: Languages;

  constructor(
    name: string,
    inputs: Inputs,
    optionalInputs: OptionalInputs,
    outputType: Type | undefined | null,
    body: Code = uniformCode("return"),
    bodyRequirements: CodeRequirements = newCodeRequirements(),
    async: Languages = {},
  ) {
    this.name = name;
    this.inputs = inputs;
    this.optionalInputs = optionalInputs;
    if (outputType === null) {
      this.outputType = null;
    } else {
      this.outputType = outputType || new Type({ py: "None", ts: "void" });
    }
    this.async = async;
    this.body = body;
    this.bodyRequirements = bodyRequirements;
  }

  setBody(
    body: Code,
    requirements: CodeRequirements,
    async: { [key in Language]?: boolean } = {},
  ) {
    this.body = body;
    this.bodyRequirements = requirements;
    this.async = async;
  }

  getCode(
    language: Language,
    requirements: Requirements,
    noSelf: boolean = false,
  ) {
    const async = !!this.async[language];

    const body = this.body[language];
    if (!body) {
      throw new Error(`No body defined for method ${this.name} in language ${language}`);
    }
    requirements.mergeRequirements(
      this.bodyRequirements?.[language] || new Requirements(),
    );
    const codeHolder = new CodeHolder(language);
    switch (language) {
      case "py":
        async && requirements.addRequirement("Awaitable", "typing");
        return codeHolder.block(
          `${async ? "async " : ""}def ${this.name}(${noSelf ? "" : "self, "}${this.getInputs("py")} ) ` +
            `${this.outputType ? `-> ${this.outputType.getName("py")}` : "-> None"}`,
          body,
        ).code;
      case "ts":
        return codeHolder.block(
          `${async ? "async " : ""}${this.name}( ${this.getInputs("ts")} ) ` +
            (this.outputType
              ? `: ${async ? "Promise<" : ""}${this.outputType.getName("ts")}${async ? ">" : ""}`
              : ""),
          body,
        ).code;
      default:
        throw new Error(`Unsupported language for Method code generation: ${language}. Code may not be generated correctly.\n`);
    }
  }

  getInputs(language: Language) {
    return [
      Object.entries(this.inputs)
        .map(([name, _type]) => name + ": " + _type.name[language])
        .join(", "),
      Object.entries(this.optionalInputs)
        .map(
          ([name, { type, default: defaultValue }]) =>
            `${name}: ${type.name[language]} = ${defaultValue[language]}`,
        )
        .join(", "),
    ]
      .filter((part) => part.length > 0)
      .join(", ");
  }
}

export const seperateInputsByOptionality: (inputs: {
  [name: string]: Type;
}) => { inputs: Inputs; optionalInputs: OptionalInputs } = (inputs) => {
  const _inputs: Inputs = {};
  const optionalInputs: OptionalInputs = {};
  for (const [name, type] of Object.entries(inputs)) {
    if (type.definition === undefined) continue;
    if (isUndefineable(type.definition)) {
      optionalInputs[name] = {
        type,
        default: { py: "...", ts: "undefined" },
      };
    } else {
      _inputs[name] = type;
    }
  }
  return { inputs: _inputs, optionalInputs };
};
