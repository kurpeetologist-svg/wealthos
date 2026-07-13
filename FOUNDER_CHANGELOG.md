# WealthOS Founder Changelog

## v0.10.1 — Financial Desk

### Why this exists

Early testers understood the purpose of WealthOS and appreciated that it felt calm and unintimidating. However, one tester described the visual experience as closer to a wellness or vegan website than a financial product.

We did not respond by adding generic money illustrations, coins, dollar signs, or stock-market charts.

Instead, we defined **WealthOS Materials**: a visual language built from the quiet physical artifacts people already associate with their financial lives—notes, ledgers, forms, folders, statements, receipts, tabs, and bookmarked pages.

### What changed

- Today’s Focus now feels like the current note on a financial desk.
- The monthly summary feels like a ledger sheet.
- Lesson feels like a bookmarked page.
- Check-in feels like a working form.
- Timeline feels like a set of filed records.
- Spending Snapshot feels like a receipt summary.
- A new Continue exploring path helps users see where they can go next.

### What we learned

People do not need WealthOS to look like a bank.

They need it to feel unmistakably connected to real financial life.

### What remains unresolved

Testers still need a stronger reason to continue after entering information.

Continue exploring is a bridge—not the final answer.

Sprint 2.2 will build the actual WealthOS loop:

**Check in → Understand → Learn → Take one small action → Return**

## v0.11.0 — Living Cards

### Why this exists

The Financial Desk gave WealthOS a coherent material language, but the interface still felt closer to a report than an app.

A comparison with Stripe clarified the gap: Stripe's cards feel powerful because they contain tangible product demonstrations and working surfaces. WealthOS cards mainly presented finished information.

### What changed

- Signal cards now contain functional financial objects.
- Card compositions vary according to purpose.
- Check-ins preview what the user will enter.
- Spending Snapshot behaves more like a receipt.
- Next Step visibly invites action.
- The interface has more depth and responsiveness without using gradients.

### What we learned

Materials create identity.

Instruments create action.

WealthOS needs both.

### Principle

**Cards are working surfaces, not containers for reports.**

## v0.12.0 — The Financial Desk

### Why this exists
We formalized the WealthOS Design System v1.0 around one metaphor:

> **Your financial life deserves a place to live.**

### What changed
- The Financial Desk assembles through motion.
- Paycheck slides in.
- Receipt lands.
- Savings envelope appears.
- Lesson card clips into place.
- Timeline journal slides into view.
- Check-in form settles.
- Reduced-motion preferences are respected.
- The Design System v1.0 is stored with the project.

### Core Philosophy
**Build confidence with money, one decision at a time.**

### Principle
**Motion should explain, never entertain.**

## v0.13.0 — The First Complete Loop

### Why this exists

Private-preview feedback exposed a fundamental gap:

> After entering information, users did not know what to do next.

WealthOS had valuable sections, but it did not yet behave like one continuous product experience.

### What changed

- Check-ins now end with a calm completion moment.
- WealthOS explains what changed.
- A Lesson follows the action.
- Exactly one Small Step invites the user forward.
- The Timeline visibly receives a new chapter.
- The next visit remembers the previous check-in.

### The Loop

**Check in → Understand → Learn → Take one step → Remember → Return**

### What we learned

A useful feature is not enough.

The user needs closure, meaning, and continuity.

### Principle

**After every meaningful action, the user should know what happened, why it matters, and what they can do next.**

## v0.14.0 — Quick Add

### Why this exists
WealthOS was built around confidence growing one decision at a time, but the application still depended mainly on weekly and monthly reflection.

Quick Add brings WealthOS into the moment when financial life actually happens.

### What changed
- Users can record a purchase immediately.
- Each purchase updates daily, weekly, and monthly spending.
- Spending Snapshot identifies its information source.
- Snapshot calculations are separated from user inputs.
- Recent purchase records appear as receipts.
- Lessons teach concrete financial concepts.
- Timeline can remember Quick Add activity.

### Principle
**Users enter facts. WealthOS provides context.**

## v0.14.1 — What WealthOS Noticed

### Why this exists

Quick Add made Spending Snapshot much stronger at reporting facts and showing supporting records.

However, the interpretation layer was lost.

WealthOS should not only show users their data. It should help them notice meaningful changes without judging them.

### What changed

- Spending Snapshot now includes **What WealthOS noticed**.
- Current categories can be compared with the same categories from the prior month.
- Daily and weekly views receive timeframe-specific observations.
- Every insight includes an optional explanation of how it was calculated.
- WealthOS explicitly avoids claiming a trend when history is insufficient.

### Principle

**Data tells the user what happened. Interpretation helps them understand why it matters.**

## v0.15.0 — Behind the Number

### Why this exists

Users asked WealthOS to teach them something relevant to the action they had just completed, but turning every next step into another Lesson would make the product feel like homework.

We separated two educational systems.

### Lesson

A structured financial-literacy curriculum that exists independently of user activity.

### Behind the Number

A brief explanation triggered by a user’s action and presented immediately inside the completion moment.

### What changed

- Quick Add now explains the financial concept connected to the recorded category.
- Weekly and Monthly Check-ins receive action-specific context.
- Context requires no separate page or reading task.
- Context appears once, in the moment, rather than becoming another permanent feature.

### Principle

**Lessons build long-term literacy. Context explains the user’s financial life in the moment.**

## v0.15.1 — Context Library

### Why this exists

The first Behind the Number release contained the correct content, but it did not deliver the intended experience clearly enough.

The feature still looked like another card rather than WealthOS speaking in response to the user.

### What changed

- The completion experience now pauses after confirmation.
- WealthOS says, “One thing worth knowing…”
- A financial concept and brief explanation follow naturally.
- A reusable Context Library replaces a short list of disconnected examples.
- Categories, aliases, check-ins, and future financial actions can use the same architecture.

### What we learned

Correct content is not enough.

Placement, timing, and voice determine whether contextual education feels like a conversation or another reading exercise.

### Principle

**Context should feel like WealthOS speaking—not like another feature asking for attention.**

## v0.16.0 — Workspace

### Why this exists

WealthOS had meaningful features, but returning users still encountered them as a long sequence of page sections.

A financial operating system should immediately answer:

> **What should I do next?**

### What changed

- The returning-user home experience is now called Workspace.
- One primary action is emphasized at a time.
- Today’s financial picture is visible without opening a detailed report.
- Recent activity serves as the app’s working memory.
- What WealthOS Noticed appears directly in the Workspace.
- The latest financial moment can be continued without searching.
- Lesson sits quietly as a bookmarked resource.
- Detailed Signals remain available below the Workspace.
- Developer-facing Snapshot copy was replaced with useful observation language.

### What we learned

A Workspace is not another collection of cards.

It is an environment that gives the user orientation, continuity, and one clear invitation.

### Principle

**The Workspace should orient the user, offer one useful next step, and send them back into real life with more clarity.**

## v0.17.0 — Memory & Roadmaps

### Why this exists

Workspace answered what the user should do today.

The next product questions were:

> What has changed over time?

and

> Where am I going?

### What changed

- Today’s income is presented as a Paycheck.
- Today’s spending is presented as a Receipt.
- Goal progress is presented as an Envelope.
- Financial Memory quietly records meaningful moments.
- Users can create and manage multiple life-centered Roadmaps.
- Roadmaps show next milestones and approximate timing.
- Contributions can be directed to a selected Roadmap.
- Existing Savings Challenge data migrates without being lost.

### What we learned

Transactions describe activity.

Memory describes progress.

Roadmaps give that progress a destination.

### Principle

**Financial Memory shows where the user has been. Roadmaps show where they are going.**

## v0.18.0 — Personality & Craft

### Why this exists

Minimal does not have to mean sterile.

WealthOS needed a voice that could carry empathy, intelligence, restraint, and a small amount of humor without turning financial life into a joke.

### What changed

- Workspace Focus now includes a quiet personality line.
- Paycheck, Receipt, and Envelope documents use rotating editorial asides.
- What WealthOS Noticed now includes a signature voice and a subtle human observation.
- Behind the Number includes category-aware wit.
- The Context Library and Personality Library remain separate so factual education is never dependent on humor.
- Hover motion adds tactility without turning the product into a toy.

### What we learned

Humor is useful when it lowers anxiety or makes a concept memorable.

It is harmful when it minimizes a real financial concern or makes the user feel observed rather than understood.

### Principle

**A small smile can reduce anxiety. A joke should never reduce trust.**

## v0.19.0 — Production Foundation

### Why this exists

The product logic and the approved prototype are now mature enough to begin a deliberate production rebuild rather than continuing cosmetic patches.

### What changed

- Headquarters becomes the formal entry experience.
- The header now behaves like product navigation instead of a landing-page bar.
- Editorial serif typography carries major product moments.
- Paycheck, Receipt, and Envelope objects receive stronger material identity.
- Workspace, Roadmaps, Memory, Lessons, Snapshot, and Observations inherit one visual system.
- Existing product logic and stored user data remain intact.

### Build principle

**Use the existing app for truth and the approved prototype for expression.**

### Scope discipline

This release is the first production slice, not the final beautification pass. The next slices will focus on complete flows rather than redesigning the entire application at once.

## v0.20.0 — The WealthOS Core

### Why this exists

WealthOS cannot provide trustworthy context without a reliable financial data layer.

A visually strong interface is not enough. Every observation, lesson trigger, Roadmap update, and future decision-support feature must be grounded in traceable records.

### What changed

- Added a canonical entity model for income, expenses, accounts, recurring bills, debts, debt payments, and transfers.
- Replaced the narrow header Quick Add action with a unified Record capability.
- Preserved Quick Add as the fast expense path.
- Added source and confidence metadata to every new record.
- Added an append-only audit log.
- Distinguished expected recurring bills from completed spending.
- Distinguished transfers from income and expenses.
- Synchronized canonical income records with the existing Workspace and Snapshot.
- Added Financial Foundation knowledge states.
- Preserved migration from every prior Private Preview version.

### Trust rule

**WealthOS only speaks with the confidence its data deserves.**
