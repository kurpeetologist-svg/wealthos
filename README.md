# WealthOS v0.9.2.1 — Actionable Signals

## Fixes

### Check-in source
“Check in yourself” is now a real clickable route and moves the user to Weekly and Monthly Check-ins.

### Signal actions
Each Signal now has an intent-based action:

- Growth — Understand why
- Attention — Review
- Progress — Continue
- Next Step — Take the next step

### Signal provenance
Every Signal reveals its source:

- Growth: Monthly Check-ins
- Attention: Tax details
- Progress: Savings Challenge or emergency fund
- Next Step: Derived from the other Signals

### Progress corrections
- A challenge at 0% now says “ready to begin”
- Users can record a first contribution
- Monthly savings can update an active Savings Challenge
- Contributions are saved in local browser history

### Attention corrections
- “Not set” has been replaced with welcoming starting language
- Users can jump directly to tax details

## Principle

**Every Signal must reveal its source and offer a next action.**

Nothing in WealthOS should exist without an origin.

## Publish
Replace:
- index.html
- styles.css
- script.js
- README.md

Suggested commit:

`Make Signals actionable and explain their data sources`
