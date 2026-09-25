# Harness development reference

Use official documentation and source as the authority for Harness behavior. This file records verified integration notes for the Plugin Hub.

## 1. Investigation order

When behavior is unclear:

1. Check the [official Harness reference](https://deepseek-harness.github.io/deepseek-harness/reference/).
2. Check the [official Harness source](https://github.com/deepseek-ai/deepseek-harness), especially the owning package and its README.
3. Inspect the source for the installed Harness version.
4. Observe the running profile and logs.
5. Use a minimal experiment only if the earlier steps do not settle the question, then record the result here.

The plugin should use documented host services such as ctx.webServer, ctx.loader, and ctx.clientModules. Do not patch Harness internals from this plugin.

## 2. Core mechanisms

### Cordis plugin tree

A running dsh process is composed from Cordis plugins. Plugins contribute services and event handlers through the shared context. Registrations should use reversible effects so unloading a plugin disposes its handlers and services.

### Profiles and bundles

A profile is a named Harness configuration under the Harness home directory. It selects bundles and can include profile-level Cordis patches. A bundle combines configuration with plugin code and may declare its patch in package.json.

To inspect the effective configuration, run:

    dsh --profile web --dump-config

The exact profile directory and bundle order depend on the installed Harness deployment.

### Loader

The loader manages runtime plugin entries. The relevant public operations include:

| Operation | Meaning |
| --- | --- |
| ctx.loader.entries() | Enumerate loader entries |
| ctx.loader.create({ name, config }) | Create a plugin entry |
| ctx.loader.remove(id) | Stop and remove a plugin entry |

Removing an entry is a runtime operation. Verify persistence behavior against the installed Harness version before relying on it across restarts.

### Client modules

The client-modules service discovers loaded plugins that declare a client bundle and builds the browser boot graph. Bundle revisions are content-based and provide cache invalidation. When a plugin entry is unloaded, the host reconciles the client graph; an unknown client bundle should return an error rather than silently load stale code.

### Web server

The plugin injects the host webServer service and registers same-origin routes for marketplace operations. Browser requests depend on live task and profile state, so these endpoints should not be cached.

## 3. Plugin Hub integration rules

1. Verify host behavior from official docs and source before changing integration code.
2. Use public Harness services; do not patch host packages or rely on private fields.
3. Keep route validation at the server boundary.
4. Keep profile changes within the supported DSH CLI and patch mechanisms.
5. Add Node.js tests for deterministic parsing, validation, and progress behavior.

## 4. Verified project notes

| Behavior | Consequence |
| --- | --- |
| Client bundles are discovered from loaded plugin entries | Restart or update the loader state when the plugin set changes |
| A stale client entry can fail to load after uninstall | Remove the loaded entry where supported, then verify the browser boot graph |
| HTTP caching can serve outdated task or settings data | Use no-store behavior for live Plugin Hub endpoints |
| Profile files may be regenerated during startup | Verify the active Harness version before choosing a persistent configuration file |
| The DSH CLI updates installed package state; it may not unload an already-running plugin | Confirm runtime loader state after install or removal |

These notes describe behavior previously observed in this project. Re-check them against the Harness version in use when the host changes.

## 5. Diagnostics

Run this command in the environment that hosts DSH:

    dsh --profile web --dump-config

For this deployment, Pangolin reaches the Harness at `http://192.168.13.9:3080` on `prv.network`. Use the configured address and port for HTTP checks. Inspect the active executable and profile instead of assuming host-specific installation paths.

## Official references

- [Harness reference](https://deepseek-harness.github.io/deepseek-harness/reference/)
- [Cordis primer](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)
- [Client modules](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/client-modules)
- [Web server](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/web-server)
- [Configuration catalog](https://deepseek-harness.github.io/deepseek-harness/reference/config-catalog)
- [Harness source](https://github.com/deepseek-ai/deepseek-harness)
- [Event producer/consumer map](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/event-producer-consumer.md)
- [Profile and bundle documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md#profiles)
