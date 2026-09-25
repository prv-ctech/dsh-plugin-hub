import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const verifyReleasePath = fileURLToPath(
  new URL("../scripts/tools/verify-release.mjs", import.meta.url),
);

function runVerifyRelease(env) {
  return spawnSync(process.execPath, [verifyReleasePath], {
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_ACTIONS: "true",
      GITHUB_REF_NAME: "main",
      GITHUB_REF_TYPE: "branch",
      ...env,
    },
  });
}

test("accepts the explicit upstream release tag in a branch workflow", () => {
  const result = runVerifyRelease({ RELEASE_TAG: "v1.4.8-prv.1" });
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a release tag that does not match the package version", () => {
  const result = runVerifyRelease({ RELEASE_TAG: "v1.4.9" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Release tag must be v1\.4\.8-prv\.1/);
});
