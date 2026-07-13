# WealthOS Core Data Model v1.0

## Architecture rule

**Capability → Data → Logic → UI**

The interface never becomes the source of truth. UI surfaces read from the Core.

## Entity groups

### Income
Fields:

- id
- amount
- category
- sourceName
- date
- month
- accountId
- note
- source metadata

### Expense
Fields:

- id
- amount
- category
- merchant
- date
- accountId
- essential classification
- recurringBillId
- tags
- note
- source metadata

### Account
Fields:

- id
- name
- type
- balance
- currency
- note
- source metadata

### Recurring bill
Fields:

- id
- name
- expectedAmount
- frequency
- nextDueDate
- accountId
- active
- note
- source metadata

A recurring bill is an expectation. It is not counted as spending until payment is recorded.

### Debt
Fields:

- id
- name
- type
- balance
- APR
- minimumPayment
- dueDate
- accountId
- note
- source metadata

### Debt payment
Fields:

- id
- debtId
- amount
- date
- accountId
- note
- source metadata

A debt payment reduces the corresponding recorded balance.

### Transfer
Fields:

- id
- fromAccountId
- toAccountId
- amount
- date
- note
- source metadata

Transfers change account balances but do not count as income or spending.

### Roadmap contribution
Roadmap contributions are stored in check-in history and update the selected Roadmap.

## Source metadata

Every canonical record carries:

- `method`: manual, connected, imported, calculated
- `reportedBy`
- `confidence`: reported, verified, estimated
- `verified`
- `imported`
- `createdAt`
- `updatedAt`

## Audit log

Audit history is append-only.

An audit entry contains:

- id
- occurredAt
- action
- entityType
- entityId
- sourceMethod
- detail

## Derived values

Do not store these as independent user inputs:

- daily spending
- weekly spending
- monthly spending
- category totals
- income totals
- monthly pace
- observations
- trends
- Roadmap percentages
- knowledge state

They must be calculated from canonical records.

## Knowledge state

### Beginning
No canonical records.

### Partial
Very few financial domains or less than one week of history.

### Growing
Several domains or multiple weeks of history.

### Established
Broad domain coverage and at least one month of history.

Knowledge state is not a score. It controls language confidence.

## Trust requirements

- Never call a user-reported record bank-verified.
- Never count transfers as spending or income.
- Never count an expected bill as already paid.
- Never claim a trend from one isolated event.
- Label estimates.
- Preserve historical records rather than silently rewriting them.
