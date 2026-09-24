import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectId = "ynjanprid5";

const staticPages = [
  "index.html",
  "contact/index.html",
  "lp/ip/index.html",
  "lp/elearning/index.html",
  "template-jwt/index.html",
  "template-jwt/video.html",
  "template-no-auth/index.html",
  "template-no-auth/video.html",
];

test("loads Microsoft Clarity on every static public page", async () => {
  for (const path of staticPages) {
    const html = await readFile(path, "utf8");
    assert.match(html, /https:\/\/www\.clarity\.ms\/tag\//, path);
    assert.match(html, new RegExp(projectId), path);
  }
});

test("loads Microsoft Clarity in both MkDocs sites", async () => {
  for (const root of ["admin-manual", "api-spec"]) {
    const config = await readFile(`${root}/mkdocs.yml`, "utf8");
    const script = await readFile(`${root}/docs/javascripts/clarity.js`, "utf8");
    assert.match(config, /javascripts\/clarity\.js/, root);
    assert.match(script, /https:\/\/www\.clarity\.ms\/tag\//, root);
    assert.match(script, new RegExp(projectId), root);
  }
});

test("loads Microsoft Clarity in Jekyll-generated documents", async () => {
  const include = await readFile("_includes/head-custom.html", "utf8");
  const workflow = await readFile(".github/workflows/pages.yml", "utf8");
  assert.match(include, /https:\/\/www\.clarity\.ms\/tag\//);
  assert.match(include, new RegExp(projectId));
  assert.match(workflow, /cp -a _includes publish\/_includes/);
});
