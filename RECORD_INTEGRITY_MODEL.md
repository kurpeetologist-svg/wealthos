# WealthOS Record Integrity Model v1.0

## Core rule

Financial history is corrected through revisions, archives, and reversals—not silent deletion.

## Record states

### Active
Participates in current calculations and workflows.

### Archived
Used for long-lived objects that are no longer active.

Examples:

- closed account
- discontinued recurring bill
- paid-off or inactive debt
- retired Roadmap

Historical activity remains linked.

### Reversed
Used for financial activity that should no longer affect calculations.

Examples:

- incorrect expense
- duplicate income
- mistaken transfer
- incorrect debt payment
- incorrect Roadmap contribution

The original record remains visible.

## Safe correction

Every correction stores:

- previous values
- updated values
- revision number
- time of correction
- optional reason
- source method

## Reconciliation

Balances are rebuilt from:

- opening account balances
- active income
- active expenses
- active debt payments
- active transfers
- active Roadmap contributions

Debt balances are rebuilt from opening debt balances and active debt payments.

Roadmap progress is rebuilt from opening progress and active contributions.

## Data-quality checks

Warnings are invitations to review, not claims of error.

Current checks:

- potential duplicates
- same-account transfer
- missing recurring-bill due date
- stale manual account balance
- Roadmap over target
- debt-payment inconsistency

## Trust language

WealthOS should say:

- “Possible duplicate”
- “Worth reviewing”
- “This balance may be stale”
- “WealthOS does not yet know”

Avoid:

- “Invalid”
- “Bad data”
- “You made a mistake”
- “Error” unless an action truly cannot proceed
