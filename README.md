# WealthOS v0.21.2 — Recurring Bill Save Fix

This release replaces v0.21.1.

## Fixed

The recurring-bill form previously duplicated scheduling controls and pushed the Save action below the visible part of the modal.

## Changes

- Save record stays visible in a sticky action bar.
- Removed duplicate Frequency and Next Due Date fields.
- The Recurrence section is now the single source of truth.
- Recurring bills require a repeating schedule.
- Recurring bills require a next expected date.
- Added a clear “expected, not completed” explanation.
- The action bar explains what saving each record type will change.
- After saving a bill, WealthOS opens it in the Record Library.

## Trust rule

A recurring bill is an expectation. It does not count as spending until the actual charge is recorded.

Suggested commit:

`Fix recurring bill save flow and remove duplicate schedule fields`
