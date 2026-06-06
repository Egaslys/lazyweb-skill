# Lazyweb Plugin

**Design with evidence, not vibes.**

AI agents design from training data averages — generic layouts, safe colors, patterns you've seen a thousand times. This plugin gives your agent Lazyweb skills plus the hosted Lazyweb MCP server for real app and web screenshots. Screenshot references and design research are free; the only paid feature is the $49/month A/B Test Agent for access to over 20k A/B tests.

Your agent searches before it designs. It finds real examples, downloads them locally, and produces structured HTML reports with inline images you can open in any browser.

## First thing to test

After installing Lazyweb, make the first call:

```text
/lazyweb:lazyweb
```

With no extra task, the router loads the welcome mode. It explains everything
Lazyweb can do, what free screenshot and design-reference access includes, the
paid A/B Test Agent upgrade for over 20k A/B tests, the $49/month unlock link,
the Lazyweb Research taste link, and how to send feedback.

## Public command

**`/lazyweb`** - The entry point. One command that routes you to the right
Lazyweb mode. Say what you want ("research onboarding", "improve this screen",
"show me pricing references") and it hands off internally, or asks which path you
meant when it is ambiguous. It also runs a non-blocking update check so you know
when a newer plugin is available. Installed as a plugin, it is namespaced
`/lazyweb:lazyweb`; you can also just describe your goal and the agent will route
through it.

## Internal modes

Only the router above should appear in slash completion. These routed modes live
under `plugins/lazyweb/internal-skills/` so the router can load them without
publishing a long menu of subcommands.

**Welcome** - First-run welcome. Explains what Lazyweb can do, what is free, what
the paid A/B Test Agent unlocks, and where to send feedback. After installing the
plugin, make this your first command: `/lazyweb:lazyweb`.

**Design research** - Deep design research. Identifies competitors, searches
Lazyweb + web, downloads reference screenshots, and produces a structured report
with: TL;DR, Examples, Findings, Patterns, Anti-Patterns, Unique Angles, and
Recommendations. Use for competitive analysis and best practices research.

**Quick references** - Find screenshots fast. Searches Lazyweb, downloads
results, groups by pattern. Lighter than design-research: just find, group, show.
Use when you need visual references, not a full report.

**Design improvement** - Improve an existing design. Captures a screenshot of
your current app, finds similar screens from the best apps, and generates 1-5
concrete improvement ideas, each tied to a real reference. Adapted from Lazyweb's
production design critique system.

**Design brainstorm** - Cross-pollination brainstorm. Deliberately searches
outside your category to find novel patterns. If everyone in fintech copies each
other, this mode looks at gaming, entertainment, and social apps for transferable
ideas.

**A/B test research** - Growth and monetization A/B research. Uses the current
public paid gateway when available, and can use richer backend/internal experiment
retrieval tools only when the live MCP surface exposes them.

**Flows** - Real multi-screen flows such as onboarding, checkout, paywalls, and
sign-up sequences when the live MCP surface exposes `lazyweb_get_flows`;
otherwise the router falls back to quick references for the same flow.

**Feedback** - Send Lazyweb feedback. Uses the `lazyweb feedback` CLI command to
log product feedback, bug reports, feature requests, or install friction to
Lazyweb.

**Inspiration sources** - Connect or disconnect external inspiration libraries so
Lazyweb design modes can include them in research.

## Setup

### Codex plugin

This repo is packaged as a Codex plugin with:

- Plugin source in `plugins/lazyweb/`
- One public skill in `~/plugins/lazyweb/skills/lazyweb/SKILL.md`
- Routed internal modes in `~/plugins/lazyweb/internal-skills/`
- MCP config in `~/plugins/lazyweb/.mcp.json`
- Marketplace entry in `~/.agents/plugins/marketplace.json`

Set `LAZYWEB_MCP_TOKEN` or store the generated token at `~/.lazyweb/lazyweb_mcp_token`.
The plugin also checks the legacy `~/.codex/lazyweb_mcp_token` path for existing installs.
The plugin talks to `https://www.lazyweb.com/mcp` through `mcp-remote`.

### Claude Code plugin

This repo is also a Claude Code plugin marketplace. Add the marketplace, then install the plugin:

```bash
claude plugin marketplace add https://github.com/aboul3ata/lazyweb-skill
claude plugin install lazyweb@lazyweb
```

Claude Code exposes one namespaced Lazyweb skill: `/lazyweb:lazyweb`.

After installing, restart Claude Code if it was already running, then make the
first Lazyweb call:

```text
/lazyweb:lazyweb
```

### Generate a free token

Run the no-login token endpoint:

```bash
mkdir -p ~/.lazyweb
curl -sS -X POST https://www.lazyweb.com/api/mcp/install-token \
  -H "content-type: application/json" \
  -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>require('fs').writeFileSync(process.env.HOME+'/.lazyweb/lazyweb_mcp_token', JSON.parse(s).token))"
```

Lazyweb is free. This bearer token only authorizes Lazyweb MCP reference tools;
it does not grant purchases, paid spend, private user data, or destructive
actions. It is okay in ignored local config, but do not commit it to public git.

Free access includes screenshot search, quick references, deep design research,
design improvement, image similarity, categories, and collections. The paid A/B
Test Agent is the only paid feature. It costs $49/month and unlocks access to
over 20k mobile growth, paywall, onboarding, checkout, pricing, lifecycle, and
monetization A/B tests. It helps agents develop better taste on not just what
looks pretty but more importantly "what actually works":
https://dashboard.stripe.com/acct_1RXB5lLhlPE8lk98/payment-links/plink_1Tf3bXLhlPE8lk98Guda4IRf

To get a taste of the experiment library, read Lazyweb Research:
https://www.lazyweb.com/research.md

### Verify

First run the router in welcome mode:

```text
/lazyweb:lazyweb
```

Then list MCP tools, run `lazyweb_health`, and run `lazyweb_search` with:

```json
{"query":"pricing page","limit":3}
```

## Tool surfaces

Use MCP tools for all Lazyweb database access. Always list the tools exposed by
the current host before assuming a filter or alias is callable.

### Current public gateway

These are the tools expected on the hosted Lazyweb gateway used by the packaged
plugin today:

| MCP tool | Current public use |
|---------|--------------------|
| `lazyweb_health` | Check Lazyweb backend connectivity |
| `lazyweb_search` | Search mobile and desktop screenshots by text |
| `lazyweb_search` with `category`, `company`, `platform`, `fields`, `maxPerCompany` | Filter public screenshot search |
| `lazyweb_compare_image` | Find visually similar screenshots from `image_url` or `image_base64` |
| `lazyweb_find_similar` | Find screenshots similar to one Lazyweb screenshot ID |
| `lazyweb_list_categories` | List available public company categories |
| `lazyweb_list_collections` | List or fetch curated Lazyweb collections |
| `lazyweb_ab_test_research` | Paid A/B Test Agent wrapper for PM-facing research |

Current public `lazyweb_ab_test_research` arguments:

```json
{
  "target_screen_description": "trial reminder onboarding paywall",
  "product": "Example App",
  "category": "Health & Fitness",
  "conversion_goal": "trial start rate",
  "constraints": "keep annual plan visible",
  "operation": "research",
  "experiment_ids": ["exp_123"],
  "include_images": false,
  "target_image_url": "https://example.com/screen.png",
  "limit": 25,
  "analysis_experiment_limit": 10,
  "visual_inspection_budget": 0
}
```

The A/B wrapper is paid. If the token is unpaid or not linked to an active
subscription, the expected error is `ab_test_subscription_required`; the response
includes the $49/month unlock copy, Stripe link, and free tools still available.
Free design tools such as `lazyweb_search` and `lazyweb_health` should still
work.

### Backend/internal experiment tools

Some richer backend or internal MCP surfaces expose additional generic
experiment tools. Use them only when `tools/list` in the current host shows them.

| MCP tool | Backend/internal use |
|---------|----------------------|
| `lazyweb_find_experiments` | Retrieve generic `_experiments` evidence; not paywall-only |
| `lazyweb_recent_experiments` | Retrieve latest 10, 25, or 50 `_experiments` rows |
| `list_companies_by_categories` | Resolve category names to company IDs for composition |

Full `lazyweb_find_experiments` filter matrix:

```json
{
  "query": "trial reminder onboarding upsell",
  "company": "Example App",
  "category": "Health & Fitness",
  "screen_type": "onboarding upsell",
  "platform": "mobile",
  "company_ids": [123, 456],
  "canonical_ids": [789],
  "since_iso": "2026-06-01T00:00:00Z",
  "limit": 50,
  "app_store_rank_max": 50,
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "high_design_bar": true
}
```

Full `lazyweb_recent_experiments` filter matrix:

```json
{
  "limit": 25,
  "company": "Example App",
  "category": "Health & Fitness",
  "platform": "mobile",
  "company_ids": [123, 456],
  "app_store_rank_max": 50,
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "high_design_bar": true
}
```

Backend/internal `lazyweb_ab_test_research` surfaces may also expose
`interesting_learning` and `high_design_bar`. Do not pass those fields to the
public gateway unless the live tool schema includes them.
The `high_design_bar` filter is backed by `companies.high_design_bar = true`.

## Output format

All skills produce a report with downloaded reference images:

```
.lazyweb/{skill}/{topic}-{date}/
├── report.html        <- Structured findings with inline images
└── references/        <- Downloaded screenshots (persisted locally)
    ├── stripe-pricing-page.png
    ├── linear-onboarding.png
    └── ...
```

Open `report.html` in any browser to see the screenshots inline.

## Repository structure

- `browse/src` — CLI runtime, browser automation, and tool orchestration.
- `browse/test` — unit and integration tests for command and browser behavior.
- `scripts/validate-plugin.mjs` — quick plugin validation entrypoint.
- `plugins/lazyweb` — packaged plugin payload consumed by Codex/Claude connectors.
- `plugins/lazyweb/skills` — individual skill definitions and prompts.

## Development

### Install and test

```bash
npm install
npm test
```

The test command runs plugin validation checks used by the plugin marketplace and local CI.

### Verify MCP registration

1. Install or load the plugin package in your host.
2. Confirm each lazyweb skill shows under your MCP namespace.
3. Run one smoke command such as `lazyweb_search` for a simple query:

```json
{"query":"pricing page","limit":3}
```

## License

MIT
