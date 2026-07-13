# WealthOS v0.15.1 — Context Library

This release implements Behind the Number as a conversational completion experience.

## What changed

- Behind the Number no longer looks like a separate feature card.
- WealthOS speaks immediately after confirming an action.
- Every explanation includes:
  - a concise concept
  - a short explanation
- A reusable Context Library replaces a handful of disconnected examples.
- Merchant names and notes can later support alias-based context matching.
- Weekly and Monthly Check-ins use the same Context Library structure.

## Lesson vs. Behind the Number

**Lesson** is a deeper, independent financial-literacy curriculum.

**Behind the Number** is an immediate conversation caused by the user’s action.

## Included

- `CONTEXT_LIBRARY.md`
- updated Founder Changelog
- updated WealthOS Design System

## Principle

**Context should feel like WealthOS speaking—not like another feature asking for attention.**

## Publish

Replace:

- index.html
- styles.css
- script.js
- README.md
- FOUNDER_CHANGELOG.md
- WEALTHOS_DESIGN_SYSTEM.md
- PROTECTED_IDEAS.md
- CONTEXT_LIBRARY.md

Suggested commit:

`Integrate Behind the Number with a reusable Context Library`
