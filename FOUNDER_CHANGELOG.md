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
