import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mountPluginHubRoutes, type WebRoute } from "../src/server/http/routes.ts";

test("mutation routes accept the configured HTTPS public origin and reject other origins", async () => {
  const home = mkdtempSync(join(tmpdir(), "dsh-hub-origin-"));
  const oldHome = process.env.DSH_HOME;
  const oldHost = process.env.DSH_PUBLIC_HOST;
  const oldVersion = process.env.DSH_VERSION;
  process.env.DSH_HOME = home;
  process.env.DSH_PUBLIC_HOST = "deepseek.prvmr.com";
  const routes = new Map<string, WebRoute["handler"]>();
  const dispose = mountPluginHubRoutes(
    {
      register(route) {
        routes.set(route.path, route.handler);
        return () => routes.delete(route.path);
      },
    },
    "web",
  );
  const server = createServer((req, res) => {
    const handler = routes.get(new URL(req.url ?? "/", "http://localhost").pathname);
    if (handler === undefined) return res.writeHead(404).end();
    void handler(req as IncomingMessage, res as ServerResponse);
  });
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const post = (host: string, origin?: string, path = "/dsh-plugin-hub/settings/reset") =>
      new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          {
            hostname: "127.0.0.1",
            port: address.port,
            path,
            method: "POST",
            headers: { host, ...(origin === undefined ? {} : { origin }) },
          },
          (res) => {
            res.resume();
            res.on("end", () => resolve(res.statusCode ?? 0));
          },
        );
        req.on("error", reject);
        req.end();
      });
    assert.equal(await post("deepseek.prvmr.com", "https://deepseek.prvmr.com"), 200);
    assert.equal(await post("deepseek.prvmr.com", "http://deepseek.prvmr.com"), 403);
    assert.equal(await post("deepseek.prvmr.com", "https://attacker.example"), 403);
    assert.equal(await post("attacker.example", "https://attacker.example"), 403);
    assert.equal(await post("deepseek.prvmr.com"), 403);
    assert.equal(await post("127.0.0.1:3080", "http://127.0.0.1:3080"), 200);
    process.env.DSH_VERSION = "0.1.7-rc.2";
    assert.equal(
      await post("deepseek.prvmr.com", "https://deepseek.prvmr.com", "/dsh-plugin-hub/restart"),
      409,
    );
  } finally {
    dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(home, { recursive: true, force: true });
    if (oldHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = oldHome;
    if (oldHost === undefined) delete process.env.DSH_PUBLIC_HOST;
    else process.env.DSH_PUBLIC_HOST = oldHost;
    if (oldVersion === undefined) delete process.env.DSH_VERSION;
    else process.env.DSH_VERSION = oldVersion;
  }
});
