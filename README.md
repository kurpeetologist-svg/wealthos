# WealthOS v0.21.3 — Record Library v2

This release replaces v0.21.2.

## What changed

The Record Library no longer behaves like a database query form.

The primary interaction is now one search box:

> Search your financial history

Search runs as the user types. There is no Search button.

## Search coverage

The primary search checks:

- Merchant
- Bill name
- Account
- Debt
- Roadmap
- Category
- Note
- Amount
- Date
- Month name
- Record type
- Source
- Recurrence
- Status

## Filters

Common filters are available as quick controls:

- All time
- This month
- Last 30 days
- Recurring

Advanced filters are collapsed behind:

> More filters +

The user never needs to fill multiple boxes to find a transaction.

## Search results

Results are ranked by relevance:

1. Exact title match
2. Title begins with query
3. Title contains query
4. Subtitle match
5. Other record metadata
6. Amount match

## Recent searches

Recent search terms are saved during the session and can be selected again.

## Empty states

When no result is found, WealthOS suggests searching by:

- merchant
- account
- bill
- amount
- category
- month
- note

## Principle

**People remember financial things—not database fields.**

Suggested commit:

`Redesign Record Library around one intelligent search`
