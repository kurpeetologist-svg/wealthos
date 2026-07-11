# WealthOS v0.9.0 — Private Preview

## First-visit experience

New users no longer see demo figures or blank financial cards.

They see:

- Good morning!
- Let's see where you stand today.
- Every financial story begins somewhere.
- Today is a great place to start.
- Begin Your Story

The guided first check-in collects only enough information to begin:
- optional preferred name
- currency
- first income month and amount
- optional Savings Challenge

## Returning users

Returning users keep:
- saved profile
- income history
- Today’s Focus
- Signals
- Timeline
- Stories
- Savings Challenge
- About You

## Saving and retention

Private Preview data is saved in the browser using `localStorage`.

- It persists after closing and reopening the browser.
- It remains separate for every tester and device.
- Existing v0.6–v0.8 data is automatically migrated.
- It does not sync between devices.
- Clearing site data or using a different browser removes access to the local copy.

Secure login, cloud backup, and cross-device sync belong to the next infrastructure phase.

## Language principles

- The Lobby welcomes. It doesn't analyze.
- Every blank state feels like the beginning of a story.
- Never punish someone for being new.
- Prefer check-in, chapter, Story, Focus, and Timeline over accounting language.

## Publish

Replace:
- index.html
- styles.css
- script.js
- README.md

Suggested commit:

`Launch WealthOS Private Preview first-visit experience`
