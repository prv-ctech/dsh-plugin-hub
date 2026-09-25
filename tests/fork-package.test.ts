import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fetchHubUpdate } from "../src/client/data/hub.ts";

test("fork package and Cordis client point to the same scoped package", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    name: string;
    repository: { url: string };
    publishConfig?: { registry?: string };
  };
  const patch = readFileSync(new URL("../cordis.patch.yml", import.meta.url), "utf8");
  const client = readFileSync(new URL("../client/client.js", import.meta.url), "utf8");
  assert.equal(pkg.name, "@prv-ctech/dsh-plugin-hub");
  assert.equal(pkg.publishConfig?.registry, "https://npm.pkg.github.com");
  assert.match(pkg.repository.url, /github\.com\/prv-ctech\/dsh-plugin-hub\.git$/);
  assert.match(patch, /name: '@prv-ctech\/dsh-plugin-hub'/);
  assert.ok(client.startsWith('window.__ModuleLoader__.load({ id: "@prv-ctech/dsh-plugin-hub"'));
});

test("self-update checks this fork release instead of the upstream package", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (url) => {
    requested = String(url);
    return Response.json({
      tag_name: "v1.4.8-prv.2",
      published_at: "2026-09-25T00:00:00Z",
      body: "Fork fixes",
    });
  };
  try {
    assert.deepEqual(await fetchHubUpdate(), {
      version: "1.4.8-prv.2",
      publishedAt: "2026-09-25T00:00:00Z",
      notes: "Fork fixes",
    });
    assert.match(requested, /api\.github\.com\/repos\/prv-ctech\/dsh-plugin-hub\/releases\/latest/);
  } finally {
    globalThis.fetch = original;
  }
});
