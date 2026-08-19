# Nexovia — website (built output)

The deployed Nexovia marketing site. **This repo holds the build, not the
source.** Everything here is generated; do not hand-edit it, because the next
deploy overwrites it.

Live: <https://nexoviasecuritysolutions.com>

## Deploying

Cloudflare Pages, served from the repository root.

| setting | value |
|---|---|
| Build command | *(none — output is committed)* |
| Output directory | `/` |
| Node version | not needed, nothing is built here |

Every push to `main` publishes. Because the built files are committed directly,
Pages does not run a build step.

## Where the source lives

The Astro project — pages, components, styles, the WebGL hero and the build
config — is kept locally rather than in this repo. This repo is public, and the
project carries internal planning notes that should not be.

To publish a change: build the Astro project, copy `dist/` over the contents of
a clone of this repo, commit and push.

## What is in here

9 prerendered routes — `/`, `/platform`, `/hive`, `/capabilities`,
`/industries`, `/pricing`, `/pilot`, `/about`, `/contact` — plus `assets/`
(CSS, JS, images, video, the Three.js vendor bundle) and `_astro/` (hashed
bundles). No server, no runtime dependencies.

## History

Before this, the repo held a single hand-written `index.html`. That version and
the 10-page static site that followed it are both archived — see
`old-website/` in the backup repo. Nothing was lost.

---

Proprietary. All rights reserved.
