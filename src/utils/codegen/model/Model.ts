import {
  CodeHolder,
  Requirements,
  Code,
  CodeRequirements,
  newCodeRequirements,
  Type,
  Field,
  Method,
  Inputs,
  OptionalInputs,
} from "@utils/codegen";
import { Language } from "@utils/Language";

const constructorNameInLanguage: { [key in Language]: string } = {
  py: "__init__",
  ts: "constructor",
};

export class Model {
  name: string;
  names: { [key in Language]: Set<string> };
  fields: Field[];
  methods: Method[];
  types: Type[];
  constructorInputs: Inputs;
  constructorOptionalInputs: OptionalInputs;
  constructorBody: Code;
  constructorBodyRequirements: CodeRequirements;
  additionalCode: Code | undefined;
  additionalCodeRequirements: CodeRequirements | undefined;

  constructor(name: string) {
    this.name = name;
    this.names = { py: new Set<string>(), ts: new Set<string>() };
    this.fields = [];
    this.methods = [];
    this.types = [];
    this.constructorInputs = {};
    this.constructorOptionalInputs = {};
    this.constructorBody = { py: "return", ts: "return" };
    this.constructorBodyRequirements = newCodeRequirements();
  }

  registerName(name: string) {
    if (!this.tryRegisterName(name)) {
      throw new Error(
        `Name ${name} is already registered in model ${this.name}`,
      );
    }
  }

  tryRegisterName(name: string | Code) {
    if (typeof name === "string") {
      if (this.names.py.has(name) || this.names.ts.has(name)) {
        return false;
      }
      for (const language in this.names) {
        this.names[language as Language].add(name);
      }
    } else {
      for (const language in this.names) {
        if (this.names[language as Language].has(name[language as Language])) {
          return false;
        }
        this.names[language as Language].add(name[language as Language]);
      }
    }
    return true;
  }

  addField(field: Field) {
    if (!this.tryAddField(field)) {
      throw new Error(
        `Field name ${field.name} is already registered in model ${this.name}`,
      );
    }
  }

  tryAddField(field: Field) {
    if (!this.tryRegisterName(field.name)) {
      return false;
    }
    this.fields.push(field);
    return true;
  }

  addMethod(method: Method) {
    if (!this.tryAddMethod(method)) {
      throw new Error(
        `Method name ${method.name} is already registered in model ${this.name}`,
      );
    }
  }

  tryAddMethod(method: Method) {
    if (!this.tryRegisterName(method.name)) {
      return false;
    }
    this.methods.push(method);
    return true;
  }

  addType(_type: Type) {
    if (!this.tryAddType(_type)) {
      throw new Error(
        `Type name ${_type.name} is already registered in model ${this.name}`,
      );
    }
  }

  tryAddType(_type: Type) {
    if (!this.tryRegisterName(_type.name)) {
      return false;
    }
    this.types.push(_type);
    return true;
  }

  setAdditionalCode(code: Code, requirements?: CodeRequirements) {
    this.additionalCode = code;
    if (requirements) {
      this.additionalCodeRequirements = requirements;
    }
  }

  getCode(language: Language, requirements?: Requirements) {
    const my_requirements = new Requirements();
    if (this.additionalCodeRequirements)
      my_requirements.mergeRequirements(
        this.additionalCodeRequirements[language],
      );

    const codeHolder = new CodeHolder(language);

    let typesCode = new CodeHolder(language);
    for (const _type of this.types) {
      typesCode.line(
        (language == "ts" ? "export " : "") +
          _type.getCode(language, my_requirements),
      );
    }

    let fieldsCode = new CodeHolder(language);
    for (const field of this.fields) {
      fieldsCode.line(field.getCode(language));
    }

    const constructorCode = new Method(
      constructorNameInLanguage[language as Language],
      this.constructorInputs,
      this.constructorOptionalInputs,
      null,
      this.constructorBody,
      this.constructorBodyRequirements,
    ).getCode(language, my_requirements);

    let methodsCode = new CodeHolder(language);
    for (const method of this.methods) {
      methodsCode.line(method.getCode(language, my_requirements));
    }

    requirements?.mergeRequirements(my_requirements);
    return codeHolder
      .line(typesCode)
      .line(this.additionalCode?.[language])
      .block(
        `${language == "ts" ? "export " : ""}class ${this.name}`,
        new CodeHolder(language)
          .append(fieldsCode)
          .line(constructorCode)
          .line(methodsCode),
      ).code;
  }

  getAbstractCode(language: Language) {
    const codeHolder = new CodeHolder(language);
  }

  getCodeWithImports(language: Language) {
    const requirements = new Requirements();
    const code = this.getCode(language, requirements);
    const import_statements = requirements.getImportStatements(language);
    return new CodeHolder(language).line(import_statements).line(code).code;
  }

  setConstructor(
    inputs: Inputs,
    optionalInputs: OptionalInputs,
    body?: Code,
    bodyRequirements?: CodeRequirements,
  ) {
    this.constructorInputs = inputs;
    this.constructorOptionalInputs = optionalInputs;
    if (body) {
      this.constructorBody = body;
    }
    if (bodyRequirements) {
      this.constructorBodyRequirements = bodyRequirements;
    }
  }

  setConstructorBody(body: Code, bodyRequirements: CodeRequirements) {
    this.constructorBody = body;
    this.constructorBodyRequirements = bodyRequirements;
  }
}
