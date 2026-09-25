#!/usr/bin/env node
let input = "";
for await (const chunk of process.stdin) input += chunk;

const report = JSON.parse(input);
const pkg = Array.isArray(report) ? report[0] : Object.values(report)[0];
const paths = pkg?.files?.map(({ path }) => path);
if (!paths?.length) throw new Error("Package file list is missing");

const allowed = /^(?:LICENSE|README\.md|package\.json|cordis\.patch\.yml|(?:client|lib|src)\/.+)$/;
const privatePath =
  /(?:^|\/)(?:\.env(?:\..*)?|\.npmrc(?:\..*)?|docs?|notes?|research|PATCHES\.md)(?:\/|$)/i;
const secretFile = /\.(?:pem|key|p12|pfx|secret|log)$/i;
const invalid = paths.filter(
  (path) =>
    !allowed.test(path) ||
    privatePath.test(path) ||
    path.split("/").some((part) => part.startsWith(".")) ||
    secretFile.test(path),
);

if (invalid.length) throw new Error(`Package contains disallowed files: ${invalid.join(", ")}`);
console.log(`Package contents valid: ${paths.length} files`);
