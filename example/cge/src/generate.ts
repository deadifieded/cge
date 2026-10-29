import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import { FastApi, Requests, Uml } from "@modules";
import { environments } from "@config";
import { Config, prettierFormatter } from "codegen-engine";

const config = new Config({
  // `example/`, wherever this is run from.
  root: fileURLToPath(new URL("../..", import.meta.url)),
  environments,
  defaultEnvironment: "development",
  environmentVariable: "ENVIRONMENT",
  format: prettierFormatter(prettier),
  parts: [
    {
      name: "api",
      language: "py",
      path: "api",
      src: "/src",
      modules: [Requests, FastApi],
      users: ["cge"],
    },
    {
      name: "frontend",
      language: "ts",
      path: "frontend",
      src: "/src",
      modules: [Requests],
      users: ["cge"],
      environmentVariable: "NEXT_PUBLIC_ENVIRONMENT",
    },
    {
      name: "cge",
      language: "ts",
      path: "cge",
      src: "/src",
      modules: [Uml],
    },
  ],
});

await config.generate({ check: process.argv.includes("--check") });
