# DSH Plugin Hub — prv-ctech downstream patch

An independently maintained patch of the [original DSH Plugin Hub](https://github.com/dshplugin/dsh-plugin-hub), with reverse-proxy Origin/Host and outbound HTTP proxy compatibility for DeepSeek Harness deployments. It changes neither the original marketplace nor DeepSeek Harness.

Tagged releases publish `@prv-ctech/dsh-plugin-hub` to [GitHub Packages](https://github.com/prv-ctech/dsh-plugin-hub/pkgs/npm/dsh-plugin-hub); this repository does not publish to npmjs.com. GitHub Packages requires authentication for downloads; see the [GitHub authentication guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).

GitHub Actions checks upstream's latest stable release hourly. A new upstream tag is merged with the downstream patches, checked, and published under that same tag. Merge conflicts or failed checks stop the release.

## Links

- [Patch, upstream sync, and installation guide](https://github.com/prv-ctech/dsh-plugin-hub/blob/main/PATCHES.md)
- [Original project and feature documentation](https://github.com/dshplugin/dsh-plugin-hub)
- [License](LICENSE)
