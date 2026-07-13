# WealthOS Intelligence v1

## Purpose

WealthOS Intelligence converts canonical financial records into explainable observations.

It does not provide personalized financial advice.

## Observation shape

Every observation contains:

- id
- type
- priority
- severity
- title
- summary
- meaning
- period
- source
- evidence
- optional action
- generated time

## Confidence levels

### Fact
Directly supported by current records.

### Comparison
Compares two valid periods.

### Emerging pattern
Repeated or comparable activity exists, but the history is still limited.

### Established pattern
Supported by broader repeated history.

### Estimate
Calculated from assumptions, projections, or normalized recurring schedules.

## Priority order

1. overdue
2. negative cash flow
3. upcoming obligations
4. data quality
5. Roadmap progress
6. comparison
7. recurring estimate
8. category composition
9. repeated income
10. limited history

## Explainability requirement

Every surfaced observation must answer:

- What did WealthOS notice?
- What records support it?
- What period is being evaluated?
- Where did the data come from?
- How confident is the language?
- What does it mean?
- Is there a useful next action?

## Serious-state override

Humor is disabled when an observation concerns:

- overdue obligations
- negative cash flow
- debt stress
- housing instability
- medical hardship
- tax penalties
- insufficient essentials

## Guardrails

- One day is not a lasting pattern.
- One record is not a trend.
- Expected activity is not completed activity.
- Recurring totals are estimates unless every amount is fixed and verified.
- Missing data must be acknowledged.
- A comparison is not a judgment.
- Connected accounts will not make assumptions automatically when matching confidence is low.
