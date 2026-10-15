# CGE

CGE generates code for the monorepo's parts from the schemas in `src/schemas/`. Run
`pnpm generate` here. It wipes each part's `generated/` folder and rewrites it, and
only creates files outside `generated/` (handler templates, `lifespan.py`) when they
don't already exist.

## Package

CGE is published to npm as `codegen-engine`. `src/index.ts` is its only entry, so
anything consumers need must be re-exported from there. `npm run build` bundles it
with tsdown into `dist/index.mjs` and `dist/index.d.mts`, resolving the `@utils/*`
path aliases. Only `dist/` is published. CGE has no runtime dependencies: `Config`
takes a required `format` function, for example `prettierFormatter(prettier)` from
the consumer's own prettier, or `(content) => content` to skip formatting.

## How a run fits together

| Concept | File | Role |
| --- | --- | --- |
| Resource | `src/Resource.ts`, `src/resources/*` | A kind of thing parts provide and use, such as `api` endpoints. It loads a part's schemas and `shared` config. |
| Module | `src/Module.ts`, `src/modules/*` | A code generator, for example `new Module("FastApi").provides(apiResource, ctx => …)`. Use `.uses(…)` for a schema's users (see "Users"). |
| Part | `src/part.ts`, `src/config.ts` | One app in the monorepo. `config.ts` imports its modules directly. |

`generate.ts` collects the resources from every configured module. For every resource
a part provides, `Part.stageChanges` builds that part's provider ingesters, then the
user ingesters of every part that uses the schema. It calls `ingest(schema)` on
each of them for every schema, then calls `stageChanges()` once at the end. Files that
collect output across schemas, like `mainFastApi.py`, have to be written in
`stageChanges()`.

A factory runs once per (provider part, user part) pair, so each ingester gets that
pair's file writers, `shared` and `provider` name. Never keep state on the module itself.

## Users

A schema's users are its provider's `users` from `config.ts` plus the schema's own
`users`. Use a part's `users` for parts that consume everything it provides. Listing
one of those parts again in a schema's `users` throws, so a schema can only add users.

CGE is a part itself (`cge`), and every other part lists it in `users`. Its `Uml`
module writes Mermaid class diagrams of each provider's schemas to
`src/generated/extern/<provider>/Uml/`. That folder is generated, so never edit it by
hand. When `Uml` (or any module) uses more than one resource, keep each resource's
output in its own subfolder (`endpoints/`, later `tables/`) so the files can't collide.

Run `pnpm uml` to browse the diagrams at http://localhost:4321. `src/uml/serve.ts`
lists every `.md` under `src/generated/extern/*/Uml/`, and `src/uml/viewer.html` renders
them in the browser with `marked` and `mermaid`. It reads from disk on every request,
so re-run `pnpm generate` and refresh to see changes.

## Module layout

Every file a module writes has a template in the module's folder, at a path that
mirrors where the output lands. `src/` mirrors the part's `src/`, and `generated/`
mirrors the module's own generated folder. Per-schema files use a `[name]` segment, so
`FastApi/generated/FastApiCommon/[name].py.t.ts` renders
`generated/FastApi/FastApiCommon/<Endpoint>.py`.

A template's default export is a pure function that returns the whole file as a
string. The ingester (`FastApi.ts`, `Requests.ts`) imports it as
`./generated/foo.py.t` and decides the output path and the `FileWriteMode`. The
mirroring is only a convention, so a template's location doesn't change where its
output goes. When you add an output file, add its template in the matching place.
Helpers shared by several templates, like `Requests/clientModel.ts`, sit next to the
ingester as plain `.ts` files.

## Output layout

- A provider writes to `generated/<Module>/` in its own part, for example
  `backend/api/src/generated/FastApi`.
- A user writes to `generated/extern/<provider part>/<Module>/` in its own part, for
  example `frontend/src/generated/extern/api/Requests`.

## Environments

The `environments` tuple in `config.ts` is the only list of environments. `shared` in
`src/schemas/` is a record keyed by those names, so if you add or rename one there,
typecheck points at every schema that needs updating. Generated code doesn't bake in a
single environment. It reads an environment variable at runtime, falls back to
`defaultEnvironment`, and throws on an unknown value. The variable is `ENVIRONMENT`
(`config.environmentVariable`) unless a part sets its own `environmentVariable`; the
frontend does, because Next.js only exposes `NEXT_PUBLIC_*` variables to the browser.
Modules must read the name from `environments.variable` in their context, never
hard-code it.

Every part writes `generated/constants.{ts,py}` itself, outside any module, from the
templates in `src/part/generated/`. It exports `ENVIRONMENTS`, the `Environment` type
and the validated `ENVIRONMENT`, and it is the one place a part reads its environment
variable. App code (`frontend/src/constants`, `backend/api/src/globals`) and generated
files (such as `Requests`' `origin`) import from it rather than reading the variable
again. The TypeScript version reads `process.env.<VARIABLE>` literally on purpose,
because Next.js only inlines `NEXT_PUBLIC_*` variables accessed that way.
