# Architecture

DSH Plugin Hub is a Cordis plugin that adds a marketplace to DeepSeek Harness. It has a server side that performs install and profile operations, and a browser side that renders the settings interface.

| Side | Source | Build | Output |
| --- | --- | --- | --- |
| Server | src/server/ | TypeScript | lib/ |
| Browser | src/client/ | tsdown | client/client.js |

## Server

The plugin entry point is src/server/index.ts. It injects the host web server and registers routes from src/server/http/routes.ts. Routes validate requests and delegate install, profile, and diagnostic work to services under src/server/services/.

Install operations run through the DSH CLI. The task queue reports progress and supports cancellation. Profile services track installed versions and pending restarts. The plugin reuses the running Harness entry when possible, so it does not depend on dsh being available in PATH.

The restart route starts the configured restart script. In the Unraid deployment, restart the container through Unraid so its startup arguments are preserved.

## Browser

src/client/index.tsx mounts the Plugin Hub settings section. React components and hooks handle catalog browsing, install progress, installed plugins, settings, diagnostics, and logs. src/client/locales.ts contains the English and Chinese interface strings; this fork's project documentation is English.

The client bundle is loaded through the Harness module loader. tsdown builds the bundle and compiles CSS Modules for injection into the host page. React runtime imports resolve through the host loader.

## Install lifecycle

1. The user selects a plugin or requests an install.
2. The browser sends a same-origin request to the Plugin Hub server.
3. The server validates the request and enqueues a DSH CLI operation.
4. The browser polls task status and displays progress.
5. On completion, the UI reports whether a Harness restart is required.

The marketplace catalog is fetched from dsh-plugin.org. Reverse-proxy and container-specific setup belongs in [FORK.md](../FORK.md).
