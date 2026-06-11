---
name: lazyweb-design-research
route: 'Design research, best practices, competitive analysis, "what do top apps do"'
description: |
  Deep design research combining Lazyweb's screenshot database with web research.
  Produces a prototype-first HTML report with visual references and annotated patterns.
  Use when the user needs competitive analysis, best practices research, or wants
  to understand how the best apps handle a specific design problem.
  Trigger on: "best practices for", "how should I design", "what do top apps do",
  "competitive analysis for", "design research on", "what works well for",
  "research how others do".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
  - Agent
---

# Lazyweb Design Research

Evidence-backed design research that reads the user's current screen, names its
frictions, forms 2-4 genuinely divergent redesign bets, and renders a visual-first
HTML report where the recommended prototype sits side by side with the control.

People learn by seeing. Every claim in the report is carried by a large, legible
visual; nothing important hides behind a click. Chrome stays quiet: no chip
clutter, no legend tables, no explanatory paragraphs next to the proof.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the HTML report to `.lazyweb/design-research/{topic}-{date}/report.html`
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/design-research/{topic}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write research content into a plan file
5. Publish a shareable link (see "Publish a Shareable Link" below) - automatic, non-blocking
6. After saving, show the user a concise summary, the recommended bet, the exact
   report path, and the shareable link if publishing succeeded
7. Ask the user if the research looks good
8. If in plan mode, exit plan mode after the user confirms - the research is done
9. Suggest next steps: "You can now use this research to inform your implementation,
   ask `/lazyweb` to improve your current design, or start building."

The visible report is: **Agent Instructions**, **Goal**, **Recommendation**,
optional **Inspo**, and **Interesting Patterns** — in that order. Do not produce
the older busy structure with key examples, findings, sources, broad
recommendation lists, or long prose analysis sections.

The Recommendation is built like `lazyweb-paywall-optimization`'s hypothesis
engine, with screenshot evidence taking the role experiment evidence plays
there: read the control, name its specific frictions, form 2-4 falsifiable and
structurally divergent bets (Safe bet / Bold bet / Wild card — a thinking
discipline, not visible chips), prototype each as a generated image, and carry
the decision. When a current page or screenshot exists, render `Control` and
the recommended prototype **side by side in equal, height-locked frames** with
a ◀ ▶ variant switcher on the right frame so the user can flip through the
other bets in place; runner-up bets also appear in a snap carousel of
same-size cards. Prefer generated bitmap prototype images over hand-coded HTML
mockups when image generation is available; use HTML/CSS only as a fallback or
when the user asks for implementation-ready code. Generate prototype images in
parallel at medium effort by default, or low effort when the user asks for
speed/exploration.

## Publish a Shareable Link (always, right after writing report.html)

Every report is auto-published to lazyweb.com so the user can share it with
teammates. Run this with `$REPORT_DIR` set to `.lazyweb/design-research/{topic}-{date}`:

```bash
IDEMPOTENCY_KEY="${REPORT_DIR##*.lazyweb/}"   # stable per-report key (e.g. design-research/{topic}-{date}) — works for absolute and relative $REPORT_DIR; send the SAME value every attempt so retries dedupe to one link
LAZYWEB_TOKEN=$(cat "$HOME/.lazyweb/lazyweb_mcp_token" 2>/dev/null || true)
if [ -n "$LAZYWEB_TOKEN" ]; then
  # Tier 1 - local install: direct POST (idempotency_key dedupes a re-run)
  python3 - "$REPORT_DIR" "$LAZYWEB_TOKEN" "design-research" "$IDEMPOTENCY_KEY" <<'PUBLISH_EOF'
import base64, json, pathlib, sys, urllib.error, urllib.request
report_dir, token, skill, idem = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
version_file = pathlib.Path.home() / ".lazyweb" / "VERSION"
version = version_file.read_text().strip() if version_file.exists() else "0.0.0"
html = (report_dir / "report.html").read_text(encoding="utf-8")
refs = report_dir / "references"
assets = [
    {"name": p.name, "b64": base64.b64encode(p.read_bytes()).decode()}
    for p in (sorted(refs.iterdir()) if refs.is_dir() else [])
    if p.is_file() and not p.name.startswith(".")
]
body = json.dumps({"skill": skill, "version": version, "html": html, "assets": assets, "idempotency_key": idem}).encode()
req = urllib.request.Request(
    "https://www.lazyweb.com/api/reports",
    data=body,
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
)
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=90).read())
    print(f"SHAREABLE_URL: {resp['url']}")
except urllib.error.HTTPError as exc:
    print(f"PUBLISH_FAILED: {exc.code} {exc.read().decode()[:500]}")
except Exception as exc:
    print(f"PUBLISH_SKIPPED: {exc}")
PUBLISH_EOF
else
  # Tier 2 - no local token (hosted/cloud agent): publish via the MCP tool (see below)
  echo "PUBLISH_VIA_MCP_TOOL idempotency_key=$IDEMPOTENCY_KEY report_dir=$REPORT_DIR"
fi
```

**Exactly one tier runs - never both.**

- Tier 1 `SHAREABLE_URL:` - include the link: "Shareable link: {url} (unlisted - anyone with the link can view)".
- Tier 1 `PUBLISH_FAILED: 400 ...` - the body names what is unhostable (e.g. `missing_assets`). Fix the report and re-run the publish ONCE.
- Tier 1 `PUBLISH_SKIPPED:` - say nothing; the local report stands (the user has the file).
- Tier 2 `PUBLISH_VIA_MCP_TOOL ...` - you have no local token (hosted session), so publish with the Lazyweb MCP tool instead:
  1. Size-check first: if `report.html` plus the `references/` files together exceed ~7MB, do NOT call the tool - tell the user the report was too large to publish from a hosted session (it is saved locally) and stop.
  2. Otherwise call `lazyweb_publish_report` with: `html` = the contents of `report.html`; `assets` = each `references/` file as `{"name": <filename>, "b64": <base64 of the bytes>}`; `report_skill` = "design-research"; `idempotency_key` = the value printed after `idempotency_key=`.
  3. On `{ ok: true, url }` -> show "Shareable link: {url} (unlisted - anyone with the link can view)".
  4. On `{ ok: false }` -> tell the user publishing failed and why (the `error` field); the report is saved locally. If `code` is `REPORT_VALIDATION_ERROR` and `detail` names missing assets, fix and call ONCE more; otherwise do not retry.
  Unlike Tier 1, do NOT stay silent on a Tier-2 failure - a hosted user has no local file to fall back on, so they need the link or the reason.

### Hosting-safe HTML (the template already complies - keep it that way)

The hosted copy is served byte-for-byte, so the report must only use:
- inline CSS and inline `<script>` - never an external `<script src=...>`
- images via the absolute `imageUrl`/`image_url` URLs Lazyweb returns, or
  relative `references/{filename}` paths for locally saved screenshots
- no `file://` URLs and no absolute local paths (`/Users/...`, `C:\...`)

## When to Use This

- User wants to understand a design space before building
- User needs competitive analysis for a feature
- User asks "what are best practices for X"
- User wants to see how the best apps solve a specific problem

## When NOT to Use This

- User just wants to see a few screenshots quickly -> route to `lazyweb-quick-references`
- User has an existing design and wants improvement ideas -> route to `lazyweb-design-improve`
- User wants creative/unconventional ideas -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` - text search over mobile and desktop screenshots
- `lazyweb_find_similar` - more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` - visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` - connectivity check

Optional MCP tools:
- `lazyweb_ab_test_research` - supporting experiment evidence for pricing, paywall, checkout, onboarding, and other growth/monetization screens when the live schema exposes it
- `lazyweb_publish_report` - hosted-session publish path (see Tier 2 above)

**Pass `skill: "design-research"` on every Lazyweb call.** Include `"skill": "design-research"` in the arguments of each `lazyweb_*` tool call - for example `{"query": "pricing page", "limit": 30, "skill": "design-research"}`. This is optional analytics metadata; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "design-research", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

These are the current public gateway names. Backend/internal surfaces may also
expose canonical tools such as `search_screenshots`, `list_filters`,
`vision_screenshots`, and `metadata_screenshots`; prefer the `lazyweb_*` names
in this skill. Use `high_design_bar: true` only when the live tool schema exposes
it and the user asks for high-design-bar companies, premium examples,
best-designed apps, or stronger visual-quality filtering. That filter is backed
by `companies.high_design_bar = true`.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only - the skill still works, just without Lazyweb's database.

## Browse Setup (run BEFORE any web capture)

```bash
LB=""
# Check the standalone Lazyweb checkout first
for _P in "$(pwd)/.lazyweb/repos/lazyweb-skill/browse/dist/browse" ~/.lazyweb/repos/lazyweb-skill/browse/dist/browse; do
  [ -x "$_P" ] && LB="$_P" && break
done
# Fall back to gstack browse
if [ -z "$LB" ]; then
  _ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && LB="$_ROOT/.claude/skills/gstack/browse/dist/browse"
  [ -z "$LB" ] && [ -x ~/.claude/skills/gstack/browse/dist/browse ] && LB=~/.claude/skills/gstack/browse/dist/browse
fi
[ -x "$LB" ] && echo "BROWSE_READY: $LB" || echo "NO_BROWSE"
```

If `NO_BROWSE`: Web screenshot capture is unavailable. Lazyweb results still work -
just describe web examples in text without screenshots. To enable web captures,
run: `cd ~/.lazyweb/repos/lazyweb-skill/browse && ./setup`

## Workflow

### 0. Ground the search

Before searching, ground the work in what the user is building:

1. Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). Use its project/platform/stack output to bias the `platform` filter and captions.
2. Clarify only what cannot be inferred. If platform is unknown, or the product/screen/outcome is unclear, ask ONE AskUserQuestion to pin down product/screen, mobile vs desktop, and the specific outcome.

### 1. Understand the research question

Pin down:
- The specific screen, flow, or feature
- The product type, audience, and platform
- The design outcome the recommendation should improve

### 2. Capture current state (if applicable)

If the user is researching a specific page or app they are building, capture the current state:

- Running dev server or URL available: use preview/browse tools to screenshot it
- Mobile app: ask the user to provide a screenshot
- General topic only: skip this step

Define the report directory FIRST (steps 2-7 write into it):

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references" "$REPORT_DIR/work"
```

Save as `$REPORT_DIR/references/current-state.png`. This image becomes `Control`
in the side-by-side Recommendation comparison. Do not create a separate visible
"Current State" section.

### 3. Read the control (required when a current state exists)

Before any searching or ideation, read the control the way
`lazyweb-paywall-optimization` reads a paywall. Identify:

- **Components present:** header, hero, value prop, proof, pricing, CTAs, trust
  signals, navigation, FAQ, footer — whatever the screen type implies
- **Layout pattern:** single-column stack, hero + grid, comparison layout,
  dashboard shell, feed, wizard, etc.
- **Strategic moves:** what the screen is *trying* to do — anchoring, social
  proof, demonstration, urgency, curiosity, authority, personalization
- **Audience and user state:** who lands here and how warm they are
- **Named frictions:** 2-5 specific, observable weaknesses of THIS screen
  ("proof arrives below the fold", "CTA copy is generic", "hero asserts value
  without showing the product"). Every later hypothesis must attack one of
  these by name.

If there is no current state (greenfield research), substitute a baseline read:
the convention set the category expects, and which conventions the user's
product can or cannot honor. Hypotheses then attack gaps between that baseline
and the strongest references.

### 4. Identify competitors and adjacent companies

Think about two groups:
- Direct competitors - apps that solve the same problem
- Adjacent companies with great design - apps in related spaces known for excellent UX

### 5. Search Lazyweb (go deep — the corpus is the product)

**Search discipline:** never repeat an identical query; results are deterministic.
Page deeper with `offset` and follow the response's `pagination.next_offset`.
Read `coverage` and `warnings` on every response. On `no_matches`/`low_coverage`,
use the closest result, strip the query to its core 2-6 word UI pattern, or note
the coverage gap in the report. On `company_not_in_library`, use a suggested
company or drop the filter.

Keep a running search log at `$REPORT_DIR/work/search-log.json` — append every
query with its filters/offset as you run it. This is what makes a crashed run
resumable (results files alone don't record what was searched) and is the
ground truth for "never repeat an identical query".

Run **6-10 searches minimum**, split into two mandatory passes:

**Pass A — map the median (2-4 searches).** The in-category baseline: what
everyone in the user's space does. This is what the Safe bet completes and
what the Bold bet must NOT resemble.

```json
{"query":"<specific screen/component>","limit":30}
{"query":"<screen type>","company":"<competitor>","limit":30}
{"query":"<screen type>","category":"<category>","limit":30}
{"query":"<different description of same thing>","limit":30}
```

**Pass B — hunt the edges (4-6 searches, REQUIRED — never skip).** Deliberately
search OUTSIDE the obvious category and BELOW the screen-name level. This pass
exists to feed the Bold and Wild-card bets; a corpus that only contains the
median can only produce median recommendations.

```json
{"query":"<the underlying FUNCTION, not the screen name — 'data visualization with gamification' not 'dashboard'>","limit":30}
{"query":"<same screen type>","category":"<deliberately unrelated category: Gaming, Entertainment, Music, Editorial...>","limit":30}
{"query":"<the persuasion mechanism itself, e.g. 'live activity feed', 'interactive product demo'>","limit":30}
{"query":"<a second unrelated category doing the same job>","limit":30}
```

Cross-pollination routing: finance → look at Gaming/Entertainment/Music;
productivity → Fitness/Travel/Social; e-commerce → Education/Health;
developer tools → Editorial/Games. The more distant the category, the more
novel the transferable mechanism. Yield ranking from live runs:
**function-level and mechanism-level queries find the most usable outliers;**
screen-type + unrelated-category is the weakest shape (often low coverage) —
run it last and drop it first when budget-constrained. While reading Pass B results, collect
**outliers**: references that do something structurally unlike everything in
Pass A. Outliers are the raw material of the Bold and Wild-card bets — note
for each one the mechanism (what it DOES, not what it looks like), why it
works in its home context, and what would have to adapt to transfer.

Then **expand with `lazyweb_find_similar`** on the 2-3 strongest results
(highest similarity + best `visionDescription` fit) to pull in their visual
neighbors. This is how the corpus gets from "three or four screenshots" to a
real reference set.

When a current-state screenshot exists, also run `lazyweb_compare_image` with
it (`image_base64` + `mime_type`) and fold the top structural matches into the
reference set — visual similarity from the control itself is the strongest
grounding move available.

`lazyweb_compare_image` and `lazyweb_find_similar` results often come back
without a `visionDescription` and sometimes with null/near-duplicate metadata.
Handle them explicitly:
- A result with no `visionDescription` is usable ONLY if you view the image
  yourself (vision) and write the caption from what you actually see — tag it
  "agent-described". Never attach it unviewed.
- Skip entries with null `siteId`/`pageUrl` AND no description.
- Dedupe same-company near-duplicates: keep at most one screen per company per
  cluster unless the duplicates demonstrate different patterns.

Platform routing:
- SaaS, web, desktop app, admin surface, or marketing page -> use `platform: "desktop"`
- iPhone/Android app -> use `platform: "mobile"`
- General research or cross-platform -> omit platform and judge returned images

Assess quality:
- `matchCount` 2/3 or 3/3 = strong
- `matchCount` 1/3 = weak
- `similarity` > 0.4 = good

**Selection target: 12-20 references** for a normal run (floor: 8 before the
report can claim a healthy corpus; if fewer survive screening, add a `.corpus`
thin-evidence banner and say so). Relevance is the only bar — more *relevant*
references is strictly better; padding with loose matches is worse than fewer.

Rules for attaching references to the report:
1. Read `visionDescription` before using ANY screenshot.
2. The screenshot MUST directly illustrate the point it supports.
3. If `visionDescription` does not match your suggestion, do not use it.
4. Never guess what is in a screenshot. If there is no `visionDescription`, skip it
   (or vision-verify it yourself per the rule above).
5. Use `visionDescription` to write accurate captions and `alt` text.

Mismatched references destroy user trust faster than anything else.

### 6. Search connected inspiration libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library search URL: `$LB goto "{searchUrl}"`
2. Snapshot the page: `$LB snapshot -i`
3. Search for the research query: `$LB fill @eN "{query}"`
4. Submit and wait: `$LB press Enter` then `$LB snapshot -i`
5. Screenshot only the most relevant results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
6. Label all library-sourced references in the report with `[Mobbin]`, `[Savee]`, etc.

If a library session has expired, tell the user and skip it. Do not block the run.

### 7. Web research and live screenshot capture

Lazyweb gives curated screenshots. Web captures give the latest competitor state.
Do both unless MCP is unavailable and the user wants a web-only fallback.

Find URLs via WebSearch — cover both the median and the edges:
- Search for "[topic] UX best practices [current year]"
- Search for "[competitor name] [screen type]"
- Search for "best [screen type] examples"
- Search for "unconventional [screen type] design" and
  "creative [screen type] examples [current year]" — Awwwards / FWA /
  CSS Design Awards winners and experimental sites are often the strongest
  Bold/Wild-card seeds, because nobody in the user's category is looking at
  them

Collect 3-8 URLs. For the most useful ones, capture viewport screenshots into
`work/` first; move (or trim) a capture into `references/` only once the
report actually embeds it:

```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/pricing"
  $LB screenshot "$REPORT_DIR/work/example-pricing-page.png"
fi
```

If browse capture is unavailable, include web evidence only when you can describe
it accurately from a reliable source. Do not invent a screenshot.

Inspect every capture before using it. If a capture is defective (cookie/email
modal covering the page, blank below the fold, half-loaded), dismiss the modal
via browse and recapture, or trim a copy to the loaded region. Never present a
broken capture as evidence; keep originals in `$REPORT_DIR/work/`, not
`references/`.

### 8. Experiment evidence (growth/monetization screens only)

For landing pages, pricing, paywalls, checkout, onboarding, referral, and other
growth/monetization screens, call `lazyweb_ab_test_research` when available to
validate or challenge a bet you already formed from reading the control. Treat
learnings as directional unless the tool returns measured lift. If the tool is
unavailable or returns no on-context experiments, say so in the relevant card
("design-prevalence signal") — never imply measured lift.

Context traps with this tool:
- **Discard off-context experiments** (wrong platform or screen type, e.g.
  mobile paywall tests for a web landing page) instead of citing them.
- The tool's own `confidence` field grades corpus retrieval, not evidence
  strength — your evidence wording comes from the honesty taxonomy, never from
  that field.
- Use `category` as the industry filter. Do not pass the user's product name as
  a company filter; treat `product` as target context only, and check the
  response `warnings` for silently-applied filters before trusting a zero-result
  answer.

### 9. Cluster the corpus and prepare references

`$REPORT_DIR` was created in step 2 (create it now with the same `mkdir` if
step 2 was skipped).

Group the selected references into **2-4 named clusters of similar approaches**
("Proof-wall heroes", "Product-demo-first", "Editorial minimal", "Data-dense
operator"). Clusters drive both the Inspo map (cluster labels over neighboring
points) and the bets (each bet should draw mainly on one cluster). A cluster
needs 2+ members; singletons are outliers — usable as a Wild-card seed or a
pattern, but not a cluster.

Do not download Lazyweb database images. Use the returned `imageUrl`/`image_url`
directly in HTML. Supabase storage-backed image URLs are signed for 365 days and
intended for report embedding. If a selected Lazyweb result has no returned image
URL, omit the image and rely on `visionDescription` plus text.

For web-captured examples, save descriptive filenames such as
`stripe-pricing-page.png` or `linear-onboarding-step1.png`.

**Keep `references/` publish-clean:** the publish step uploads every file in
`references/`. Only files actually referenced by `report.html` belong there;
working files (full-page originals, base64 payloads, untrimmed captures,
search logs) live in `$REPORT_DIR/work/`, which is never uploaded.

## Hypothesis Engine (the core of the Recommendation)

The unit of analysis is a falsifiable bet, not a component list and not a theme.
This mirrors `lazyweb-paywall-optimization`, with the screenshot corpus playing
the role of the experiment corpus — and it **indexes on creativity**: the value
of this report over a competent designer's first instinct is the bets a median
competitor would never generate. A set of three reasonable suggestions is a
failed run, even if every section renders perfectly.

A good hypothesis takes this form:

> Making [specific change] should [specific outcome] because [specific mechanism].

Good: "Replacing the testimonial-quote hero with a numbers-first proof wall
(subscriber count, named outcomes, logos) should lift email signups because
this audience buys evidence of results, not promises."
Bad: "Improve the hero." / "Make it more premium."

### Grounding (required)

Every hypothesis must be anchored to a **named friction from the control read**
(step 3) — not to a reference you happened to like. References and prevalence
support a hypothesis; they never originate it. **Anti-hybrid checksum:** before
writing each bet, confirm it answers "what would you change about THIS screen,
and why" — not "what does reference X look like". If a bet reads as a
description of someone else's screenshot, rewrite it.

### Creativity engine (mandatory ideation pass — run BEFORE choosing bets)

LLMs and corpora both regress to the mode: left alone, every "option" becomes
a tasteful rearrangement of the category median. This pass exists to fight
that. Do it in working notes, before committing to bets:

1. **Name the dominant convention set** from Pass A — the 3-5 moves everyone
   in this category makes ("testimonial hero", "3-column feature grid",
   "logos + CTA"). This is the median you must beat, not the menu you pick
   from.
2. **Overgenerate: draft 8-12 candidate moves**, forcing coverage of these
   operators (at least one candidate per operator):
   - **Inversion** — do the opposite of a dominant convention (everyone
     claims value in copy → remove the copy and show only the product;
     everyone gates content → give the best content away on the landing page).
   - **Format transplant** — rebuild the page as a different artifact: a live
     feed, an interactive demo, a terminal, a letter from the founder, a
     quiz, a gallery, a receipt, a game. The page stops being "a landing
     page that describes X" and becomes "X itself".
   - **Cross-category mechanism transfer** — take an outlier from Pass B,
     extract what it DOES (not what it looks like), and apply it here.
   - **Extremify** — find the category's most timid version of a promising
     idea and push it to its logical extreme (one testimonial → a wall of
     400; one stat → the entire hero is the live number).
   - **Constraint flip** — delete a "required" element entirely (no hero, no
     nav, no pricing table, no sign-up form) and design what fills the void.
3. **Score each candidate** on novelty-in-category (would any Pass A
   reference do this?) × mechanism fit (is there a real reason it converts
   HERE?). Discard weird-for-weird's-sake (high novelty, no mechanism) and
   median-with-makeup (mechanism, no novelty).
4. The Bold and Wild-card slots MUST be filled from the surviving
   high-novelty candidates. If none survive, the corpus is the problem — go
   back to Pass B and the unconventional web search, don't ship three
   reasonable bets.

### Bet archetypes (forced divergence — a thinking tool, not visible chips)

Produce 2-4 bets and assign each exactly one archetype. The archetypes exist to
force divergence during ideation; they are NOT rendered as chips in the report —
the option card's one-to-two-sentence description carries the idea in plain
words.

- **Safe bet** — completes the highest-prevalence conventions the control is
  missing or mis-using. Low risk, evidence-rich, ships fastest. Cite the
  prevalence count ("7 of 14 references do X; control does not"). This is the
  ONLY bet allowed to sound reasonable on first read.
- **Bold bet** — **breaks or inverts a dominant category convention**, or
  restructures the page around a model no direct competitor uses. NOT "the
  strongest cluster's strategy" — that is the median of the best, and it
  belongs in the Safe bet. **Prevalence ceiling:** if more than ~20% of the
  in-category corpus already does it, it is not bold — relabel it Safe and
  ideate again. Apply the ceiling to the bet's actual structural move at the
  granularity the bet specifies (e.g. "renders a FULL issue as the page", not
  the broader "shows content previews"), and state that slice explicitly in
  the evidence line so the count is checkable. Evidence for a Bold bet is
  **mechanism proof** (outlier or
  cross-category references showing the mechanism working), plus the
  in-category absence stated as the opportunity ("0 of 14 in-category
  references do this — whitespace, not risk-free").
- **Wild card** — a full cross-category or format transplant from the
  creativity engine: the kind of move that makes the reader pause. Cite the
  off-category source honestly in the description ("single source, outside
  this category") and name the risk. Grounded novelty means the MECHANISM has
  proof somewhere real — it does not mean the move is common anywhere.

A normal run ships one Safe bet, one Bold bet, and a Wild card (optionally a
second Bold with a different mechanism). Never ship two bets with the same
persuasion mechanism, regardless of archetype.

### Anti-collapse rules (the reason options used to look the same)

- Each bet must differ from every other bet on **at least two** of: page
  strategy, persuasion mechanism, information architecture, trust source, and
  primary component set.
- Reject bets that only vary palette, typography, density, theme, or tone.
- Reject a bet that recommends a convention the control already uses unless it
  changes how that convention is used — verify against the step-3 control read.
- **The reasonableness test:** read the three bets cold. If every one of them
  sounds obviously sensible — if nothing makes you pause — the set has
  collapsed to the median. Regenerate the Bold and Wild slots from the
  creativity engine. A good set has exactly one bet that reads "of course",
  one that reads "that's a real swing", and one that reads "wait — really?"
  (and survives the mechanism question). The test grades the MOVE, not the
  proof: strong evidence never makes a wild move "too reasonable" — attach
  maximum proof to the wildest bets, never under-evidence one to keep it
  sounding daring.
- **The planning-meeting test (Bold/Wild):** would the move survive a median
  competitor's planning meeting *without anyone calling it risky*? If yes, it
  is not bold. "Add social proof", "clarify the value prop", "restructure the
  hero" sail through unchallenged — they fail. "Delete the signup form above
  the fold" gets someone saying "wait, is that safe?" — it passes.
- Pre-imagegen self-check: if all prompts could plausibly produce the same
  hero/form/card layout with different colors, rewrite them before generating.
- Each bet should draw mainly on a *different* slice of the corpus (Safe ←
  Pass A median, Bold ← outliers/edges, Wild ← cross-category). If two bets
  cite the same three references, they are probably one bet.

### Each bet must carry (in the working notes)

1. Its archetype (Safe / Bold / Wild card)
2. The hypothesis sentence ("Making X should Y because Z")
3. The named control friction it attacks
4. Evidence, matched to the archetype: a Safe bet cites prevalence ("7 of 14
   do X"); a Bold/Wild bet cites **mechanism proof** (the outlier or
   cross-category references where the mechanism demonstrably works) plus the
   in-category absence as the opportunity ("0 of 14 in-category references do
   this"), backed by evidence-of-search. Each bet embeds the 2-3 references
   that prove its claim (+ experiment learning when step 8 found one)
5. A one-line skip condition (when this bet is the wrong move)
6. A detailed `.build-prompt` specific enough that another agent could
   implement it: audience, tone, layout, hierarchy, components, copy strategy,
   visual rules, references to borrow from and to avoid, and the outcome it
   optimizes

In the rendered option card, items 2-5 compress into a structured
`.opt-points` bullet list under the title — `<b>What:</b>` / `<b>Why:</b>` /
`<b>Proof:</b>` / `<b>Skip if:</b>`, one short line each, lead-ins bolded. No
chips, no badge clutter, no paragraph prose. The mini evidence deck and the
collapsed `.build-prompt` carry the rest.

### Pick the winner

Rank the bets by expected impact, evidence strength, implementation effort, and
brand/product fit — but beware the structural bias: evidence VOLUME favors the
Safe bet by construction (the median always has more references). Do not let
reference count alone crown the winner; weigh the mechanism argument and the
upside for THIS screen. It is fine — often right — for the Bold bet to win.
Exactly one is `Recommended` — it loads first in the
side-by-side slot next to Control (the ◀ ▶ switcher cycles the others) and
leads the options carousel. Ranking is conveyed by order and the `Recommended`
caption — no legend table, no rank chips. No ties, no "it depends" hedging in
the visible body; the runner-ups exist so the user can choose taste/risk, not
because the agent refused to decide.

### Hypothesis-to-prototype workflow

1. Draft the bets per the rules above, then write each bet's `.build-prompt`.
2. Feed the prompts into image generation **in parallel** and save outputs as
   `$REPORT_DIR/references/prototype-{bet-slug}.png`. Generate prototypes at
   roughly one to one-and-a-half viewport heights (16:10 to 16:15) — a
   prototype is a screen, not a full long-scroll page.
3. The recommended bet's prototype loads in the compare slot beside Control
   (with the variant switcher cycling the other bets' prototypes); every bet
   also renders in the options carousel.

### Fast parallel image generation

Image prototypes are the slowest part of this skill. Optimize for getting the
report in front of the user quickly:

- Build all image prompts first, then launch all prototype generations in
  parallel. Do not generate prototype images sequentially unless the host only
  supports one job at a time.
- Default prototype/image agents to **medium effort**. Use **low effort** when
  the user asks for speed, quick exploration, or rough directions. Use high
  effort only when the user explicitly asks for production-grade fidelity or a
  final design artifact.
- Render the report as soon as the first usable image set is available. If some
  non-default options are still generating, include prompt-ready placeholder
  cards and update/regenerate later rather than blocking the whole report.
- Normal skill execution must not run full `npm test`, full browser QA, or eval
  comparisons. Those are development/eval checks, not user-facing report steps.

Provider fallback order:

1. Use the native host image generation tool when available.
2. If native imagegen is unavailable, use a configured external image API such
   as Nano Banana or Gemini when local credentials/tooling are available
   (probe env vars/CLIs; prefer the provider with credentials and file output).
3. **Rasterized HTML prototype:** hand-build each bet as a standalone HTML/CSS
   page (using the bet's `.build-prompt` as the spec), load it with the browse
   binary, and screenshot it to `references/prototype-{bet-slug}.png`. This
   yields a real, legible prototype image and is the standard fallback when no
   bitmap generator exists — it fills the side-by-side compare slot exactly
   like a generated image. (Do not use Codex CLI for image generation; it
   cannot emit bitmaps.)
4. If neither an image provider nor browse exists, render the recommended
   bet's layout as a live `.mock` mock-frame in the compare's right slot, and
   ship the option deck as prompt-ready `.prototype-option` cards with images
   marked `not generated` and the structured `.build-prompt` visible/copyable.
   The compare's right slot must never be empty when a control exists.

Image prompt template:

```text
CONTROL
Attachment label: CONTROL
Describe the current page/screenshot and the current conversion goal.

WHAT TO IMPROVE
The named friction this bet attacks, for example proof arrives too late,
the CTA is generic, or the page asserts value without showing the product.

HOW TO IMPROVE
The bet's hypothesis, persuasion mechanism, information architecture,
primary components, and trust source. This section must make the option
structurally different from the other options. For Bold/Wild bets, EXPLICITLY
forbid the generic landing-page skeleton in the prompt ("do NOT render a
standard hero + 3-column features + CTA layout") and describe the
unconventional structure concretely, section by section — image generators
regress to the median exactly the way ideation does, and a bold hypothesis
rendered as a generic page reads as a safe bet in the report.

INSPIRATION
Attachment label: INSPO A - {reference name}
What to borrow: {specific layout/component/trust move}
What not to borrow: {specific mismatch}

Attachment label: INSPO B - {reference name}
What to borrow: {specific layout/component/trust move}
What not to borrow: {specific mismatch}

ATTACHMENTS
Upload/attach CONTROL plus INSPO A and INSPO B when the provider supports image
inputs. If attachment upload is unavailable, include their image URLs and visible
captions in the prompt.
```

### Prototype fidelity rules

Choose fidelity from request specificity:

- **High fidelity** - the user provides a current screenshot/URL or enough
  product context plus specific screen, outcome, and style constraints. Render a
  polished prototype with realistic layout, hierarchy, copy blocks, controls, and
  visual treatment.
- **Medium fidelity** - the screen and outcome are clear, but current-state or
  brand context is thin. Render a credible layout with real section names,
  content placeholders, and the recommended interaction model.
- **Low fidelity** - the request is broad, exploratory, or vague. Render a clean
  structural prototype that communicates hierarchy and flow without pretending to
  know the brand/product details.

Choose fidelity before building the prototype. Do not burden the visible report
with fidelity rationale.

## Report v3 Contract

Write directly to `.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}/report.html`.
Do not create a Markdown version.

The report should make the recommendation faster to parse than prose ever
could. Lead with the answer, keep copy minimal, and let large legible visuals
carry the argument. The layout principle is **visual-first**: wide canvas
(`max-width:min(1480px,95vw)`), big images, generous vertical space for
evidence, minimal chrome. The user should never squint, click, or scroll
sideways to see the proof — and never wade through chips, tables, or
explanation paragraphs to reach it.

### Desktop screenshot window rule (applies to EVERY desktop screenshot)

Long-scroll pages are never rendered at full height anywhere in the report.
Every desktop/web screenshot — compare frames, option-card prototypes, deck
figures, inspo thumbnails AND their hover expansions, pattern figures — shows a
**viewport window**: a crop from one to one-and-a-half viewport heights
(aspect ratio between 16:10 and 16:15), cropped from the top unless the
evidence sits lower, in which case shift the window (`object-position` /
`--pos`) to contain it. The lightbox (explicit click) is the only place a full
page may appear. Mobile/portrait screenshots are exempt from the windowing —
they show the whole screen in compare frames, option cards, decks, and
pattern figures (resting inspo thumbnails may show a top-anchored portrait
window; hover/expansion reveals the whole screen). This rule exists because a
6000px-tall figure makes everything around it unreadable.

### Visible section order

```text
# Design Research: {Topic}

## Agent Instructions
{Light-blue copy block for the downstream coding agent — section #1.}

## Goal
{One short sentence restating the target outcome.}

## Recommendation
{What+why intro line (why bolded); side-by-side Control × Recommended with a ◀ ▶ variant switcher; "The 'why' behind the recommendations" title; options carousel with bolded What/Why/Proof/Skip-if bullets. No legend table.}

## Inspo
{Optional clustered 2x2 reference map, 8-16 points. Omit below 8 comparable references.}

## Interesting Patterns
{Viewport-window reference screenshots with CSS bounding-box callouts on the interesting area.}
```

Do not render visible standalone sections named `Recommendations / Next Steps`,
`Key Examples`, `Patterns`, `Anti-Patterns`, `Unique Angles`, `Findings`, or
`Sources`. Provenance belongs in image `alt` text, `data-source` attributes,
the machine handoff block, and the compact footer. When the corpus is thin,
single-source, or context-mismatched, put a one-line `.corpus` banner directly
after Agent Instructions.

### Agent Instructions — report section #1

One plain human sentence, then a copy-pastable block written FOR A DOWNSTREAM
CODING AGENT:

```html
<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    <button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>
  </div>
  <p class="ai-human">{one human sentence: the recommended bet, stated as the thing to build first}</p>
  <pre class="ai-block">LAZYWEB REPORT — AGENT HANDOFF
Use the report at {REPORT_PATH} as a starting point for {TASK}.

TOP RECOMMENDATIONS (do first):
1. {recommended bet, one imperative line}
2. {runner-up bet}
3. {runner-up bet}

INDEX ON: {the control frictions the recommended bet attacks}
DO NOT OVER-INDEX ON: {directional-not-measured signals, off-category references}
DIVE FURTHER: {next Lazyweb skill or MCP tool} — {why}

Evidence basis: {N Lazyweb references + M web captures (+ experiments if used)} · {DATE}</pre>
</section>
```

### Recommendation section

The recommendation is the product of the report. Layout, top to bottom — and
nothing else (no legend table, no ranking chips):

1. **Intro line** (`.rec-intro`): one-two sentences directly under the
   `Recommendation` heading stating WHAT the recommended bet changes and WHY
   it should win — with the why in `<b>bold</b>`. Example: "Make the best
   breakdown the landing page itself, with the email ask arriving mid-read —
   <b>because the content is the only proof this newsletter has, and a reader
   who is 40% through an issue has already been converted by the product, not
   the pitch.</b>"
2. **Side-by-side compare** (`.compare`): Control on the left, the recommended
   prototype on the right, in two equal columns with **identical height-locked
   frames** (same `aspect-ratio`, `object-fit:cover` from the top for desktop;
   `.compare.mobileset` shows whole portrait screens at a shared fixed height).
   Matching frames are what make side-by-side work — never let one column
   render taller than the other. Stack only below 880px viewport width.
   **The crop must show the recommended bet's decisive evidence**: if the
   change lives below a 16:10 fold, either set `object-position` on both
   frames to the decisive region or use the shared `.compare.tall` (16:15,
   ≈1.5 viewports) variant — both frames always keep the same ratio.
   The right frame's caption row holds the bet name plus **◀ ▶ variant
   switcher buttons** (`.vnav`) that swap the right image through ALL the
   bets' prototypes in place — the user flips variants without leaving the
   comparison. With JS disabled the recommended prototype shows. The caption
   reads `Recommended — {bet name}` for the winner and just `{bet name}` for
   the others as they cycle. If there is no control (greenfield research),
   omit the compare grid entirely: the recommended prototype renders
   full-width in its place, keeping the caption + variant switcher.
3. **Section title** (`.why-h`): an `<h3>` reading `The "why" behind the
   recommendations` between the compare and the options carousel, so the
   carousel reads as the reasoning section, not a second gallery.
4. **Options carousel** (`.option-deck`): every bet (recommended first) as a
   same-size `.prototype-option` card in a horizontal snap scroller with ◀ ▶
   nav. Each card: title, the FULL prototype image uncropped (`.proto-full` —
   natural height capped, `object-fit:contain`), then a structured
   `.opt-points` bullet list — NOT a paragraph. Three to four short bullets,
   each opening with a bolded lead-in: `<b>What:</b>` the change in one line;
   `<b>Why:</b>` the mechanism ("the product demonstrates its value before
   asking; the control asks on faith"); `<b>Proof:</b>` the evidence in plain
   words ("pi.fyi + Morning Brew run content-first pages; 0 of 14 in-category
   render a full issue — directional, no measured lift"); `<b>Skip if:</b>`
   the one-line wrong-move condition. Then a mini evidence `.deck` of 2-3
   references (add a `.deck-nav` when more than two cards are present), and
   the collapsed `.build-prompt`. **No archetype chips, no evidence badges**
   — the bolded bullet lead-ins are the only structure.

When image generation is unavailable and a layout must still be shown, render
an HTML/CSS `.mock` mock-frame (mobile or desktop) inside the option card —
never ASCII art. When step 8 returned experiment evidence with control/variant
images, render the pair with the shared `.flip` two-up grid inside the bet's
evidence area.

Keep chrome quiet: thin borders, no heavy shadows or nested cards. Counts like
"8 selected references" live in the `.opt-points` bullets, hidden metadata, or
the handoff block — never as standalone metric chips.

### Optional Inspo section

Include `Inspo` only when at least **8 comparable references** can be
positioned meaningfully. It is a clustered 2x2 map for browsing real designs —
a place to *look*, not a diagram. Aim for 8-16 points; plotting the whole
selected corpus is encouraged when the axes hold.

Rules:
- Derive the x/y axes from the corpus, for example `restrained -> assertive`,
  `serious -> playful`, `familiar -> novel`, `low density -> high density`, or
  `utility-led -> emotion-led`. If no honest axes exist, omit the section.
- Plot each reference once using `.inspo-point` with an `.inspo-img` thumbnail.
  Points are decently sized (≈180-220px wide at default scale) — visible
  designs, not dots.
- Place the 2-4 cluster labels from step 9 (`.cluster-label`) over their
  member groups. Position cluster members near each other; the clusters ARE
  the insight of the map.
- **Hover/focus enlarges the design in place** (≈520px) — still as a viewport
  window per the desktop window rule, never the full long-scroll page. Portrait
  references (tag the point `.mob`) show the whole phone screen on hover.
  Click/tap opens the full-size image in the lightbox. Keyboard focus must
  trigger the same expansion.
- Every visible point is image-only: no company names, captions, or labels
  inside the tile. Accurate `alt` text and `data-source` carry provenance.
- Size the map to its population by setting `--map-h` inline on `.inspo-map`:
  ≈ 520px for 8-10 points, up to ≈ 760px for 14-16. Do not let a sparse map
  dwarf the patterns section below it — when in doubt, smaller map, bigger
  patterns.
- Keep point anchors inside roughly 12%-88% on both axes so resting thumbnails
  and hover expansions stay within the map (the CSS also clamps as a backstop).
- If there are fewer than 8 meaningful comparable references, omit `Inspo`
  and do not mention the omission in the report body.

### Interesting Patterns section

Patterns are viewport-window screenshots with the interesting area called out
by a CSS bounding box — context preserved around the evidence, but never a
full long-scroll page (desktop window rule) and never a box baked into the
image file.

For a healthy corpus target **5-9 patterns**; use fewer only when the corpus is
genuinely thin, and never pad with weak ones. Only include patterns that
influenced a bet or expose a surprising transferable move.

Patterns render in a **two-column grid** (`.patterns-grid`, stacking to one
column below ~980px) so the section stays compact — each pattern fills its
column rather than spanning the page. Each pattern uses `.pattern-shot` with
an `.annotated` figure:

- The figure is a **fixed-window frame**: `aspect-ratio` via `--ar` (default
  16:11, allowed range 16:10 to 16:15), image `object-fit:cover` with the
  window positioned via `--pos` so the evidence plus surrounding context is
  visible. Desktop figures fill the grid column; mobile figures
  (`.annotated.mobile`, `min(420px,100%)`) show the whole screen at natural
  height. Add `flip-label` to a `.bbox` whose top edge sits in the upper ~10%
  of the window so its label chip drops below the box instead of clipping.
- Overlay one or more `.bbox` elements at **percentage coordinates**
  (`--x/--y/--w/--h`) **relative to the visible window**, so the callout
  scales with the report. Each box carries a short label chip naming the move;
  with a single box, the box spotlights its area by dimming the rest. With
  multiple boxes, add `multi` to the `.annotated` figure — boxes render as
  plain outlines (stacked dims would darken each other).
- **Derive coordinates by actually looking at the image** (read it with vision
  before writing the box) and verify against the rendered window — if you
  cannot place the box confidently, ship the window with a caption and no box.
  A wrong box is worse than no box.
- Use reference screenshots from Lazyweb or web research, not the user's
  control screenshot — the control belongs in `Recommendation`.
- Title states the observation; add a `.prev` prevalence chip when the pattern
  backs a bet. Provenance in `alt`/`data-source`, not visible prose paragraphs.

### Report rescale + lightbox (required interactions)

- Fixed `.scalebar` (bottom-right): three buttons `S / M / L` setting
  `data-scale` on `<html>`. All image-bearing components size through the
  `--s` CSS variable so the whole report rescales: compare width, option
  cards, inspo map + points, pattern figures. Default `M` (`--s:1`); `S` is
  `.78`, `L` is `1.25`. JS-optional — without JS the report renders at `M`.
- A single `#lb` lightbox at the end of `<body>`: clicking any inspo point,
  pattern figure, compare frame, or prototype image opens the full image —
  this is the one place a full-height page is allowed.
  JS-optional enhancement; every image is already legible inline without it.
- The compare variant switcher (`__vstep`) is JS too; with JS off the
  recommended prototype renders statically.

### Evidence and confidence

- Every claim in the visible body must have nearby evidence: a prototype
  decision, an image-only map point, an annotated pattern, or a deck card.
- Quantify prevalence ("7 of 14 selected references") instead of asserting it
  ("near-universal"). Counts always refer to the selected corpus.
- For growth/monetization screens, use `lazyweb_ab_test_research` when available.
  If no experiment data is found, say "design-prevalence signal" in the relevant
  sentence instead of implying measured lift.
- Evidence strength is carried **in plain words inside the description
  sentences** ("directional — 7 of 14 references", "single source, outside
  this category", "measured: +12% in one experiment") — not as badge chips.
- Never fabricate a reference, metric, company name, or screenshot content.

### HTML requirements

The `report.html` file should:

- Be a single HTML file with inline CSS and small inline JS only for the copy
  button, deck/carousel nav, variant switcher, scalebar, and lightbox; the
  report must still be fully understandable with JS disabled.
- Use the existing Lazyweb tokens:
  `--ink:#1f2328; --mut:#57606a; --line:#d0d7de; --soft:#eef4fb; --accent:#0969da`.
- Use absolute Lazyweb `imageUrl`/`image_url` values for Lazyweb references;
  relative `references/{filename}` paths only for current-state, web-captured,
  and generated prototype images saved locally.
- Every generated prototype carries accurate `alt` text and a collapsed
  `.build-prompt` with the exact implementation brief, because generated images
  may mangle small text.
- **Escape every interpolated string.** Bet names, captions, alt text,
  provenance, and URLs come from corpus data and WILL contain quotes. In HTML
  attributes (`alt`, `data-source`) and caption text escape `"` `<` `>` as
  `&quot;` `&lt;` `&gt;`. Inside the `_vars` JS string literals escape
  apostrophes (`\'`) and backslashes — one unescaped apostrophe in a bet name
  is a SyntaxError that kills the lightbox, switcher, and scalebar together.
- Avoid horizontal page overflow at every scale setting and viewport width.
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"` —
  skip this in a headless/CI/no-GUI environment and just report the path.
  Similarly, when AskUserQuestion is unavailable or the run is unattended,
  make the closest reasonable assumption and state it in the handoff block.

Baseline markup (adapt details to the evidence):

```html
<section id="goal" class="goal">
  <h2>Goal</h2>
  <p>{one-sentence target outcome}</p>
</section>

<section id="recommendation" class="recommendation">
  <h2>Recommendation</h2>
  <p class="rec-intro">{What the recommended bet changes, in one clause} — <b>{why it should win, one sentence}</b></p>
  <div class="compare">
    <figure class="cmp control">
      <figcaption>Control</figcaption>
      <div class="cmp-frame"><img src="references/current-state.png" alt="{accurate current-state description}" onclick="window.__zoom&&__zoom(this)"></div>
    </figure>
    <figure class="cmp is-recommended">
      <figcaption><span id="vname">Recommended — {Bet 1 name}</span>
        <span class="vnav"><button type="button" aria-label="Previous variant" onclick="window.__vstep&&__vstep(-1)">&#9664;</button><button type="button" aria-label="Next variant" onclick="window.__vstep&&__vstep(1)">&#9654;</button></span>
      </figcaption>
      <div class="cmp-frame"><img id="vimg" src="references/prototype-{bet-1-slug}.png" alt="{accurate prototype description}" onclick="window.__zoom&&__zoom(this)"></div>
    </figure>
  </div>

  <h3 class="why-h">The &ldquo;why&rdquo; behind the recommendations</h3>
  <div class="deckwrap">
    <div class="option-deck">
      <article class="prototype-option is-recommended" id="bet-1">
        <h3>{Bet 1 name} <span class="rec-flag">Recommended</span></h3>
        <figure class="proto-full"><img class="prototype-img" src="references/prototype-{bet-1-slug}.png" alt="{accurate description}" loading="lazy" onclick="window.__zoom&&__zoom(this)"></figure>
        <ul class="opt-points">
          <li><b>What:</b> {the change, one line}</li>
          <li><b>Why:</b> {the mechanism, one line}</li>
          <li><b>Proof:</b> {evidence in plain words — references + count + strength, one line}</li>
          <li><b>Skip if:</b> {the one-line wrong-move condition}</li>
        </ul>
        <div class="deck mini">
          <figure class="shot-web"><img src="{imageUrl}" alt="{visionDescription-based alt}" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')"><figcaption class="cap"><span class="src">[Lazyweb]</span> <b>{Company}</b> — {exact UI detail}</figcaption></figure>
          <figure class="shot-web"><img src="{imageUrl}" alt="{alt}" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')"><figcaption class="cap"><span class="src">[Lazyweb]</span> <b>{Company}</b> — {exact UI detail}</figcaption></figure>
        </div>
        <!-- mini deck with 3+ figures: append this generic nav right after the .deck (scrolls its previous sibling):
        <div class="deck-nav">
          <button type="button" aria-label="Previous" onclick="var d=this.closest('.deck-nav').previousElementSibling,f=d.querySelector('figure');d.scrollBy({left:-((f?f.offsetWidth:240)+12),behavior:'smooth'})">&#9664;</button>
          <button type="button" aria-label="Next" onclick="var d=this.closest('.deck-nav').previousElementSibling,f=d.querySelector('figure');d.scrollBy({left:(f?f.offsetWidth:240)+12,behavior:'smooth'})">&#9654;</button>
        </div> -->
        <details class="build-prompt"><summary>Agent prompt</summary><p>{detailed implementation brief}</p></details>
      </article>
      <!-- repeat per bet (no .is-recommended, no .rec-flag) -->
    </div>
    <div class="deck-nav">
      <button type="button" aria-label="Previous" onclick="var d=this.closest('.deckwrap').querySelector('.option-deck'),f=d.querySelector('article');d.scrollBy({left:-((f?f.offsetWidth:560)+16),behavior:'smooth'})">&#9664;</button>
      <button type="button" aria-label="Next" onclick="var d=this.closest('.deckwrap').querySelector('.option-deck'),f=d.querySelector('article');d.scrollBy({left:(f?f.offsetWidth:560)+16,behavior:'smooth'})">&#9654;</button>
    </div>
  </div>
</section>

<section id="inspo" class="inspo">
  <h2>Inspo</h2>
  <div class="inspo-map" style="--map-h:640px;--x-left:'Restrained';--x-right:'Assertive';--y-top:'Emotion-led';--y-bottom:'Utility-led'">
    <span class="inspo-axes" aria-hidden="true"></span>
    <span class="cluster-label" style="--x:24%;--y:22%">Proof-wall heroes</span>
    <button class="inspo-point" type="button" style="--x:20%;--y:30%" data-source="{provenance}" onclick="window.__zoom&&__zoom(this.querySelector('img'))">
      <img class="inspo-img" src="{imageUrl}" alt="{accurate visionDescription-based alt}" loading="lazy">
    </button>
    <!-- 8-16 points (portrait refs get class="inspo-point mob") + 2-4 cluster labels -->
  </div>
</section>

<section id="interesting-patterns" class="patterns">
  <h2>Interesting Patterns</h2>
  <div class="patterns-grid">
    <article class="pattern-shot">
      <h3>{Pattern observation} <span class="prev">seen in 4 of 14</span></h3>
      <figure class="annotated" style="--ar:16/11;--pos:center top">
        <img src="{imageUrl}" alt="{accurate reference description}" loading="lazy" data-source="{provenance}" onclick="window.__zoom&&__zoom(this)">
        <span class="bbox" style="--x:6%;--y:58%;--w:42%;--h:24%"><i>{Short label naming the move}</i></span>
      </figure>
    </article>
    <!-- repeat .pattern-shot per pattern; the grid is two columns on desktop -->
  </div>
</section>

<footer class="lw-foot">Powered by <a href="https://www.lazyweb.com">Lazyweb</a> &mdash; turn your agent into a design researcher... for free!</footer>

<div id="lb" aria-hidden="true"><button type="button" class="x" aria-label="Close">×</button><img alt="Expanded image"></div>
<div class="scalebar" role="group" aria-label="Report scale">
  <button type="button" data-s="s">S</button><button type="button" data-s="" aria-pressed="true">M</button><button type="button" data-s="l">L</button>
</div>
<script>
document.body.classList.add('has-js');
var _lb=document.getElementById('lb'),_i=_lb&&_lb.querySelector('img');
window.__zoom=function(g){if(!_lb)return false;_i.src=g.currentSrc||g.src;_lb.classList.add('open');_lb.setAttribute('aria-hidden','false');return false;};
if(_lb)_lb.addEventListener('click',function(){_lb.classList.remove('open');_lb.setAttribute('aria-hidden','true');_i.removeAttribute('src');});
var _vars=[
  {n:'Recommended — {Bet 1 name}',s:'references/prototype-{bet-1-slug}.png',a:'{alt 1}'},
  {n:'{Bet 2 name}',s:'references/prototype-{bet-2-slug}.png',a:'{alt 2}'},
  {n:'{Bet 3 name}',s:'references/prototype-{bet-3-slug}.png',a:'{alt 3}'}
],_vi=0;
window.__vstep=function(d){_vi=(_vi+d+_vars.length)%_vars.length;var v=_vars[_vi],img=document.getElementById('vimg');img.src=v.s;img.alt=v.a;document.getElementById('vname').textContent=v.n;};
document.querySelectorAll('.scalebar button').forEach(function(b){b.addEventListener('click',function(){
  if(b.dataset.s)document.documentElement.setAttribute('data-scale',b.dataset.s);else document.documentElement.removeAttribute('data-scale');
  document.querySelectorAll('.scalebar button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});});});
</script>
```

Minimum CSS contract:

```css
:root{--ink:#1f2328;--mut:#57606a;--line:#d0d7de;--soft:#eef4fb;--accent:#0969da;--s:1}
html[data-scale="s"]{--s:.78}html[data-scale="l"]{--s:1.25}
body{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:#fff}
main{max-width:min(1480px,95vw);margin:0 auto;padding:32px clamp(16px,3vw,40px) 56px}
h1,h2,h3,p{letter-spacing:0}h1{font-size:34px;line-height:1.1;margin:0 0 24px}h2{font-size:24px;margin:40px 0 14px}h3{font-size:16px;margin:14px 0 6px}
.goal p{font-size:20px;max-width:820px;margin:0}
.agent-instructions{background:var(--soft);border-left:4px solid var(--accent);border-radius:8px;padding:14px 16px;margin:18px 0}
.ai-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px}
.ai-badge{font-size:11px;font-weight:700;letter-spacing:.04em;color:#0a3b78}
.ai-copy{font-weight:600;font-size:12px;line-height:1;cursor:pointer;border:1px solid var(--accent);color:var(--accent);background:#fff;border-radius:6px;padding:5px 11px}.ai-copy:hover{background:var(--accent);color:#fff}
.ai-human{margin:0 0 10px;font-size:15px}
.ai-block{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid var(--line);border-radius:6px;padding:12px 13px;margin:0;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;user-select:all}
.corpus{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#8a5a00;background:#fff8e6;border:1px solid #f0e0b0;border-radius:8px;padding:9px 12px;margin:14px 0}.corpus b{color:var(--ink)}
/* recommendation intro + section title */
.rec-intro{max-width:980px;margin:0 0 16px;font-size:16px;line-height:1.55;color:var(--mut)}
.rec-intro b{color:var(--ink)}
.why-h{font-size:19px;margin:28px 0 4px}
/* side-by-side compare — equal height-locked frames + variant switcher */
.compare{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;max-width:calc(1400px*var(--s))}
.cmp{margin:0;min-width:0}
.cmp figcaption{margin:0 0 8px;min-height:28px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);display:flex;gap:8px;align-items:center;justify-content:space-between}
.cmp.is-recommended figcaption{color:var(--accent)}
.vnav{display:none;gap:4px}
.has-js .vnav{display:inline-flex}
.vnav button{cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:6px;width:30px;height:24px;font-size:11px;line-height:1}
.vnav button:hover{background:var(--soft);border-color:var(--accent);color:var(--accent)}
.cmp-frame{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fafbfc;aspect-ratio:16/10}
.cmp-frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;cursor:zoom-in}
.compare.tall .cmp-frame{aspect-ratio:16/15}
.compare.mobileset .cmp-frame{aspect-ratio:auto;height:calc(560px*var(--s));display:flex;align-items:center;justify-content:center;background:#0d1117}
.compare.mobileset .cmp-frame img{width:auto;height:92%;object-fit:contain;border-radius:14px}
/* options carousel */
.deckwrap{margin:18px 0 8px}
.option-deck{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:4px 2px 12px;scrollbar-width:thin}
.option-deck>article{flex:0 0 calc(min(640px,84vw)*var(--s));scroll-snap-align:start;margin:0;border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:10px;min-width:0}
.option-deck>article.is-recommended{border-color:var(--accent)}
.option-deck h3{margin:0;font-size:17px;display:flex;align-items:center;gap:8px}
.rec-flag{font-weight:700;font-size:10.5px;line-height:1;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)}
.opt-points{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:13.5px;color:var(--mut);line-height:1.5}
.opt-points b{color:var(--ink)}
.prototype-img{cursor:zoom-in}
.proto-full{margin:0}.proto-full img{display:block;width:100%;height:auto;max-height:calc(560px*var(--s));object-fit:contain;object-position:top;border:1px solid var(--line);border-radius:8px;background:#fafbfc;cursor:zoom-in}
.build-prompt{font-size:13px;color:var(--mut)}.build-prompt summary{cursor:pointer;font-weight:700;color:var(--ink)}
/* mini evidence deck (also reused for any multi-reference proof) */
.deck{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 8px;scrollbar-width:thin}
.deck>figure{flex:0 0 46%;max-width:320px;scroll-snap-align:center;margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.deck.mini>figure{flex-basis:44%;max-width:260px}
.deck>figure>img{display:block;width:100%;height:auto;max-height:calc(420px*var(--s));object-fit:contain;background:#fafbfc}
.deck>figure.shot-web>img{aspect-ratio:16/10;height:auto;max-height:none;object-fit:cover;object-position:top}
.deck>figure.img-missing>img{display:none}
.deck>figure.img-missing figcaption::after{content:' — image unavailable; see description';color:#cf222e}
.deck .cap{font-size:12px;color:var(--mut);padding:7px 9px;line-height:1.4}.deck .cap b{color:var(--ink)}
.deck .src{font-size:10.5px;font-weight:700;letter-spacing:.03em;color:var(--accent)}
.deck-nav{display:none;gap:6px;justify-content:flex-end;margin-top:2px}
.has-js .deck-nav{display:flex}
.deck-nav button{cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:6px;width:34px;height:28px;font-size:13px;line-height:1}
.deck-nav button:hover{background:var(--soft);border-color:var(--accent);color:var(--accent)}
.prev{font-weight:600;font-size:11.5px;line-height:1;color:#0a3b78;background:var(--soft);border-radius:20px;padding:4px 10px;vertical-align:middle}
/* clustered inspo map — set --map-h inline per population (520px for 8-10 points ... 760px for 14-16) */
.inspo-map{position:relative;min-height:calc(var(--map-h,640px)*var(--s));border:1px solid var(--line);border-radius:10px;background:linear-gradient(var(--line),var(--line)) 50% 0/1px 100% no-repeat,linear-gradient(90deg,var(--line),var(--line)) 0 50%/100% 1px no-repeat,#fff}
.inspo-map::before{content:var(--y-top);position:absolute;top:10px;left:50%;transform:translateX(-50%);color:var(--mut);font-size:12px;font-weight:700;z-index:10;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}
.inspo-map::after{content:var(--y-bottom);position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:var(--mut);font-size:12px;font-weight:700;z-index:10;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}
.inspo-axes{position:absolute;inset:0;pointer-events:none;z-index:10}
.inspo-axes::before{content:var(--x-left);position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--mut);font-size:12px;font-weight:700;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}
.inspo-axes::after{content:var(--x-right);position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--mut);font-size:12px;font-weight:700;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}
.cluster-label{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);font-weight:700;font-size:11px;line-height:1;color:var(--mut);background:rgba(255,255,255,.88);border:1px dashed var(--line);border-radius:14px;padding:5px 11px;pointer-events:none;z-index:5;white-space:nowrap}
.inspo-point{position:absolute;left:clamp(calc(100px*var(--s)),var(--x),calc(100% - 100px*var(--s)));top:clamp(calc(70px*var(--s)),var(--y),calc(100% - 70px*var(--s)));transform:translate(-50%,-50%);width:calc(200px*var(--s));padding:0;border:1px solid var(--line);border-radius:6px;background:#fff;cursor:zoom-in;overflow:hidden;transition:width .15s ease,left .15s ease;box-shadow:0 1px 4px rgba(31,35,40,.08)}
.inspo-point:hover,.inspo-point:focus-visible{z-index:20;width:min(calc(520px*var(--s)),46vw);left:clamp(min(calc(260px*var(--s)),23vw),var(--x),calc(100% - min(260px*var(--s),23vw)));box-shadow:0 8px 30px rgba(31,35,40,.22);outline:2px solid var(--accent);outline-offset:2px}
.inspo-img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:var(--pos,top center);background:#fafbfc}
.inspo-point:hover .inspo-img,.inspo-point:focus-visible .inspo-img{aspect-ratio:16/11}
.inspo-point.mob .inspo-img{aspect-ratio:9/16;object-fit:cover;object-position:top center}
.inspo-point.mob:hover,.inspo-point.mob:focus-visible{width:min(calc(340px*var(--s)),30vw)}
.inspo-point.mob:hover .inspo-img,.inspo-point.mob:focus-visible .inspo-img{aspect-ratio:auto;max-height:min(72vh,calc((var(--map-h,640px) - 40px)*var(--s)));object-fit:contain}
/* annotated patterns — two-column grid of viewport-window screenshots + CSS bounding boxes */
.patterns-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;max-width:calc(1400px*var(--s))}
@media(max-width:980px){.patterns-grid{grid-template-columns:1fr}}
.pattern-shot{margin:10px 0 18px;min-width:0}
.pattern-shot h3{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:15px}
.annotated{position:relative;margin:0;width:100%;max-width:calc(720px*var(--s));aspect-ratio:var(--ar,16/11);border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fafbfc}
.annotated img{display:block;width:100%;height:100%;object-fit:cover;object-position:var(--pos,center top);cursor:zoom-in}
.annotated.mobile{width:calc(min(420px,100%)*var(--s));aspect-ratio:auto}
.annotated.mobile img{height:auto;object-fit:fill;object-position:initial}
.bbox{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);border:2px solid var(--accent);border-radius:4px;box-shadow:0 0 0 200vmax rgba(15,23,42,.16);pointer-events:none}
.bbox>i{position:absolute;left:-2px;bottom:calc(100% + 6px);font:700 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-style:normal;color:#fff;background:var(--accent);border-radius:5px;padding:5px 9px;white-space:nowrap}
.bbox.flip-label>i{bottom:auto;top:calc(100% + 6px)}
.annotated.multi .bbox{box-shadow:none}
/* shared furniture: mock-frame (no-imagegen fallback) + control/variant flip (experiment evidence) */
.mock{margin:14px 0}.mock .frame{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}.mock.mobile .frame{max-width:300px;border-radius:26px;border:8px solid #1f2328}.mock.desktop .frame{max-width:760px}
.mock .body{padding:14px;display:flex;flex-direction:column;gap:10px}.mock .box{background:var(--soft);border:1px dashed #b9c7d6;border-radius:8px;min-height:34px;display:flex;align-items:center;justify-content:center;color:#4a5a6a;font-size:12px;padding:8px}.mock .box.cta{background:var(--accent);border:0;color:#fff;font-weight:600}.mock .row{display:flex;gap:10px}.mock .row>.box{flex:1}.mock .cap{font-size:12px;color:var(--mut);margin-top:6px;text-align:center}
.flip{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-bottom:8px}
@media(max-width:560px){.flip{grid-template-columns:1fr}}
.flip>figure{margin:0}
.flip>figure>img{width:100%;height:auto;max-height:580px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#fafbfc}
.flip figcaption{font-weight:600;font-size:12px;line-height:1.4;margin-top:5px}
.flip .side{display:inline-block;font-weight:700;font-size:10px;line-height:1;letter-spacing:.04em;border-radius:5px;padding:3px 7px;margin-right:6px}
.flip .side.c{color:#6e7781;background:#f6f8fa}
.flip .side.v{color:#0a5d2a;background:#e6f4ea}
.flip .vd{display:block;font-weight:400;color:var(--mut);font-size:11.5px;margin-top:3px}
.flip figure.img-missing>img{display:none}
.flip figure.img-missing figcaption::after{content:' — image unavailable; see description';color:#cf222e;font-weight:400}
/* scalebar + lightbox */
.scalebar{display:none;position:fixed;right:16px;bottom:16px;z-index:40;gap:4px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:5px;box-shadow:0 4px 14px rgba(31,35,40,.14)}
.has-js .scalebar{display:flex}
.scalebar button{font-weight:700;font-size:11px;line-height:1;font-family:inherit;border:1px solid transparent;background:none;color:var(--mut);border-radius:5px;padding:7px 10px;cursor:pointer}
.scalebar button[aria-pressed="true"]{color:var(--accent);border-color:var(--accent);background:var(--soft)}
#lb{display:none;position:fixed;inset:0;z-index:50;background:rgba(13,17,23,.86);align-items:center;justify-content:center;padding:28px}
#lb.open{display:flex}
#lb img{max-width:96vw;max-height:92vh;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.55);background:#161b22}
#lb .x{position:absolute;top:18px;right:22px;color:#fff;font-weight:700;font-size:26px;line-height:1;font-family:inherit;cursor:pointer;background:none;border:0}
.lw-foot{margin-top:40px;padding-top:14px;border-top:1px solid var(--line);text-align:center;font-size:13px;color:var(--mut)}
@media(max-width:880px){.compare{grid-template-columns:1fr}.compare.mobileset .cmp-frame{height:calc(480px*var(--s))}.option-deck>article{flex-basis:88vw}.inspo-map{min-height:calc(480px*var(--s))}.inspo-point{width:calc(150px*var(--s))}.inspo-point:hover,.inspo-point:focus-visible{width:min(86vw,calc(420px*var(--s)));left:clamp(min(43vw,calc(210px*var(--s))),var(--x),calc(100% - min(43vw,calc(210px*var(--s)))))}}
```

CSS gotcha: never write `font:700 10px/1 inherit` — `inherit` is not a valid
font-family inside the `font` shorthand and browsers drop the whole
declaration. Use longhands (`font-weight`/`font-size`/`line-height`);
font-family inherits by default (declare `font-family:inherit` only on
button/form elements).

## Operating principles & evidence components (REQUIRED - overrides convenience)

These four rules override convenience. A report that breaks them is
non-conforming, even if every section is present.

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, anti-pattern, bet, "what's working" item, or
recommendation — must render the real screenshot(s) that demonstrate it,
*beside the claim*, never a scroll away. When more than one reference backs a
claim, render them as a `.deck` snap-carousel (all references visible,
scroll-snaps with ◀ ▶ prev/next buttons; a mini deck whose 2 cards are both
fully visible may omit the nav), never a bullet list or a cross-reference to
another section. Prevalence words ("most", "near-universal",
"dominant") must be backed by a shown count ("7 of 14 references"), never an
adjective alone. Never render a proposed layout as ASCII/box-drawing `<pre>`
art — use a generated image or an HTML/CSS mock-frame.

**2. Be opinionated; carry the decision.**
Lead with ONE recommended bet, marked in the human-visible body (it loads in
the side-by-side slot and leads the options carousel with a `Recommended`
flag), not only in the handoff block. Every runner-up's description states in
plain words when to prefer it and when to skip it. No ties among top picks; no
flat undifferentiated menu of co-equal options — order IS the ranking.

**3. Maximize confidence with evidence.**
Back each bet with what worked for OTHER apps (real screenshots) PLUS
supporting data, matched to the bet's nature: prevalence counts back Safe
bets; Bold/Wild bets are backed by mechanism proof from outlier or
cross-category references plus the stated in-category absence ("0 of 14
in-category references do this"), with evidence-of-search behind the absence.
For growth/monetization screens add experiment learnings via
`lazyweb_ab_test_research` when available; when unavailable, say so. Never
ship a bet with no visual and no number behind it — but the number for a
creative bet may legitimately be the whitespace count, not a prevalence count.
Low in-category prevalence is not weak evidence for a Bold bet; it is the point.

**4. Be truth-seeking — never overclaim.**
Carry evidence strength in plain words inside each description sentence —
**measured** (real lift number) vs **directional** (visual prevalence, no
lift) vs **single source / outside this category** — not as badge chips.
Forbid comparative-performance verbs ("outperforms", "converts better") unless
a measurement backs them. Put a one-line `.corpus` banner right after Agent
Instructions when evidence is single-source, thin (<8 selected references), or
context-mismatched. Tag any brand inferred from a URL/vision description
("brand inferred - verify"). Show absence claims ("no reference does X") with
evidence-of-search: queries run × screens reviewed plus the closest near-miss.
Never invent a reference, a metric, or a company name. The handoff block and
the human-visible body must agree about confidence.

Every embedded screenshot must be legible inline at the default scale — never
require a click to understand it, never a tiny thumbnail-as-proof. Desktop
screenshots always follow the viewport-window rule; the lightbox and hover
expansion are enhancements, not the only way to see the evidence.

## Comparison Eval Contract

When validating a report re-architecture, create eval artifacts under
`.lazyweb/eval-design-research-v3-{YYYY-MM-DD}/` and keep any old-skill copy
outside `skills/` so it is never installed or routed as a visible mode.

Use this fixed prompt for the old/new comparison:

> Research an upsell pricing page for a desktop SaaS product converting free users to paid without feeling pushy. Recommend the page structure and evidence-backed patterns.

Save:
- `old-skill/SKILL.md` - copy of the old instructions
- `old/report.html` - old report output
- `new/report.html` - new report output
- `compare.html` - side-by-side scorecard and links
- `metrics.json` - machine-readable timings, tool-call counts, reference counts, and blind review scores

Instrument both runs as well as the host allows:
- Total elapsed time and old-vs-new delta
- Per-step timing: context detection, Lazyweb search, web research/capture,
  synthesis, prototype/report writing, and final handoff
- Tool-call count by tool name, including Lazyweb MCP, web search,
  browser/capture, shell, and agent calls
- Design-reference count: total references found, references selected,
  references shown per bet, references placed in the map, and patterns annotated

For quality, ask another agent in a fresh context to review only the original
prompt and anonymized report files labeled `Report A` and `Report B`. The judge
scores each report 1-5 on:
- Easy to parse
- Sharp recommendation
- Divergence between options
- Actionable design improvement
- Trust in process/evidence
- Evidence-to-recommendation fit

Require short citations to visible report elements for every score. Reveal
old/new only after scoring and include the winner plus reasoning in `compare.html`.

## Quality Calibration

- Lazyweb screenshots are evidence - use what is visibly in them.
- Web articles are opinions - filter for quality.
- Synthesis is interpretation - label it honestly.
- Do not over-index on weak Lazyweb results (`matchCount` 1/3, similarity < 0.3).
- When the corpus is weak, add the `.corpus` banner and avoid padding.
- 14 relevant references beat 20 loose ones; 8 relevant references beat 14
  loose ones. Relevance is the bar, then volume.
- A wrong bounding box is worse than no bounding box; a mislabeled cluster is
  worse than no map.
- Three reasonable bets is a failed run. The Safe bet earns trust; the Bold
  and Wild bets earn the report its existence. Novelty must always carry a
  mechanism ("why this converts HERE") — weird-for-weird's-sake is as much a
  failure as median-with-makeup.
