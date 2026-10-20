import { Language } from "../Language";
import { indent } from "./index";

export class CodeHolder {
  code: string;
  language: Language;

  constructor(language: Language, code: string = "") {
    this.code = code;
    this.language = language;
  }

  currentLineIsWhitespaceOrEmpty() {
    for (let i = this.code.length - 1; i >= 0; i--) {
      const char = this.code[i];
      if (char === "\n") {
        return true;
      }
      if (char !== " " && char !== "\t") {
        return false;
      }
    }
    return true;
  }

  append(code: CodeHolder | string, _indent = 0) {
    if (typeof code === "string") {
      this.code += _indent ? indent(_indent, code) : code;
    } else if (code instanceof CodeHolder) {
      if (code.language !== this.language) {
        throw new Error(`CodeHolder language mismatch: expected "${this.language}", got "${code.language}". Code may not be generated correctly:\n${code.code}\n`);
      }
      this.code += _indent ? indent(_indent, code.code) : code.code;
    }
    return this;
  }

  line(code: CodeHolder | string = "\n", _indent = 0) {
    if (!this.currentLineIsWhitespaceOrEmpty()) this.code += "\n";
    return this.append(code, _indent);
  }

  block(
    blockStart: string | CodeHolder,
    blockContent: CodeHolder | string,
    blockEnd: string | CodeHolder | null = null,
  ) {
    switch (this.language) {
      case "py":
        this.line(blockStart).append(":").line(blockContent, 2);

        blockEnd && this.line(blockEnd);
        break;
      case "ts":
        this.line(blockStart).append(" {").line(blockContent, 2);
        blockEnd !== null ? this.append(blockEnd) : this.line("}");
        break;

      default:
        throw new Error(`Unsupported language for code block: ${this.language}. Code may not be generated correctly.\n`);
    }
    return this;
  }

  switch(
    switchValue: string,
    cases: { caseValue: string; caseCode: CodeHolder | string }[],
    defaultCaseCode?: CodeHolder | string,
  ) {
    switch (this.language) {
      case "py":
        const switchCode = new CodeHolder(this.language);
        cases.forEach(({ caseValue, caseCode }) => {
          switchCode.block(`case ${caseValue}`, caseCode);
        });
        if (defaultCaseCode) {
          switchCode.block("case _", defaultCaseCode);
        }
        this.block(`match ${switchValue}`, switchCode);
        break;

      case "ts":
        const switchBlock = new CodeHolder(this.language);
        cases.forEach(({ caseValue, caseCode }) => {
          switchBlock
            .line(`case ${caseValue}:`)
            .line(caseCode, 2)
            .line("break", 2)
            .line();
        });

        if (defaultCaseCode) {
          switchBlock
            .line(`default:`)
            .line(defaultCaseCode, 2)
            .line("break", 2)
            .line();
        }
        this.block(`switch (${switchValue})`, switchBlock);
        break;

      default:
        throw new Error(`Unsupported language for switch statement: ${this.language}. Code may not be generated correctly.\n`);
    }
    return this;
  }

  if(
    cases: { condition: string; code: CodeHolder | string }[],
    elseCode?: CodeHolder | string,
  ) {
    switch (this.language) {
      case "py":
        cases.forEach(({ condition, code }, index) => {
          this.block(`${index === 0 ? "if" : "elif"} ${condition}`, code, "");
        });
        elseCode && this.block("else", elseCode);
        break;
      case "ts":
        cases.forEach(({ condition, code }, index) => {
          this.block(
            `${index === 0 ? "if" : "} else if"} (${condition})`,
            code,
            "",
          );
        });
        (elseCode && this.block("} else", elseCode)) || this.line("}");
        break;

      default:
        throw new Error(`Unsupported language for if statement: ${this.language}. Code may not be generated correctly.\n`);
    }
    return this;
  }
}
