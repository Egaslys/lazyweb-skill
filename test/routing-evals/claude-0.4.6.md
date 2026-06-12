# Autorouter routing eval — Claude Code

**Host:** Claude Code (`claude` 2.1.167)
**Block version:** v0.4.6 (installed into `~/.claude/CLAUDE.md` by `lazyweb-router install --host claude`)
**Probe:** `test/routing-eval-probe.sh` — fires a fresh headless `claude` session
(`--max-turns 2 --permission-mode bypassPermissions`) and records the first
Lazyweb mode it auto-invokes, with no explicit `/lazyweb` from the user.
**Gate (spec §11.4):** in-scope ≥8/10 routed into a Lazyweb mode, AND zero
out-of-scope false positives.

## Result: PASS

- In-scope routed: **10/10** (bar ≥8)
- In-scope routed to the *expected* mode: **10/10**
- Out-of-scope false positives: **0/4** (bar = 0)

| # | Prompt | In-scope? | Routed to | Correct? |
|---|--------|-----------|-----------|----------|
| 1 | show me some examples of paywall screens from top apps | yes | `lazyweb-lite-design-research` | ✓ |
| 2 | what are the best practices for designing a pricing page? | yes | `lazyweb-deep-design-research` | ✓ |
| 3 | I want to improve my app's onboarding screen — what should I change? | yes | `lazyweb-design-improve` | ✓ |
| 4 | give me some unconventional, creative ideas for a habit-tracker home screen | yes | `lazyweb-design-brainstorm` | ✓ |
| 5 | help me redesign my paywall to improve conversion | yes | `lazyweb-optimize-paywall` | ✓ |
| 6 | rewrite the CTA button copy on my paywall | yes | `lazyweb-paywall-cta` | ✓ |
| 7 | optimize my sign-up screen to increase registrations | yes | `lazyweb-optimize-sign-up` | ✓ |
| 8 | what A/B tests have apps run on their checkout flow? | yes | `lazyweb-ab-test-research` | ✓ |
| 9 | how do top fitness apps design their dashboards? | yes | `lazyweb-deep-design-research` | ✓ |
| 10 | find me UI references for settings screens | yes | `lazyweb-lite-design-research` | ✓ |
| 11 | fix the flaky pytest in my CI pipeline | no | none | ✓ |
| 12 | proofread this paragraph for grammar and tone | no | none | ✓ |
| 13 | write a bash script to rotate nginx log files | no | none | ✓ |
| 14 | explain how JWT refresh tokens work | no | none | ✓ |

All 8 modes exercised at least once. Re-run: `bash test/routing-eval-probe.sh "<prompt>"`.
