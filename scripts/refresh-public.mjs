import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.resolve(siteRoot, "..");
const publicRoot = path.join(siteRoot, "public");
const privateArtifactUrl =
  /https:\/\/claude\.ai\/code\/artifact\/[0-9a-f-]+/i;
const obsoleteGtmPriority =
  /OEM\s*(?:->|&#x2192;|\\u2192)\s*Channel\s*(?:->|&#x2192;|\\u2192)\s*Enterprise/i;

const htmlFiles = (await readdir(sourceRoot))
  .filter((name) => /^amd-[a-z0-9-]+\.html$/.test(name))
  .sort();

if (htmlFiles.length !== 13) {
  throw new Error(`Expected 13 HTML pages, found ${htmlFiles.length}`);
}

function sanitizeHtml(name, input) {
  let output = input.replaceAll(`${sourceRoot}${path.sep}`, "");
  if (process.env.HOME) {
    output = output.replaceAll(
      `${process.env.HOME}${path.sep}`,
      "[local-home]/",
    );
  }

  if (name === "amd-agenda-2026.html") {
    output = output
      .replaceAll("Brian Van Essen", "__PUBLIC_SPEAKER_BRIAN_VAN_ESSEN__")
      .replace(/\bBrian\b/g, "Owner-A")
      .replace(/\bJasper\b/g, "Owner-B")
      .replace(/\bShadow\b/g, "Owner-C")
      .replaceAll(
        "__PUBLIC_SPEAKER_BRIAN_VAN_ESSEN__",
        "Brian Van Essen",
      );
  }

  return output;
}

await rm(publicRoot, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });

for (const name of htmlFiles) {
  const source = await readFile(path.join(sourceRoot, name), "utf8");
  const output = sanitizeHtml(name, source);
  if (privateArtifactUrl.test(output)) {
    throw new Error(`${name} still contains a private Claude artifact URL`);
  }
  if (obsoleteGtmPriority.test(output)) {
    throw new Error(`${name} still contains the reversed GTM priority`);
  }
  await writeFile(path.join(publicRoot, name), output);
}

await cp(
  path.join(sourceRoot, "assets"),
  path.join(publicRoot, "assets"),
  { recursive: true },
);
await cp(
  path.join(sourceRoot, "glossary-data.json"),
  path.join(publicRoot, "glossary-data.json"),
);

await writeFile(
  path.join(publicRoot, "index.html"),
  [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta http-equiv="refresh" content="0;url=amd-command-center.html">',
    "<title>AMD Advancing AI 2026 | Intelligence Command Center</title>",
    '<link rel="icon" href="assets/favicon.svg">',
    '<link rel="canonical" href="amd-command-center.html">',
    "</head>",
    "<body>",
    '<p><a href="amd-command-center.html">Open the Intelligence Command Center</a></p>',
    "</body>",
    "</html>",
    "",
  ].join("\n"),
);
await writeFile(path.join(publicRoot, ".nojekyll"), "");

console.log(`Prepared ${htmlFiles.length} HTML pages in ${publicRoot}`);
