# Hytale Mod Initializer

VS Code extension that scaffolds a Hytale mod from the HytaleModding plugin template with guided prompts.

## Prerequisites
- VS Code 1.90+ installed
- Node.js and npm installed
- `vsce` available via `npx vsce ...`
- A VS Code Marketplace publisher ID (no spaces) and a Personal Access Token (PAT) with Marketplace publish scope

## Local build vs. package
- **Build only**: `npm run compile` (TypeScript → `out/`)
- **Package for install/distribution**: `npm run package` (builds and creates `dist/hytale-mod-initializer.vsix`)

## Install locally from VSIX
- Command Palette → **Extensions: Install from VSIX…** → select `dist/hytale-mod-initializer.vsix`
- Or CLI: `code --install-extension dist/hytale-mod-initializer.vsix --force`

## Publish to the VS Code Marketplace
1) **Set publisher in `package.json`**
   - Replace `publisher` with your Marketplace publisher ID (no spaces).
2) **Login to the publisher** (one-time per machine)
   ```bash
   npx vsce login <publisher>
   # paste your Marketplace PAT when prompted
   ```
3) **Publish**
   - Patch release: `npx vsce publish patch`
   - Minor release: `npx vsce publish minor`
   - Major release: `npx vsce publish major`
   - Or publish current version: `npx vsce publish`

> Tip: `vsce` will auto-increment the version if you use `patch|minor|major`. If you publish with `npx vsce publish` directly, bump `version` in `package.json` first.

## Release checklist
- `npm install`
- `npm run package` (ensure it succeeds)
- Confirm `publisher`, `name`, `displayName`, `description`, `license`, `repository` in `package.json`
- Optionally validate by installing the freshly built VSIX locally before publishing

## Notes
- The extension downloads the upstream template at runtime; it doesn’t bundle the template code. Users remain subject to the template repository’s terms.
- `dist/` is ignored in git; the VSIX is for installation/distribution only.
- Add an icon by placing `images/icon.png` (square PNG, ~128x128) and keep the `"icon": "images/icon.png"` entry in `package.json`.
