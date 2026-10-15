import { CodeHolder } from "codegen-engine";

export default function render(): string {
  return new CodeHolder("py").block(
    "class BaseAppError(Exception)",
    new CodeHolder("py")
      .append("detail: str")
      .line("status_code: int")
      .line("code: str"),
  ).code;
}
