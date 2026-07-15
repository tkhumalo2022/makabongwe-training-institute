import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const html = await readFile(
    new URL("../.next/server/app/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, developmentPreviewMeta);
});

test("renders CMS fallback programme content without Wix credentials", async () => {
  const programmesHtml = await readFile(
    new URL("../.next/server/app/programmes.html", import.meta.url),
    "utf8",
  );
  const agrisetaHtml = await readFile(
    new URL("../.next/server/app/agriseta.html", import.meta.url),
    "utf8",
  );

  assert.match(programmesHtml, /Azibuye Emasisweni/);
  assert.match(programmesHtml, /National Certificate: Poultry Production/);
  assert.match(agrisetaHtml, /49582/);
});
