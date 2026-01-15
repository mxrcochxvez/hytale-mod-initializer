# Hytale Mod Initializer

## Run the initializer
1) Open the folder where you want the mod generated (or choose a target folder when prompted).
2) Command Palette (ctrl + shift + P / CMD + shift + P) → **Initialize Hytale Mod**.
3) Fill the prompts:
   - **Group ID (org)** (e.g., `dev.example`)
   - **Mod name** (artifactId)
   - **Java package name** (defaults to `groupId.modname`)
   - **Main class name**
   - **Author name / email / URL** (optional email/URL)
   - **Description**
4) Wait for the download/extract/apply steps to finish; you’ll see a success notification with the target path.

## What it generates
- Downloads the Hytale plugin template, extracts it, and rewrites package paths, class names, pom.xml, and manifest.json based on your inputs.
- Produces a ready-to-build Java plugin project in the selected target folder.

## Troubleshooting
- If download fails: ensure internet access; the template URL is `https://codeload.github.com/HytaleModding/plugin-template/zip/refs/heads/main`.
- If the command is missing: reinstall the VSIX and reload VS Code.
- If rename errors occur on Windows paths: ensure the target folder is empty or new; then rerun.

## Author/publishing docs
See `docs/distribute.md` for Marketplace publishing steps, versioning, and VSIX distribution notes.

## Icon
The extension icon is `images/icon.svg`. Replace it with your own (square SVG/PNG) and keep the `"icon": "images/icon.svg"` entry in `package.json`.
