---
title: How to Set a MER Target from Contribution Margin
h1: How to set a MER target from your contribution margin, and hold whoever runs your ads to it
description: Break-even MER is one divided by your contribution margin before marketing. If your margin is 30%, a 3.33x MER means you made nothing. Most "what's a good MER" advice skips that math, which is why brands celebrate numbers that are losing them money. Here is the math, a calculator, and how I use it as the accountability contract for whoever runs your ads.
updated: 2026-10-05
kind: answer
---

## Start with the only definition that matters

MER, marketing efficiency ratio, is total revenue divided by total marketing spend, across the whole business, for a period. Not one platform. Not one campaign. Everything you made over everything you spent to make it.

I judge marketing on MER and contribution margin because they can't be gamed by attribution settings. Meta's ROAS, Google's ROAS and your attribution tool's blended ROAS are all useful for diagnosing what to change inside a channel, but they disagree with each other, they disagree with Shopify, and they diverge from what incrementality tests find, in both directions. MER just counts.

## The math nobody does

Contribution margin before marketing is what's left of a dollar of revenue after product cost, shipping, payment processing and any other per-order costs, before you spend a cent on marketing. Call it m.

Your break-even MER is 1 divided by m. That's it.

| Contribution margin before marketing | Break-even MER |
|---|---|
| 20% | 5.00x |
| 30% | 3.33x |
| 40% | 2.50x |
| 50% | 2.00x |
| 60% | 1.67x |

So when somebody tells you "a good MER is 3 to 5" (Shopify's own guide says 3.0x to 5.0x), the right response is "compared to what margin?" A 3.0 MER at a 25% margin is losing money every single month. A 3.0 MER at a 50% margin is a healthy, growing business. The number means nothing without the margin.

<!-- calc:mer -->

## Setting the target, not just the floor

Break-even is the floor. The target sits above it, and how far above depends on what you're trying to do.

If you're trying to grow and you have the cash to do it, a target 20% above break-even is aggressive but sane. If you need marketing to produce profit this year, 40% above break-even is a better place to start. If you have a subscription or a strong repeat rate, you can set a first-order target below break-even and a 90-day cohort target above it, but only if you actually measure the cohorts.

The one thing I'd never do is set the target by looking at last year's MER and adding a bit. That fits the target to the spending instead of the other way around.

## Making it the contract with whoever runs your ads

This is the part most brands skip, and it's the reason agencies and in-house buyers so often disagree with the CFO. Everyone is measuring a different thing.

Here's how I set it up on every engagement:

1. Agree the contribution margin number and write it down. Finance owns it. It gets revisited quarterly.
2. Derive break-even MER and the target MER from it. Put both on the top of the weekly scorecard.
3. Whoever runs paid media is judged on blended MER against target, and on contribution dollars, not on their platform's ROAS.
4. Platform ROAS, CPA, CTR and the rest live on the second tab. They're for diagnosing, not for grading.
5. When MER drifts below target for two consecutive weeks, spend comes down or creative changes. That's the rule, agreed in advance, so nobody has to fight about it in the moment.

If you hire me for the strategy service, this is one of the first things I build. If you hire me to run Meta, this is what I ask you to grade me on.

## MER against the other numbers you'll be shown

| Number | What it counts | Who controls the definition | Good for |
|---|---|---|---|
| MER | Total revenue over total marketing spend, whole business | You | Grading whoever runs your marketing; budget decisions |
| Contribution dollars | Revenue minus product, shipping, payment and marketing cost | You and finance | Knowing whether growth made money |
| Platform ROAS (Meta, Google) | Revenue the platform attributes to itself over its own spend | The platform's attribution settings | Diagnosing what to change inside one channel |
| Attribution-tool blended ROAS | A model's share-out of orders across channels | The vendor's model | Comparing channels, with a grain of salt |
| Incrementality test (holdout, geo) | Revenue that would not have happened without the ads | The test design | Settling whether a channel is incremental at all |

## What the numbers say

<!-- evidence -->
- Shopify's own guide puts a healthy blended MER target at 3.0x to 5.0x, which is exactly the kind of range that means nothing until you put a margin next to it. ([Shopify, Marketing Efficiency Ratio guide, July 2026](https://www.shopify.com/blog/marketing-efficiency-ratio))
- Triple Whale reports its customers' median 2025 marketing spend at 41% of revenue. Triple Whale defines MER the other way up (spend over revenue), so that is a 2.44x MER the way this page defines it. ([Triple Whale, updated September 2025](https://www.triplewhale.com/blog/marketing-efficiency-ratio))
- Platform numbers and incremental numbers diverge in both directions. Across 640 incrementality experiments, Haus found Meta's 7-day-click reporting under-counted incremental revenue by about 15% on average. ([Haus, The Meta Report, July 2025](https://www.haus.io/blog/the-meta-report-lessons-from-640-haus-incrementality-experiments))
- The same cut the other way: Stella's 225 geo tests found the gap between platform-reported and incremental ROAS often reaches 2 to 3x, with branded search and retargeting showing 5 to 10x inflation, and in its 46-study Meta analysis some brands with platform ROAS above 4.0 showed incrementality below 1.0. ([Stella, 2025 DTC Incrementality Benchmarks, May 2026](https://www.stellaheystella.com/blog/2025-dtc-digital-advertising-incrementality-benchmarks); [Stella, How Incremental is Meta Really, August 2025](https://www.stellaheystella.com/blog/incrementality-study-how-incremental-is-meta-really))

## What a measurement specialist says about it

> Platform reporting and last-click attribution are biased in predictable ways. They over-credit channels that intercept existing demand and under-credit channels that build demand over a longer horizon.
> — Terence Einhorn, VP, Solutions Architect, Measured, in [Incrementality Testing Examples](https://www.measured.com/faq/incrementality-testing-examples-two-surprising-results/)

That is the whole reason to grade on MER. The platform number can be too high or too low, and you won't know which without a test. MER doesn't have that problem.

## What about incrementality and MMM?

Complex media mix modeling matters at massive scale. For the other 99% of advertisers it's overkill. If you want to know whether a channel is actually incremental, the cheapest honest test is to turn it off in a region or for a period and watch MER. A few brands have done that with Meta lately and the results are always educational. But you don't need a model to start managing to MER this week.

## Questions people ask

### What is a good MER for an e-commerce brand?
There isn't a universal one. Shopify's guide says 3.0x to 5.0x and Triple Whale's customer median works out to about 2.44x, but break-even MER is 1 divided by your contribution margin before marketing, so a 30% margin means 3.33x just to break even, and a 50% margin means 2.0x. A good target is usually 20% to 40% above your break-even.

### Should we measure on ROAS or MER?
MER for decisions and platform ROAS for diagnostics. Platform attribution diverges from incremental results in both directions (Haus found Meta under-counting on 7-day click; Stella found branded search and retargeting over-counting by 5 to 10x), and different platforms disagree with each other; MER is total revenue over total marketing spend and can't be gamed.

### Why don't my Meta ads numbers match Shopify?
Attribution windows, view-through conversions, cross-device behavior and modeled conversions. Meta is counting something different from Shopify. That's why I grade on blended MER and contribution margin, not on either report.

### How often should we look at MER?
Weekly for management, monthly for decisions about budget, quarterly for revisiting the margin assumption. Single days and single weeks are noisy.

### Does MER work for a brand with subscriptions?
Yes, with one adjustment: set a first-order MER floor and a 90-day cohort MER target, and actually track the cohorts. A subscription brand can afford to acquire below break-even on the first order only if the cohort math proves it.

### Do we need a media mix model?
Almost certainly not at $5M to $80M. Manage to MER, run simple holdout tests when you want to know if a channel is incremental, and save MMM for when you have the scale and the data team to use it.
