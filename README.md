# WealthOS v0.20.0 — The Core

Phase 1, Sprint 1 establishes the canonical data foundation for WealthOS.

## Unified Record capability

The header action is now **Record**. Users can record:

- Expense
- Income
- Recurring bill
- Account balance
- Debt
- Debt payment
- Transfer
- Roadmap contribution

Quick Add remains the fast expense path, but it now uses the same Core record engine.

## Canonical entities

WealthOS now stores:

- `incomes`
- `expenses`
- `accounts`
- `recurringBills`
- `debts`
- `debtPayments`
- `transfers`
- `roadmaps`
- `checkins`
- `memories`
- `auditLog`

## Provenance

Every new financial record receives source metadata:

- method
- reported by
- confidence
- verified status
- imported status
- creation time
- update time

Manual records are explicitly treated as **user-reported**, not bank-verified.

## Audit history

The audit log is append-only. It records:

- created entities
- changed debt balances
- changed Roadmap progress
- transfers between accounts
- source method
- timestamp

## Derived behavior

A single record can update:

- Workspace
- Today / This Week / This Month
- Snapshot
- account balances
- debt balances
- Roadmap progress
- observations
- Financial Memory

Transfers are excluded from income and spending.

Recurring bills are stored as expected obligations and are not treated as paid expenses until the user records payment activity.

## Knowledge states

The Financial Foundation reports:

- Beginning
- Partial
- Growing
- Established

These states are based on domain coverage and recorded history. They control how confidently WealthOS should speak.

## Principle

**WealthOS only speaks with the confidence its data deserves.**

## Publish

Replace the entire current build with this directory.

Suggested commit:

`Build the WealthOS Core data layer and unified Record flow`
