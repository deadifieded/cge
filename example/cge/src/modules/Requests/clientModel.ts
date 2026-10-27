import type { EndpointSchema, Error } from "@resources/api";
import {
  CodeHolder,
  Field,
  Method,
  Model,
  Requirements,
  Type,
  jsoToCode,
} from "codegen-engine";

/** Builds the client class for `endpoint`, in both languages. */
export function buildClientModel(endpoint: EndpointSchema): Model {
  const errors = endpoint.errors || [];
  const model = new Model(endpoint.name);

  // The clients import `ORIGIN` from the generated `origin` file.
  const originField = new Field("origin", { ts: "ORIGIN", py: "ORIGIN" });
  const routeField = new Field("route", jsoToCode(endpoint.route));
  const methodField = new Field("method", jsoToCode(endpoint.method));
  model.addField(originField);
  model.addField(new Field("name", jsoToCode(endpoint.name)));
  model.addField(routeField);
  model.addField(methodField);

  const clientType = new Type({ ts: "AxiosInstance", py: "ClientSession" });
  model.addField(new Field("client", undefined, clientType));

  // A file input has no schema to emit, so its `InputType` alias is written
  // in the additional code instead of being added as a model type.
  const input = endpoint.input || "null";
  const isFile = input === "file";
  const inputType = isFile
    ? new Type("InputType")
    : new Type("InputType", input);

  const outputType = new Type("OutputType", endpoint.output || "null", true);
  const paramType = new Type("ParamType", endpoint.params || "null");
  model.addType(outputType);
  if (!isFile) model.addType(inputType);
  model.addType(paramType);

  const handleRawMethod = new Method(
    "handleRaw",
    { input: inputType, params: paramType },
    {},
    new Type("unknown"),
  );
  model.addMethod(handleRawMethod);

  model.addMethod(
    new Method(
      "handle",
      { input: inputType, params: paramType },
      {},
      outputType,
      {
        ts: getTsHandleMethodBody(endpoint.name, errors),
        py: "throw NotImplementedError()",
      },
      undefined,
      { ts: true, py: true },
    ),
  );

  const tsRequirements = new Requirements();
  if (errors.length > 0) tsRequirements.addRequirement("{ AxiosError }", "axios");
  tsRequirements.mergeRequirements(new Requirements({ "{ ORIGIN }": "../origin" }));
  const pyRequirements = new Requirements();
  pyRequirements.mergeRequirements(new Requirements({ ORIGIN: "..origin" }));
  if (isFile) pyRequirements.addRequirement("TypeAlias", "typing");
  model.setAdditionalCode(
    {
      ts:
        (isFile ? "export type InputType = Blob;\n" : "") +
        getTsAdditionalCode(endpoint.name, errors),
      py: isFile ? "InputType: TypeAlias = bytes\n" : "",
    },
    { ts: tsRequirements, py: pyRequirements },
  );

  model.setConstructor(
    {},
    {
      client: {
        type: clientType,
        default: { ts: "axios", py: "aiohttp.ClientSession()" },
      },
    },
  );
  model.setConstructorBody(
    {
      ts: new CodeHolder("ts").line("this.client = client").code,
      py: new CodeHolder("py").line("self.client = client").code,
    },
    {
      ts: new Requirements({ "{ AxiosInstance }": "axios", axios: "axios" }),
      py: new Requirements({
        aiohttp: "aiohttp",
        asyncio: "asyncio",
        ClientSession: "aiohttp.ClientSession",
      }),
    },
  );
  // A file goes up as the multipart field `input`, the name of the FastAPI
  // wrapper's parameter. The client sets the multipart content type itself.
  const tsBody = new CodeHolder("ts");
  const pyBody = new CodeHolder("py");
  if (isFile) {
    tsBody
      .append("const data = new FormData();")
      .line('data.append("input", input);')
      .line();
    pyBody
      .append("data = aiohttp.FormData()")
      .line('data.add_field("input", input)')
      .line();
  }
  handleRawMethod.setBody(
    {
      ts: tsBody
        .append("const response = await this.client({")
        .line("method: " + methodField.getReference("ts") + ",", 2)
        .line("url: " + routeField.getReference("ts") + ",", 2)
        .line("baseURL: " + originField.getReference("ts") + ",", 2)
        .line(
          isFile
            ? "data: data,"
            : "headers: { 'content-type': 'application/json' },\ndata: input,",
          2,
        )
        .line("params: params,", 2)
        .line("});")
        .line("return response.data").code,

      py: pyBody
        .append("resp = await self.client.request (")
        .line("method=" + methodField.getReference("py") + ",", 2)
        .line("url=" + routeField.getReference("py") + ",", 2)
        .line(
          isFile
            ? "data=data,"
            : "headers={ 'content-type': 'application/json' },\ndata=input,",
          2,
        )
        .line("params=params,", 2)
        .line(")")
        .line("return { 'status': resp.status, 'data': await resp.json() }")
        .code,
    },
    {
      ts: new Requirements({}),
      py: new Requirements({
        aiohttp: "aiohttp",
        ClientSession: "aiohttp.ClientSession",
      }),
    },
    { ts: true, py: true },
  );
  return model;
}

/** The `<Name>ErrorCode` union, the code -> error table and `<Name>Error`. */
function getTsAdditionalCode(name: string, errors: Error[]): string {
  const areErrors = errors.length > 0;
  return new CodeHolder("ts")
    .line(
      `type ${name}ErrorCode = ${
        areErrors
          ? errors
              .slice(1)
              .reduce(
                (acc, error) => (acc += ` | '${error.code}'`),
                `'${errors[0]?.code}'`,
              )
          : "never"
      }`,
    )
    .line(
      areErrors
        ? new Field(
            `const errors: Record<string, { detail: string, code: ${name}ErrorCode, statusCode: number }>`,
            jsoToCode(
              Object.fromEntries(
                errors.map(({ code, detail, statusCode }) => [
                  code,
                  { detail, code, statusCode },
                ]),
              ),
            ),
          ).getCode("ts")
        : "",
    )
    .block(
      `export class ${name}Error extends Error`,
      new CodeHolder("ts")
        .line("code: " + name + "ErrorCode")
        .block(
          `constructor(code: ${name}ErrorCode, detail: string)`,
          new CodeHolder("ts").append("super(detail);\nthis.code = code;"),
        ),
    ).code;
}

/** Validates the response, and turns known error codes into `<Name>Error`. */
function getTsHandleMethodBody(name: string, errors: Error[]): string {
  return `try {
  const output = await this.handleRaw(input, params);
  assertIsOutputType(output);
  return output;
} catch (error) {
  ${
    errors.length > 0
      ? `
  if (!(error instanceof AxiosError)) throw error;
  const error_code = error.response?.data?.code;
  if (typeof error_code !== "string") throw error;
  const _error = errors[error_code];
  if (_error) {
    throw new ${name}Error(_error.code, _error.detail);
  }`
      : ""
  }throw error;
}`;
}
