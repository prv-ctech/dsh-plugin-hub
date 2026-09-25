# prv-ctech DSH Plugin Hub patch project

This is a private, independent downstream repository based on [dshplugin/dsh-plugin-hub](https://github.com/dshplugin/dsh-plugin-hub). It modifies the marketplace plugin package only; neither the original marketplace nor DeepSeek Harness is modified. GitHub reports this repo as `fork=false`, so it is not a GitHub-native fork. Its first patch commit (`6763452`) is based directly on upstream `main` at `b27f285`.

The upstream repository is unchanged. Commits and releases for this project go to its private `prv-ctech` repository; they do not open pull requests or push to the upstream project.

The private `origin` is `prv-ctech/dsh-plugin-hub`. The `upstream` remote is `dshplugin/dsh-plugin-hub`. Upstream updates are manual; no workflow currently syncs them. At the last check on 2026-09-25, upstream `main` was still at `b27f285`.

## Maintained patches

- **Reverse-proxy Origin/Host validation:** accepts localhost or an exact HTTPS origin matching `DSH_PUBLIC_HOST`, while requiring the request Host to match the Origin host.
- **Outbound HTTP:** catalog requests and connectivity checks use Undici with the configured proxy, so they do not depend on a `curl` executable in the Harness environment.
- **Package identity:** uses the `@prv-ctech/dsh-plugin-hub` package and a separate Cordis bundle id and release channel.

## Sync from upstream

For a new checkout, add the original repository once. Then fetch and merge its latest `main` into this downstream `main`:

    git remote add upstream https://github.com/dshplugin/dsh-plugin-hub.git
    git fetch upstream
    git switch main
    git merge upstream/main

If `upstream` is already configured, skip `git remote add`. Review conflicts against the compatibility patches, then run `npm run check` and `npm run verify:release`. Push downstream commits and tags to `origin` only.

## Install in DeepSeek Harness

This repository publishes a Harness plugin package, not a Docker image. The source repository is private. After a release is published and its GitHub Package is public, configure a classic personal access token with `read:packages` for the operating-system user that runs `dsh`.

In that user's `~/.npmrc`:

    @prv-ctech:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_READ_TOKEN}

Provide `GITHUB_PACKAGES_READ_TOKEN` to the `dsh` process environment, then run:

    dsh plugin --profile web add @prv-ctech/dsh-plugin-hub

Remove the original `dsh-plugin` first; loading both packages registers duplicate routes and settings. If the active profile does not apply package changes live, restart the DeepSeek Harness Web process using its normal service controls.

## Reverse proxy and catalog

Forward the browser's original Host and Origin through Pangolin. Set `DSH_PUBLIC_HOST=deepseek.prvmr.com`; Pangolin targets `http://192.168.13.9:3080` on `prv.network`. The internal Harness address is not a browser Origin. Catalog and diagnostics requests use the configured proxy from the DeepSeek Harness process; `127.0.0.1` refers to that process's environment.

## GitHub Packages releases

A `v<package.json version>` tag runs checks, publishes `@prv-ctech/dsh-plugin-hub` to GitHub Packages at `npm.pkg.github.com`, and creates a GitHub Release. It does not publish to npmjs.com. A deleted GitHub Package is recreated by the next successful version-tag workflow.

An owner can make the package public from **Package settings → Danger Zone → Change visibility → Public**. Public visibility does not make the source repository public. GitHub Packages still requires authentication for package pulls.

The release artifact includes `lib/`, `src/`, `client/`, `cordis.patch.yml`, `LICENSE`, `package.json`, and `README.md`. Project documentation, `.env`, and `.npmrc` files are excluded.
