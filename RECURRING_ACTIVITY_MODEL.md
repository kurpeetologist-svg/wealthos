# WealthOS Recurring Activity Model v1.0

## Purpose

Recurring activity helps WealthOS distinguish:

- one-time events
- expected obligations
- subscriptions
- recurring income
- scheduled transfers
- repeated debt payments
- regular Roadmap contributions
- habits that are repeating but were not previously labeled

## Recurrence fields

- frequency
- amount behavior
- next expected date
- optional end date
- custom interval
- active state
- originating record

## Supported frequencies

- once
- weekly
- biweekly
- monthly
- quarterly
- annual
- custom

## Amount behavior

### Fixed

The expected amount is usually stable.

Examples:

- rent
- subscription
- salary
- loan payment

### Variable

The activity recurs, but the amount may change.

Examples:

- electricity
- groceries
- freelance income
- credit-card payment

## Core distinction

A recurring schedule is an expectation.

It must never be counted as completed activity until an actual record confirms it.

## Future connected-account behavior

When connected transactions become available, WealthOS may:

1. compare an incoming transaction with an expectation
2. suggest a match
3. ask the user to confirm when confidence is limited
4. preserve the expected and actual amounts
5. advance the next expected date

It must not silently assume a match when merchant, amount, or timing is ambiguous.

## Data-quality language

Use:

- “This may be recurring.”
- “You have recorded this several times.”
- “Would you like WealthOS to expect it again?”
- “Expected, not yet completed.”

Avoid:

- “We detected a subscription” unless verified
- “This bill was paid” when only a schedule exists
- “Your paycheck arrived” without a recorded or connected transaction
