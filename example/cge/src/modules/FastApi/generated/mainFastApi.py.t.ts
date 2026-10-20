import type { EndpointSchema } from "@resources/api";
import {
  CodeHolder,
  Requirements,
  Type,
  Method,
  pythonModule,
  primitiveIsNullable,
  uniformCode,
  Code,
} from "codegen-engine";

/** The FastAPI app: error handling, middleware and one route per endpoint. */
export default function render(endpoints: EndpointSchema[]): string {
  const requirements = new Requirements();
  const code = renderApp(requirements);
  for (const endpoint of endpoints) {
    requirements.addRequirement(endpoint.name, ".FastApiCommon");
    code.line(renderRoute(endpoint, requirements)).line();
  }
  return new CodeHolder("py")
    .append(requirements.getImportStatements("py"))
    .line()
    .append(code.code).code;
}

function renderApp(requirements: Requirements): CodeHolder {
  requirements.addRequirement("BaseAppError", ".FastApiCommon.baseAppError");
  requirements.addRequirement("config", "config");
  requirements.addRequirement("add_middleware", "config");
  requirements.addRequirement("error_handler", "config");
  requirements.addRequirement("JSONResponse", "fastapi.responses");
  requirements.addRequirement("Request", "fastapi");
  requirements.addRequirement("Response", "fastapi");
  requirements.addRequirement("error as log_error", "logging");
  requirements.addRequirement(
    "RequestResponseEndpoint",
    "starlette.middleware.base",
  );
  requirements.addRequirement(
    "BaseHTTPMiddleware",
    "starlette.middleware.base",
  );
  //TODO:Pull in url from config instead of hardcoding
  return new CodeHolder("py")
    .line()
    .line("app = config()")
    .line()
    .line("@app.exception_handler(BaseAppError)")
    .block(
      "async def global_generated_error_handler(request: Request, exc: BaseAppError) -> JSONResponse",
      new CodeHolder("py")
        .line("return JSONResponse(")
        .line("status_code=exc.status_code,", 2)
        .line("content={", 2)
        .line("'code': exc.code,", 4)
        .line("'detail': exc.detail,", 4)
        .line("}", 2)
        .line(")"),
    )
    .line()
    .block(
      "class _UnhandledExceptionMiddleware(BaseHTTPMiddleware)",
      new CodeHolder("py").block(
        "async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response",
        new CodeHolder("py")
          .block("try", "return await call_next(request)")
          .block(
            "except Exception as exc",
            new CodeHolder("py")
              .line("log_error('Unhandled exception occurred:', exc_info=True)")
              .line("error_handler(request, exc)")
              .line("return JSONResponse(")
              .line("status_code=500,", 2)
              .line("content={", 2)
              .line(
                "'detail': 'Internal server error, please try again later.',",
                4,
              )
              .line("'code': 'INTERNAL_SERVER_ERROR'", 4)
              .line("}", 2)
              .line(")"),
          ),
      ),
    )
    .line("app.add_middleware(_UnhandledExceptionMiddleware)")
    .line("add_middleware(app)");
}

/** A route that unpacks query params and calls `handlers.<Name>.handle`. */
function renderRoute(
  endpoint: EndpointSchema,
  requirements: Requirements,
): CodeHolder {
  const inputType: Type | undefined = endpoint.input
    ? new Type(endpoint.name + ".inputType", endpoint.input)
    : undefined;

  const outputType = new Type(endpoint.name + ".outputType", endpoint.output);

  const requiredParams: { [key: string]: Type } = {};
  const optionalParams: { [key: string]: { type: Type; default: Code } } = {};

  Object.entries(endpoint.params || {}).forEach(([name, schema]) => {
    if (name === "input") {
      throw new Error(`Parameter name cannot be "input" as it conflicts with the reserved name for request body. Found in endpoint ${endpoint.name}`);
    }
    if (name === "context") {
      throw new Error(`Parameter name cannot be "context" as it conflicts with the reserved name for the handler context. Found in endpoint ${endpoint.name}`);
    }
    if (primitiveIsNullable(schema)) {
      optionalParams[name] = {
        type: new Type(endpoint.name + "." + name + "Type", schema),
        default: uniformCode("None"),
      };
    } else {
      requiredParams[name] = new Type(
        endpoint.name + "." + name + "Type",
        schema,
      );
    }
  });

  const wrapperMethod = new Method(
    `wrapper_${endpoint.name}`,
    { ...requiredParams, ...(inputType ? { input: inputType } : {}) },
    {
      ...optionalParams,
      context: {
        type: new Type(`handlers_${endpoint.name}.Context`),
        default: { py: "Depends()", ts: "" },
      },
    },
    outputType,
  );

  const wrapperBodyHolder = new CodeHolder("py");
  if (endpoint.params) {
    wrapperBodyHolder.append(`params: ${endpoint.name}.paramsType = { `);

    Object.entries(requiredParams).forEach(([paramName], index) => {
      if (index > 0) wrapperBodyHolder.append(", ");
      wrapperBodyHolder.append(`"${paramName}":${paramName}`);
    });
    Object.entries(optionalParams).forEach(([paramName], index) => {
      if (index > 0 || Object.keys(requiredParams).length > 0)
        wrapperBodyHolder.append(", ");
      wrapperBodyHolder.append(`"${paramName}":${paramName}`);
    });
    wrapperBodyHolder.append(" }\n");
  }
  requirements.addRequirement("Depends", "fastapi");
  requirements.addRequirement(
    endpoint.name + " as handlers_" + endpoint.name,
    pythonModule(["handlers"]),
  );
  wrapperBodyHolder.line(
    `return await handlers_${endpoint.name}.handle(${endpoint.params ? " params, " : ""}${inputType ? "input, " : ""}context)`,
  );

  wrapperMethod.setBody(
    { py: wrapperBodyHolder.code, ts: "" },
    { py: requirements, ts: new Requirements() },
    { py: true },
  );

  return new CodeHolder("py")
    .line(`@app.${endpoint.method.toLowerCase()}("${endpoint.route}")`)
    .line(wrapperMethod.getCode("py", requirements, true));
}
