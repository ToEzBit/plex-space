# Distribute unsigned universal builds via GitHub Releases

With v0.1.0 we began shipping Plex Space publicly. Distribution is via **GitHub Releases** (the `.dmg` and `.zip` are attached as release assets, never committed — `dist/` is gitignored), the build is a **universal binary**, and it is **not code-signed or notarized** — deliberately and permanently. Users clear macOS Gatekeeper with `xattr -cr` once per download (documented in the README and each release's notes).

## Decisions

- **Channel: GitHub Releases.** Releases are cut manually with `gh release create v<version>` and the assets uploaded to that tag. The binaries are not part of git history.
- **Universal binary.** `npm run dist:mac` runs `electron-builder --mac --universal`, lipo-ing arm64 + x64 (including the `node-pty` native module) into one app, so a single download runs on every supported Mac.
- **No signing, no notarization — permanently.** `electron-builder.yml` sets `mac.notarize: false` and no Developer ID identity is configured. Gatekeeper is cleared by the user with `xattr -cr "/Applications/Plex Space.app"`.

Why permanently unsigned:
- An Apple Developer ID is a **$99/year recurring cost** for a free, personal tool — not worth it.
- The audience is developers who run CLI agents (Claude Code, Codex) from a terminal. Running `xattr -cr` once is squarely within that audience's comfort, so the workaround is not a real barrier for the people the app is for.

## Considered Options

- **Sign + notarize with an Apple Developer ID** — rejected: recurring cost plus CI secret management, to remove a one-time `xattr` step for an audience that does not need it removed.
- **Per-arch builds (separate arm64 and x64 `.dmg`s)** — rejected: smaller per file, but forces the user to know which chip they have. The universal binary removes that choice at the cost of download size.

## Consequences

- **The `xattr -cr` step is required on every download and every update, forever.** The app will never open by double-click from a fresh download. This permanently caps the practical audience to terminal-comfortable users — accepted, because that *is* the audience.
- **Auto-update is off the table.** electron-updater / Squirrel.Mac require a signed app, so there is no in-app update path; releases are always manual. The `publish: { provider: generic, url: https://example.com/... }` block in `electron-builder.yml` is leftover scaffolding, not a working updater.
- **Larger download** (~200 MB) than an arch-specific build, since both architectures ship in one artifact. Accepted for the simpler "one download works everywhere" story.
- This is the macOS distribution story only; Windows/Linux remain out of scope per ADR-0005, which is a porting problem (POSIX shell, APFS clonefile), not a signing one.
