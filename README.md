# WealthOS v0.8.1 — Stability Release

This release fixes the blank Signal cards seen in v0.8.

## Fixes
- Removed reliance on browser-created global variables for HTML element IDs
- Removed the `closePanel` element/function name conflict
- Added explicit element validation
- Added safe data normalization
- Added migration from v0.6 and v0.7 localStorage data
- Preserved the v0.8 design and feature scope
- Added a visible fallback message if a future rendering error occurs

## Scope
No new product features were added. This release focuses only on reliable rendering and saved-data compatibility.

## Publish
Replace these files in the GitHub repository:
- index.html
- styles.css
- script.js
- README.md

Suggested commit message:

`Stabilize v0.8 rendering and saved-data migration`
