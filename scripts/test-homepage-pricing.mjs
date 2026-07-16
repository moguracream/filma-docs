import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

const expectedContent = [
  "DRMで守るべき動画コンテンツを配信する事業者へ",
  "Pro（推奨）",
  "<td>12TB／年</td>",
  "<td>1TB</td>",
  "<td>50TB／年</td>",
  "<td>5TB</td>",
  "転送量 ＋5TB／年",
  "¥100,000",
  "¥80,000",
  "転送量 ＋10TB／年",
  "¥180,000",
  "¥150,000",
  "保存容量 ＋500GB",
  "¥60,000／年",
  "¥50,000／年",
  "保存容量 ＋1TB",
  "¥100,000／年",
  "¥80,000／年",
];

for (const content of expectedContent) {
  assert.ok(html.includes(content), `Missing homepage content: ${content}`);
}

assert.ok(
  !html.includes("詳細はご相談ください。"),
  "Pricing overages must be stated explicitly instead of requiring consultation",
);

console.log("Homepage pricing and DRM positioning are consistent.");
