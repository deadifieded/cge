import { Type, Code } from "@utils/codegen";
import { Language } from "@utils/Language";

export class Field {
  name: string;
  value: Code | undefined;
  _type: Type | undefined;

  constructor(name: string, value?: Code | undefined, _type?: Type) {
    this.name = name;
    this.value = value;
    this._type = _type;
  }

  getCode(language: Language) {
    return (
      this.name +
      (this._type ? ": " + this._type.getName(language) : "") +
      (this.value !== undefined ? " = " + this.value[language] : "") +
      "\n"
    );
  }

  getReference(language: Language, prefix?: string) {
    const classPrefixInLanguage: { [key in Language]: string } = {
      py: "self.",
      ts: "this.",
    };
    return (prefix ? prefix : classPrefixInLanguage[language]) + this.name;
  }
}
