import type { EndpointSchema } from "@resources/api";
import { CodeHolder, Method, Requirements, Type } from "codegen-engine";

/** The handler stub a developer fills in. Only written if it doesn't exist. */
export default function render(endpoint: EndpointSchema): string {
  const requirements = new Requirements();
  requirements.addRequirement("Depends", "fastapi");

  const commonImportLocation =
    "generated.FastApi.FastApiCommon." + endpoint.name;
  requirements.addRequirement("Errors", commonImportLocation);
  const inputs: { [name: string]: Type } = {};
  if (endpoint.params) {
    requirements.addRequirement("paramsType", commonImportLocation);
    inputs["params"] = new Type("paramsType");
  }
  if (endpoint.input) {
    requirements.addRequirement("inputType", commonImportLocation);
    inputs["input"] = new Type("inputType");
  }

  inputs["context"] = new Type("Context");

  const outputType = new Type("outputType");
  requirements.addRequirement("outputType", commonImportLocation);

  const handlerMethod = new Method(
    "handle",
    inputs,
    {},
    outputType,
    { py: "return", ts: "" },
    { py: new Requirements(), ts: new Requirements() },
    { py: true },
  );

  const contextCode = new CodeHolder("py").block(
    "class Context",
    new CodeHolder("py")
      .block("#e.g __init__(self, Depends(get_dep))", "#self.dep = get_dep")
      .block("def __init__(self) -> None", "pass"),
  );

  const handlerCode = handlerMethod.getCode("py", requirements, true);
  return (
    requirements.getImportStatements("py") +
    "\n\n" +
    contextCode.code +
    "\n\n" +
    handlerCode
  );
}
