# Lazyweb Skill Pack

**Design with evidence, not vibes.**

Lazyweb gives AI coding agents real product screenshots, UI references, and
design research workflows before they build or critique an interface. It is a
standalone skill pack plus a hosted Lazyweb MCP server, so it works in coding
clients that support local skills even when they do not support plugins.

## Install

Paste this into a local coding agent or terminal:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

The installer clones this repo to `~/.lazyweb/repos/lazyweb-skill`, creates or
reuses `~/.lazyweb/lazyweb_mcp_token`, installs the visible Lazyweb skills into
detected local clients, and configures Lazyweb MCP at
`https://www.lazyweb.com/mcp`.

Supported local skill roots:

- Codex: `~/.codex/skills`
- Claude Code: `~/.claude/skills`
- Cursor: `~/.cursor/skills`
- OpenCode: `~/.config/opencode/skills`
- Kiro: `~/.kiro/skills`
- Factory Droid: `~/.factory/skills`
- Slate: `~/.slate/skills`
- Hermes: `~/.hermes/skills`

Direct MCP config is written for Codex, Claude Code, Cursor, and Antigravity.
For hosted Claude or ChatGPT surfaces, use the connector instructions at
`https://www.lazyweb.com/claude.md` or `https://www.lazyweb.com/chatgpt.md`;
a local shell script cannot configure those cloud UIs.

## Visible Skills

The installer exposes a hybrid skill surface:

| Skill | Use when |
|---|---|
| `/lazyweb` | You want the compatibility entry point or are unsure which Lazyweb mode fits. |
| `/lazyweb-design-research` | Competitive analysis, best-practices research, or a full report with references. |
| `/lazyweb-quick-references` | Quick examples, UI references, or screenshots without a full report. |
| `/lazyweb-design-improve` | Improve, critique, or compare an existing design. |
| `/lazyweb-design-brainstorm` | Creative cross-category ideas or unconventional directions. |
| `/lazyweb-paywall-optimization` | Paywall screen redesign, critique, or conversion optimization. |
| `/lazyweb-ab-test-research` | A/B tests, experiments, pricing, lifecycle, or monetization strategy. |

`SKILL.md` at the repo root is the high-level router. The installer materializes
that file into each local client as `lazyweb/SKILL.md`, while platforms that can
download a single repo-level skill can use the root file directly. The router
points to the six mode skills under `skills/` and tells agents to read and run
the selected mode instead of reimplementing the workflow.

## Verify

After setup, reload or restart the client, then:

1. Show the Welcome to Lazyweb message from setup, or fetch `https://www.lazyweb.com/api/mcp/welcome-message` and show it to the user.
2. List MCP tools and confirm `lazyweb_get_workflows` is present.
3. Call `lazyweb_get_workflows` with:

```json
{"operation":"list","task_context":"first run Lazyweb capabilities"}
```

4. Summarize the returned workflows as Lazyweb's super powers. Do not call `lazyweb_get_flows` for this first-run capability guide; that is a separate tool for ordered product journeys.

Lazyweb MCP tokens are free no-billing bearer tokens for UI reference tools.
They do not authorize purchases, paid spend, private user data, or destructive
actions. Keep tokens out of public git, but ignored local MCP config is fine.

## Manual Setup

If your client is not detected, configure MCP manually:

- URL: `https://www.lazyweb.com/mcp`
- Transport: Streamable HTTP
- Header: `Authorization: Bearer <token from ~/.lazyweb/lazyweb_mcp_token>`

To run setup for a specific client:

```bash
~/.lazyweb/repos/lazyweb-skill/setup --host cursor
```

Use `--host all` to install every supported local skill root.

## Tool Surfaces

Use MCP tools for Lazyweb database access. Always inspect the live tool list
before assuming optional filters or backend aliases are available.

Current public gateway tools:

| MCP tool | Use |
|---|---|
| `lazyweb_health` | Check Lazyweb backend connectivity. |
| `lazyweb_search` | Search mobile and desktop screenshots by text; screenshot results include full `imageUrl`/`image_url` values. |
| `lazyweb_compare_image` | Find visually similar screenshots from an image URL or base64 image; results include full image URLs. |
| `lazyweb_find_similar` | Find visually similar screenshots from a returned Lazyweb `imageUrl` or an image payload; do not pass screenshot IDs. |
| `lazyweb_list_categories` | List public company categories. |
| `lazyweb_list_collections` | List or fetch curated Lazyweb collections; hydrated screenshots include full image URLs. |
| `lazyweb_get_workflows` | Discover and fetch current Lazyweb workflow instructions. |
| `lazyweb_get_flows` | Fetch ordered multi-screen product journeys with full step image URLs. |
| `lazyweb_ab_test_research` | Paid A/B Test Agent wrapper for PM-facing research; when `include_images` is true, evidence includes full control/variant image URLs. |

All Lazyweb screenshot-bearing tools return usable full URLs for screenshots.
Supabase storage-backed image URLs are signed for 90 days. Do not ask tools for
screenshot IDs, do not pass screenshot IDs between Lazyweb tools, and do not
construct storage URLs from raw paths; embed the returned `imageUrl`/`image_url`
or A/B `control_image_url`/`variant_image_url` fields directly.

Richer backend/internal surfaces may also expose `lazyweb_find_experiments`,
`lazyweb_recent_experiments`, and
`list_companies_by_categories`. Use those only when the live schema shows them.

The A/B Test Agent is the only paid feature. It costs $49/month and unlocks
mobile growth, paywall, onboarding, checkout, pricing, lifecycle, and
monetization A/B test context:
https://buy.stripe.com/4gM3cwbdE8Mc46df5fawo07

## Repository Structure

- `SKILL.md` - canonical high-level Lazyweb router skill.
- `skills/*/SKILL.md` - five visible mode skills.
- `setup` - standalone multi-host installer.
- `bin/` - helper scripts used by skills and setup.
- `browse/` - optional browser capture helper for web screenshots.
- `scripts/validate-skill-pack.mjs` - static skill-pack validation.
- `test/` - installer, helper, and contract tests.

## Development

```bash
npm test
```

The test command runs unit tests plus standalone skill-pack validation.

## License

MIT
