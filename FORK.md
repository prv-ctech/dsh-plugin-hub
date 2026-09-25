# prv-ctech DSH Plugin Hub

This is an unofficial fork of [dshplugin/dsh-plugin-hub](https://github.com/dshplugin/dsh-plugin-hub). It adds reverse-proxy and Unraid deployment compatibility changes. The DeepSeek Harness image and upstream repository are not modified.

## Install from GitHub Packages

The source repository stays private. After the package is republished and changed to Public, install it from GitHub Packages. GitHub Packages still requires authentication for pulls, so add a classic personal access token with `read:packages` to a protected registry config inside the Harness container. The `.npmrc` file below routes the `@prv-ctech` scope to GitHub Packages. The release workflow publishes this package there, not to npmjs.com. Do not put the token in the repository or the install command.

In the Harness container's `~/.npmrc`:

    @prv-ctech:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_READ_TOKEN}

Set `GITHUB_PACKAGES_READ_TOKEN` in the container environment, then run:

    dsh plugin --profile web add @prv-ctech/dsh-plugin-hub

Remove the original `dsh-plugin` first if it is installed; running both copies registers duplicate routes and settings. Restart the container through Unraid after installing or updating so its startup arguments are preserved.

## Reverse proxy and catalog

Forward the browser's original Host and Origin headers through Pangolin. For this deployment, set `DSH_PUBLIC_HOST=deepseek.prvmr.com`; Pangolin targets `192.168.13.9:3080` on `prv.network`. The internal Harness address is not a browser Origin.

Catalog and diagnostics requests use Node HTTP. Any configured proxy must be reachable from inside the container; 127.0.0.1 refers to the container itself.

## GitHub Packages and releases

A v<package.json version> tag runs checks, publishes @prv-ctech/dsh-plugin-hub to GitHub Packages at npm.pkg.github.com, and creates a GitHub Release. The workflow does not publish to npmjs.com. The deleted GitHub Package will be recreated by the next successful version-tag workflow.

After the package is recreated, an owner can make the package public from the package page: **Package settings → Danger Zone → Change visibility → Public**. This makes the package publicly visible and cannot be undone. It does not make the source repository public. GitHub Packages still requires authentication for package pulls, including public packages.

The current package allowlist includes `lib/`, `src/`, `client/`, `cordis.patch.yml`, and `LICENSE`; npm also includes `package.json` and `README.md`. The verified package file list excludes project documentation, `.env`, and `.npmrc` files.
