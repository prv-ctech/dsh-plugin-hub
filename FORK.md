# prv-ctech DSH Plugin Hub

This fork tracks [dshplugin/dsh-plugin-hub](https://github.com/dshplugin/dsh-plugin-hub). `upstream` is the original Git remote; `origin` is [prv-ctech/dsh-plugin-hub](https://github.com/prv-ctech/dsh-plugin-hub). Only the Hub is changed; the DeepSeek Harness image is unchanged.

## Install on the Unraid Harness container

Remove the original `dsh-plugin` from the web profile if it is installed. Running both copies would register the same Hub routes and Settings section. From the container shell, install this fork:

```sh
dsh plugin --profile web remove dsh-plugin
dsh plugin --profile web add git+https://github.com/prv-ctech/dsh-plugin-hub.git
```

Skip the remove command if the original package is absent. Restart the **container through Unraid** after installation or updates. The Hub's desktop restart command cannot preserve this image's `--patch` and `--trusted-host` startup arguments; inside this image the button explains that the container must be restarted in Unraid.

Pangolin should forward the browser's original `Host` and `Origin` headers. Set the Harness container's `DSH_PUBLIC_HOST` to `deepseek.prvmr.com`, without a scheme. The Hub accepts POST requests only when `Host` matches `Origin`, and the HTTPS origin exactly matches that configured public host. Clearing or rewriting `Origin` causes a 403. Pangolin can keep using `192.168.13.9:3080` as its HTTP upstream on `prv.network`; that internal address is not a browser Origin.

Catalog and diagnostics requests use Node HTTP rather than a `curl` executable, which the Harness image does not include. The Hub's proxy setting, when used, must name a proxy reachable **inside the container**. `127.0.0.1` points to the container itself. A failed catalog fetch still needs network or proxy diagnosis in the container; this fork does not substitute stale data for a working connection.

## Package and releases

The package is [`@prv-ctech/dsh-plugin-hub`](https://github.com/prv-ctech/dsh-plugin-hub/pkgs/npm/dsh-plugin-hub) on GitHub Packages. A `v<package.json version>` tag triggers GitHub Actions to typecheck, test, build, publish the npm package, then create a GitHub Release. The in-app Hub update check reads this fork's latest GitHub Release, and its update action installs this fork from GitHub.

GitHub's npm registry requires authentication even for public packages. Installing the Git source as shown above avoids placing a package token in the container. For a registry install, configure the `@prv-ctech` scope for `https://npm.pkg.github.com` and authenticate with a classic token with `read:packages`; keep the token in a private npm configuration outside this repository. Never commit `.npmrc`, environment files, or credentials.
