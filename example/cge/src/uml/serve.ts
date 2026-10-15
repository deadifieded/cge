import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Serves the `Uml` module's diagrams with a viewer that renders them in the browser. */

const here = path.dirname(fileURLToPath(import.meta.url));
const cgeRoot = path.resolve(here, "../..");
const externRoot = path.join(cgeRoot, "src/generated/extern");
/** The sandbox shares the engine repo's `node_modules`. */
const nodeModules = path.resolve(cgeRoot, "../../node_modules");
const port = Number(process.env.PORT ?? 4321);

/** URL prefix → directory it serves from. */
const roots: Record<string, string> = {
  "/files/": externRoot,
  "/vendor/mermaid/": path.join(nodeModules, "mermaid/dist"),
  "/vendor/marked/": path.join(nodeModules, "marked/lib"),
};

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

/** Every `.md` under `extern/<provider>/Uml/`, relative to `extern`. */
async function listDiagrams(): Promise<string[]> {
  const entries = await readdir(externRoot, { recursive: true }).catch(
    () => [] as string[],
  );
  return entries
    .map((entry) => entry.split(path.sep).join("/"))
    .filter((entry) => entry.split("/")[1] === "Uml" && entry.endsWith(".md"))
    .sort();
}

/** Resolves `urlPath` to a file, or `undefined` if it's outside every root. */
function resolveFile(urlPath: string): string | undefined {
  if (urlPath === "/") return path.join(here, "viewer.html");
  for (const [prefix, root] of Object.entries(roots)) {
    if (!urlPath.startsWith(prefix)) continue;
    const file = path.resolve(root, "." + urlPath.slice(prefix.length - 1));
    return file.startsWith(root + path.sep) ? file : undefined;
  }
  return undefined;
}

const server = createServer(async (request, response) => {
  const urlPath = decodeURIComponent(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  try {
    if (urlPath === "/api/files") {
      response.writeHead(200, { "content-type": contentTypes[".json"] });
      response.end(JSON.stringify(await listDiagrams()));
      return;
    }
    const file = resolveFile(urlPath);
    if (!file) throw new Error("Not found");
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type":
        contentTypes[path.extname(file)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`UML viewer running at http://localhost:${port}`);
});
