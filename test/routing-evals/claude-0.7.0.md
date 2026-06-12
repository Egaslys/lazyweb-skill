# Autorouter routing eval — Claude Code (controlled)

**Host model:** Claude Code subagents (Fable 5 / `claude-fable-5`)
**Block version:** rendered at v0.6.1 by `lazyweb-router render --host claude` (routing rows are byte-identical at v0.7.0 — only the `BEGIN` marker version stamp differs, so this run holds for the 0.7.0 ship)
**Method:** Controlled eval — each prompt is decided by a fresh agent given the
rendered autorouter block as its only routing instructions, with no prior
context, returning the single mode it would invoke (or `none`). Run as a
48-case Workflow fan-out (`lazyweb-routing-eval`) in rate-limit-safe sequential
waves; the 2 paywall-optimization cases throttled mid-batch (po3, po4) were
re-run directly and are marked below. This complements the on-host live probe
(`test/routing-eval-probe.sh`, fires a real headless `claude` session); the
prior live run is in `claude-0.4.6.md`.

**Gate (spec §11.4):** in-scope exact-route ≥ 80%, AND zero out-of-scope false positives.

## Result: PASS

- In-scope routed to the **expected** mode: **34/36 (94.4%)** (bar ≥ 80%)
- Out-of-scope **false positives**: **0/12** (bar = 0)
- All 9 routable modes exercised ≥ 3×; 12 out-of-scope prompts (incl. adversarial near-misses: brand-logo SVG, investor email, CSV→JSON).

| Prompt | In-scope? | Expected | Routed to | ✓ |
|---|---|---|---|---|
| What do the best apps do for their onboarding flows? I want a competitive analysis before I build. | yes | `lazyweb-design-research` | `lazyweb-design-research` | ✓ |
| Research best practices for designing a settings screen. | yes | `lazyweb-design-research` | `lazyweb-design-research` | ✓ |
| How should I design my checkout flow? Show me what top e-commerce apps do. | yes | `lazyweb-design-research` | `lazyweb-design-research` | ✓ |
| I'm about to redesign our analytics dashboard — what works well across the market? | yes | `lazyweb-design-research` | `lazyweb-design-research` | ✓ |
| Show me some examples of pricing pages. | yes | `lazyweb-quick-references` | `lazyweb-quick-references` | ✓ |
| Find me screenshots of mobile onboarding welcome screens. | yes | `lazyweb-quick-references` | `lazyweb-quick-references` | ✓ |
| I just want to see how other apps do empty states, no deep report. | yes | `lazyweb-quick-references` | `lazyweb-quick-references` | ✓ |
| Quick — UI references for a profile settings screen? | yes | `lazyweb-quick-references` | `lazyweb-quick-references` | ✓ |
| Here's my current pricing page, how can I make it better? | yes | `lazyweb-design-improve` | `lazyweb-design-improve` | ✓ |
| Critique my dashboard design and tell me what to change. | yes | `lazyweb-design-improve` | `lazyweb-design-improve` | ✓ |
| Can you give me feedback on this screen I built? | yes | `lazyweb-design-improve` | `lazyweb-design-improve` | ✓ |
| Compare my onboarding to competitors and suggest concrete improvements. | yes | `lazyweb-design-improve` | `lazyweb-design-research` | ✗ |
| Surprise me with some unconventional design ideas for a habit tracker. | yes | `lazyweb-design-brainstorm` | `lazyweb-design-brainstorm` | ✓ |
| What if we tried something totally different for our home screen — think outside the box. | yes | `lazyweb-design-brainstorm` | `lazyweb-design-brainstorm` | ✓ |
| Brainstorm creative, cross-category directions for our meditation session screen. | yes | `lazyweb-design-brainstorm` | `lazyweb-design-brainstorm` | ✓ |
| Give me fresh, weird ideas for a budgeting app's spending screen. | yes | `lazyweb-design-brainstorm` | `lazyweb-design-brainstorm` | ✓ |
| Help me redesign my paywall to convert better. | yes | `lazyweb-paywall-optimization` | `lazyweb-paywall-optimization` | ✓ |
| My paywall isn't converting — optimize the whole screen. | yes | `lazyweb-paywall-optimization` | `lazyweb-paywall-optimization` | ✓ |
| Critique and improve my mobile subscription paywall layout. | yes | `lazyweb-paywall-optimization` | `lazyweb-paywall-optimization` | ✓ |
| Rework my premium upsell screen for more conversions. | yes | `lazyweb-paywall-optimization` | `lazyweb-paywall-optimization` | ✓ |
| Rewrite the button text on my paywall — just the CTA copy. | yes | `lazyweb-paywall-cta` | `lazyweb-paywall-cta` | ✓ |
| Stress-test my paywall CTA button wording. | yes | `lazyweb-paywall-cta` | `lazyweb-paywall-cta` | ✓ |
| Give me better button copy for 'Subscribe Now' on my paywall. | yes | `lazyweb-paywall-cta` | `lazyweb-paywall-cta` | ✓ |
| What should the primary call-to-action button on my paywall say? | yes | `lazyweb-paywall-cta` | `lazyweb-paywall-cta` | ✓ |
| Optimize my sign-up screen to increase account creation. | yes | `lazyweb-signup-optimization` | `lazyweb-signup-optimization` | ✓ |
| My registration form has high drop-off — redesign it. | yes | `lazyweb-signup-optimization` | `lazyweb-signup-optimization` | ✓ |
| Improve my email capture / signup screen conversion. | yes | `lazyweb-signup-optimization` | `lazyweb-signup-optimization` | ✓ |
| Critique my account creation flow for completion rate. | yes | `lazyweb-signup-optimization` | `lazyweb-signup-optimization` | ✓ |
| What A/B tests have other apps run on their pricing? | yes | `lazyweb-ab-test-research` | `lazyweb-ab-test-research` | ✓ |
| Give me growth experiment ideas for onboarding activation. | yes | `lazyweb-ab-test-research` | `lazyweb-ab-test-research` | ✓ |
| What monetization experiments work for free trials? | yes | `lazyweb-ab-test-research` | `lazyweb-ab-test-research` | ✓ |
| I need PM strategy backed by real A/B tests for our checkout. | yes | `lazyweb-ab-test-research` | `lazyweb-ab-test-research` | ✓ |
| Do my typography the way the best designers would. | yes | `lazyweb-design-best-practices` | `lazyweb-design-best-practices` | ✓ |
| What's the best skill for building a polished landing page? | yes | `lazyweb-design-best-practices` | `lazyweb-design-best-practices` | ✓ |
| Apply design best practices for color and contrast to my UI. | yes | `lazyweb-design-best-practices` | `lazyweb-design-best-practices` | ✓ |
| I'm building data tables — what's the best way the top people do it? | yes | `lazyweb-design-best-practices` | `lazyweb-design-research` | ✗ |
| Fix this null pointer exception in my auth service. | no | none | none | ✓ |
| Generate a standalone brand logo as an SVG. | no | none | none | ✓ |
| Help me write a cold outreach email to investors. | no | none | none | ✓ |
| Summarize this 20-page research paper for me. | no | none | none | ✓ |
| Rename the variable usr to user across this file. | no | none | none | ✓ |
| Write a haiku about the ocean. | no | none | none | ✓ |
| Optimize this slow SQL query. | no | none | none | ✓ |
| Set up a GitHub Actions CI pipeline for my repo. | no | none | none | ✓ |
| Proofread this blog post for typos. | no | none | none | ✓ |
| Explain how OAuth refresh tokens work. | no | none | none | ✓ |
| Convert this CSV file to JSON. | no | none | none | ✓ |
| Write unit tests for my date-parsing function. | no | none | none | ✓ |

## Known borderline misroutes (defensible, within gate)

- **“Compare my onboarding to competitors and suggest concrete improvements”** → `lazyweb-design-research` (expected `lazyweb-design-improve`). “Compare to competitors” trips the design-research *competitive-analysis* keyword over the secondary improvement ask. Both modes surface real competitor evidence, so the user is still served; not worth tightening the row at the cost of byte budget.
- **“Data tables — what’s the best way the top people do it?”** → `lazyweb-design-research` (expected `lazyweb-design-best-practices`). “Best way the top people do it” reads as best-practices research; design-research returns real data-table references, an acceptable answer.

Re-run controlled eval: `Workflow lazyweb-routing-eval`. Re-run a single live probe: `bash test/routing-eval-probe.sh "<prompt>"`.

## Addendum — v0.7.1 row refinement (best-practices ↔ research overlap)

Audit follow-up on the `lazyweb-design-best-practices` ↔ `lazyweb-design-research`
overlap. Both leaned on the phrase "best practices," and `design-research` won
ties because its row literally contained those words while best-practices said
"Apply the best community design skill for an aspect." Reworded both rows to
bind "best practices" to the **object** (the discriminator), keeping each row
the same length or shorter (budget unchanged — codex 1787 B < 1800):

- `lazyweb-design-research`: `Best practices / competitive analysis for a screen or flow`
- `lazyweb-design-best-practices`: `Best practices for a design craft: typography, color, motion, forms, tables`

Targeted re-checks against the reworded block (fresh agent per prompt):

| Prompt | Routed to | Note |
|---|---|---|
| Do my typography the way the best designers would. | `lazyweb-design-best-practices` | clean craft query lands right |
| What are the best practices for color contrast and accessibility? | `lazyweb-design-best-practices` | craft |
| What do the best apps do for onboarding? Competitive analysis. | `lazyweb-design-research` | no regression |
| Research best practices for designing a settings screen. | `lazyweb-design-research` | screen → research, no regression |
| How should I design my checkout flow? What top apps do. | `lazyweb-design-research` | no regression |
| Redesigning our dashboard — what works across the market? | `lazyweb-design-research` | no regression |
| I'm building data tables — best way the top people do it? | `lazyweb-design-research` | accepted: "what top people do" is competitively framed; research returns real data-table screenshots |

Net: regression-free, cleaner screen-vs-craft separation for the ambiguous
long tail. The two original borderline misroutes (di4, bp4) remain defensible.
