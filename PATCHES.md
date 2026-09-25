# prv-ctech DSH Plugin Hub patch project

This is a private, independent downstream repository based on [dshplugin/dsh-plugin-hub](https://github.com/dshplugin/dsh-plugin-hub). It modifies the marketplace plugin package only; neither the original marketplace nor DeepSeek Harness is modified. GitHub reports this repo as `fork=false`, so it is not a GitHub-native fork. Its first patch commit (`6763452`) is based directly on upstream `main` at `b27f285`.

The upstream repository is unchanged. Commits and releases for this project go to its private `prv-ctech` repository; they do not open pull requests or push to the upstream project.

The private `origin` is `prv-ctech/dsh-plugin-hub`. The upstream repository is `dshplugin/dsh-plugin-hub`. GitHub Actions checks upstream's latest stable release hourly and syncs new release tags to private `main`.

## Maintained patches

- **Reverse-proxy Origin/Host validation:** accepts localhost or an exact HTTPS origin matching `DSH_PUBLIC_HOST`, while requiring the request Host to match the Origin host.
- **Outbound HTTP:** catalog requests and connectivity checks use Undici with the configured proxy, so they do not depend on a `curl` executable in the Harness environment.
- **Package identity:** uses the `@prv-ctech/dsh-plugin-hub` package and a separate Cordis bundle id and release channel.

## Automatic upstream updates

The workflow checks the original repository's latest stable GitHub Release tag once per hour. For a new `vX.Y.Z` release, it fetches that tag into a separate upstream ref, merges the upstream commit into this private `main`, sets the package version to `X.Y.Z`, runs `npm run check` and `npm run verify:release`, then publishes the GitHub Package and GitHub Release using the same `vX.Y.Z` tag.

The workflow keeps downstream workflows, ignore rules, and project docs from upstream changes. It uses the repository's `GITHUB_TOKEN`; it does not need an npmjs account or a personal access token. Upstream source and dependency scripts and package-file checks run in read-only validation jobs. A write job pushes the tested Git bundle; a separate publisher sends the validated archive without running package lifecycle scripts and creates the release.

If a merge conflict occurs or checks fail, the workflow stops before changing private `main` or publishing. Resolve the conflict or failure in this repository; the next hourly run retries the upstream release. The initial downstream release remains `v1.4.8-prv.1`; future releases use the upstream release tag exactly.

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

A `v<package.json version>` tag publishes `@prv-ctech/dsh-plugin-hub` to GitHub Packages at `npm.pkg.github.com` and creates a GitHub Release. Upstream-triggered releases use the same tag as the upstream stable release. The repository does not publish to npmjs.com. A deleted GitHub Package is recreated by the next new upstream release.

An owner can make the package public from **Package settings → Danger Zone → Change visibility → Public**. Public visibility does not make the source repository public. GitHub Packages still requires authentication for package pulls.

The release artifact includes `lib/`, `src/`, `client/`, `cordis.patch.yml`, `LICENSE`, `package.json`, and `README.md`. Project documentation, `.env`, and `.npmrc` files are excluded.
