# WealthOS v0.21.4 — Record Results Fix

This release replaces v0.21.3.

## Problem fixed

Search correctly found matching records, but results appeared below:

- Recent searches
- Data quality
- Upcoming recurring activity

This made a successful search look broken.

## Changes

- Search results now appear immediately under the search summary.
- Added a visible Search Results heading.
- Recent searches hide during an active search.
- Data quality and upcoming activity now appear after results.
- Matching results can be scrolled into view after typing.
- No-match guidance appears exactly where results would normally appear.

## Principle

**When a user searches, the answer becomes the next thing they see.**

Suggested commit:

`Move Record Library search results above supporting panels`
