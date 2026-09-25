# Development

Local build, test, and release guidance for the prv-ctech fork.

Before changing Harness integration, read [reference.md](reference.md). Verify host behavior against official documentation and source instead of guessing.

## Requirements

- Node.js 22.6 or newer.
- npm, with package-lock.json kept in sync when dependencies change.
- A running DeepSeek Harness instance for interactive verification.

## Commands

| Command | Purpose |
| --- | --- |
| npm run build | Build the server and browser bundle |
| npm run typecheck | Type-check client, server, and tests |
| npm test | Run the Node.js test suite |
| npm run check | Type-check, test, and build; same checks used by CI |
| npm run reload | Restart the local Harness development server |
| npm run verify:release | Validate release metadata and package contents |

The reload script targets the local development Harness. It is not the restart path for the Unraid container.

## Development loop

Harness loads plugin bundles at startup. After changing code, rebuild and reload the local development instance:

    npm run build
    npm run reload

The development profile links this project from the local filesystem.

## Release

1. Update the version in package.json and add release notes to CHANGELOG.md.
2. Run npm run check and npm run verify:release.
3. Push a tag matching the package version, such as v1.4.9-prv.1.
4. GitHub Actions publishes the package to GitHub Packages at npm.pkg.github.com and creates a GitHub Release. The workflow does not publish to npmjs.com and authenticates with its repository-scoped GITHUB_TOKEN.
5. After the package is recreated, open **Package settings → Danger Zone → Change visibility → Public**. Public visibility makes the package publicly visible and cannot be undone; the source repository remains private. GitHub Packages still requires authentication for package pulls, including public packages.

The current package allowlist includes `lib/`, `src/`, `client/`, `cordis.patch.yml`, and `LICENSE`; npm also includes `package.json` and `README.md`. The verified package file list excludes project documentation, `.env`, and `.npmrc` files.

## Layout

    src/server/       Harness plugin and local HTTP API
    src/client/       Settings interface and browser bundle source
    scripts/run/      Development and restart scripts
    scripts/tools/    Build checks and release utilities
    tests/            Node.js tests
    docs/             Architecture and development documentation
