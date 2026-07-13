# WealthOS v0.22.0 — Intelligence v1

Phase 1, Sprint 3 introduces the first explainable WealthOS observation engine.

## Observation confidence

Each observation is classified as:

- Fact
- Comparison
- Emerging pattern
- Established pattern
- Estimate

The classification controls how strongly WealthOS speaks.

## Observation priority

The engine prioritizes:

1. Overdue expected obligations
2. Recorded negative cash flow
3. Upcoming recurring activity
4. Data-quality concerns
5. Roadmap progress
6. Period comparisons
7. Recurring commitment estimates
8. Largest spending category
9. Repeated similar income
10. Limited-history context

Only one observation leads the Workspace.

Up to three additional observations appear beneath it.

## Explainability

The Workspace observation now includes a Why? control showing:

- evidence
- source
- period
- confidence
- what the observation means

## Serious-state language

Humor is removed for observations involving:

- overdue expected bills
- recorded spending above recorded income
- serious financial concerns

## Supported observations

- overdue expected bill
- spending above recorded monthly income
- upcoming recurring activity
- data-quality concerns
- Roadmap completion and progress
- current versus previous period
- largest category
- monthly recurring commitment estimate
- repeated similar income
- limited-history disclaimer

## Trust rule

**Every observation must be explainable, proportionate, and earned by the data.**

Suggested commit:

`Build explainable WealthOS Intelligence v1`
