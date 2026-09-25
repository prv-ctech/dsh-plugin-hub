import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const verifyPackagePath = fileURLToPath(
  new URL("../scripts/tools/verify-package-files.mjs", import.meta.url),
);

function runVerifyPackage(paths) {
  return spawnSync(process.execPath, [verifyPackagePath], {
    encoding: "utf8",
    input: JSON.stringify([{ files: paths.map((path) => ({ path })) }]),
  });
}

test("allows runtime package files", () => {
  const result = runVerifyPackage([
    "LICENSE",
    "README.md",
    "package.json",
    "cordis.patch.yml",
    "client/client.js",
    "lib/index.js",
    "src/server/index.ts",
  ]);
  assert.equal(result.status, 0, result.stderr);
});

test("blocks private docs, dotfiles, and credential files from packages", () => {
  const result = runVerifyPackage([
    "README.md",
    "README.md.private",
    "docs/research.md",
    ".env.production",
    "src/server/tls.key",
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Package contains disallowed files/);
});
