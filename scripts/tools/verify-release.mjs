#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
const expectedName = "@prv-ctech/dsh-plugin-hub";
const expectedRegistry = "https://npm.pkg.github.com";
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

if (
  pkg.name !== expectedName ||
  pkg.publishConfig?.registry !== expectedRegistry ||
  !semver.test(pkg.version)
) {
  throw new Error(`Invalid fork package metadata: ${pkg.name}@${pkg.version}`);
}
if (process.env.GITHUB_ACTIONS === "true") {
  const releaseTag =
    process.env.RELEASE_TAG ??
    (process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : undefined);
  if (releaseTag !== `v${pkg.version}`) {
    throw new Error(`Release tag must be v${pkg.version}`);
  }
}
console.log(`Release metadata valid: ${pkg.name}@${pkg.version}`);
