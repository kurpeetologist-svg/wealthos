# WealthOS v0.14.1 — What WealthOS Noticed

This patch restores interpretation to Spending Snapshot.

## Snapshot hierarchy

1. Facts
2. What WealthOS noticed
3. Supporting records

## Rule-based insights

WealthOS can now surface observations such as:

- restaurant spending decreased compared with last month
- a category increased compared with last month
- a category is holding steady
- the largest current category
- the largest category today or this week

The application only describes a trend when comparable history exists. Otherwise, it clearly says that more history is needed.

## Principle

**Data tells the user what happened. Interpretation helps them understand why it matters.**

## Retention

Saved data migrates from v0.14.0 and earlier releases.

## Publish

Replace:

- index.html
- styles.css
- script.js
- README.md
- FOUNDER_CHANGELOG.md

Suggested commit:

`Restore interpretation with What WealthOS Noticed`
