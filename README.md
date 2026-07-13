# WealthOS v0.16.0 — Workspace

This release changes the returning-user homepage from a sequence of sections into an active financial Workspace.

## Workspace hierarchy

1. Today’s Focus
2. Today’s Snapshot
3. Today’s Activity
4. What WealthOS Noticed
5. Continue
6. Lesson Waiting
7. Detailed Signals and records

## “What should I do next?”

The Workspace chooses one primary action based on current information:

- Record today’s spending
- Complete a Weekly Check-in
- Close the month
- Continue a savings goal
- Review Spending Snapshot

Only one action is emphasized at a time.

## Observation Engine

The same Observation Engine now powers:

- Workspace
- Spending Snapshot
- Snapshot closing explanation

Developer-facing text about where numbers came from has been replaced with useful implications or honest statements about limited history.

## Principle

**The Workspace should orient the user, offer one useful next step, and send them back into real life with more clarity.**

## Retention

Saved data migrates automatically from v0.15.1 and earlier versions.

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

`Build the WealthOS Workspace and unify observations`
