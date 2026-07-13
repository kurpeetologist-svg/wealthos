# WealthOS v0.21.1 — Record Integrity & Recurring Activity

This release replaces v0.21.0 and combines Record Integrity with recurring financial expectations.

## Recurring activity

Users can mark supported records as:

- One-time
- Weekly
- Every two weeks
- Monthly
- Quarterly
- Annually
- Custom

Additional recurrence information includes:

- fixed or variable expected amount
- next expected date
- optional end date
- custom interval

Supported activity:

- Expenses
- Income
- Recurring bills
- Debt payments
- Transfers
- Roadmap contributions

## Expected is not completed

A recurring schedule creates an expectation.

It does **not**:

- count a bill as paid
- count income as received
- change an account balance
- change spending totals
- update a Roadmap

Actual financial totals change only when the activity is recorded.

## Record Library

The Library now supports recurrence filters and shows recurring badges.

Each record detail includes:

- schedule
- next expected date
- amount behavior
- source
- revision
- state
- audit history

Existing one-time records can be converted using **Make recurring**.

## Upcoming recurring activity

The Library shows recurring activity expected in the next 45 days.

This helps users anticipate:

- bills
- subscriptions
- paychecks
- scheduled transfers
- debt payments
- Roadmap contributions

## Data quality

WealthOS can flag repeated similar records and ask whether they may be recurring.

It does not automatically convert them.

## Principle

**Recurring creates an expectation. A recorded transaction confirms what actually happened.**

Suggested commit:

`Add recurring activity and expected commitments to Record Integrity`
