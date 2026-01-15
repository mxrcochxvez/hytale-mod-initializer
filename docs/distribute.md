# Distribute the Hytale Mod Initializer (Author Guide)

This guide is for you, the extension author, to ship the extension to users via the VS Code Marketplace or VSIX side-load.

## Prerequisites
- VS Code 1.90+
- Node.js + npm
- `npx vsce` available
- Marketplace publisher ID (no spaces) and PAT with publish scope

## Prepare metadata
- In `package.json`: set `publisher`, `name`, `displayName`, `description`, `repository`, `license`, and `icon` (points to `images/icon.svg`).
- Bump `version` before each publish (or let `vsce publish patch|minor|major` bump it).

## Build and package
```bash
npm install
npm run package   # builds and produces dist/hytale-mod-initializer.vsix
```

## Publish to Marketplace
1) Login (one-time per machine):
   ```bash
   npx vsce login <publisher>
   # paste PAT when prompted
   ```
2) Publish:
   - Patch: `npx vsce publish patch`
   - Minor: `npx vsce publish minor`
   - Major: `npx vsce publish major`
   - Exact version: bump `package.json` then `npx vsce publish`

## Side-load (share VSIX directly)
- Send `dist/hytale-mod-initializer.vsix` to users.
- Install locally: Command Palette → "Extensions: Install from VSIX…" or `code --install-extension dist/hytale-mod-initializer.vsix --force`.

## Release checklist
- `npm run package` succeeds
- Version bumped
- Publisher set correctly
- Icon present at `images/icon.svg`
- Optional: install the fresh VSIX locally to sanity check the command works

## Notes
- The extension downloads the upstream template at runtime; it does not bundle the template code. Users are subject to the template repo’s terms.
- Keep `dist/` out of git; it’s for distribution only.
- If you see warnings about bundle size, consider bundling with webpack/tsup, but current flow is functional for publishing.
