import type { EndpointSchema } from "@resources/api";
import { CodeHolder, Requirements, Type } from "codegen-engine";

/** The endpoint's params, input and output types, and its `Errors`. */
export default function render(endpoint: EndpointSchema): string {
  const requirements = new Requirements();
  const code = new CodeHolder("py")
    .line(renderTypes(endpoint, requirements))
    .line(renderErrors(endpoint, requirements));
  return requirements.getImportStatements("py") + "\n" + code.code;
}

function renderTypes(endpoint: EndpointSchema, requirements: Requirements) {
  const paramTypes = Object.entries(endpoint.params || {}).map(
    ([name, schema]) => {
      return new Type(name + "Type", schema);
    },
  );
  const inputType = endpoint.input
    ? new Type("inputType", endpoint.input)
    : undefined;
  const outputType = new Type("outputType", endpoint.output || "null");

  const codeHolder = new CodeHolder("py");

  if (endpoint.params) {
    for (const paramType of paramTypes) {
      codeHolder.line(paramType.getCode("py", requirements)).line();
    }
    codeHolder.line(
      new Type("paramsType", endpoint.params).getCode("py", requirements),
    );
  }
  if (inputType) {
    codeHolder.line(inputType.getCode("py", requirements)).line();
  }
  if (outputType) {
    codeHolder.line(outputType.getCode("py", requirements)).line();
  }
  codeHolder.line();
  return codeHolder.code;
}

function renderErrors(endpoint: EndpointSchema, requirements: Requirements) {
  const errorsCodeHolder = new CodeHolder("py");
  if (endpoint.errors && endpoint.errors.length > 0) {
    for (const error of endpoint?.errors || []) {
      requirements.addRequirement("BaseAppError", ".baseAppError");
      errorsCodeHolder.block(
        `class ${error.name}(BaseAppError)`,
        new CodeHolder("py")
          .line(`detail = "${error.detail}"`)
          .line(`status_code = ${error.statusCode}`)
          .line(`code = "${error.code}"`),
      );
    }
  } else {
    errorsCodeHolder.line("pass");
  }
  return new CodeHolder("py").block("class Errors", errorsCodeHolder);
}
