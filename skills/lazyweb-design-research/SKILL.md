---
name: lazyweb-design-research
route: 'Design research, best practices, competitive analysis, "what do top apps do"'
description: |
  Deep design research combining Lazyweb's screenshot database with web research.
  Produces a prototype-first HTML report with visual references and cropped patterns.
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

Evidence-backed design research that gathers real product screenshots, chooses a
single recommended direction, and renders a prototype-first HTML report.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the HTML report to `.lazyweb/design-research/{topic}-{date}/report.html`
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/design-research/{topic}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write research content into a plan file
5. After saving, show the user a concise summary, the recommendation, and the exact report path
6. Ask the user if the research looks good
7. If in plan mode, exit plan mode after the user confirms - the research is done
8. Suggest next steps: "You can now use this research to inform your implementation,
   ask `/lazyweb` to improve your current design, or start building."

The visible report must be simple: **Goal**, **Recommendation**, optional
**Inspo**, and **Interesting Patterns**. Do not produce the older busy structure
with standalone agent handoff, key examples, findings, sources, broad
recommendation lists, or long prose analysis sections. When a current page or
screenshot exists, `Recommendation` should show a stacked `Control` then
prototype options, not a side-by-side comparison that creates awkward spacing.
When the user's design direction is broad or taste-dependent, reason through
2-4 alternative hypotheses, turn each viable direction into a detailed agent
prompt, and show 2-4 prototype options for the user to choose from. For these
visual-direction prototypes, prefer generated bitmap images over hand-coded HTML
mockups when image generation is available; use HTML/CSS only as a fallback or
when the user asks for implementation-ready code. Pick a default recommendation,
but do not pretend one visual direction is obvious when the evidence supports
multiple plausible directions. Generate prototype images in parallel at medium
effort by default, or low effort when the user asks for speed/exploration.

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

**Pass `skill: "design-research"` on every Lazyweb call.** Include `"skill": "design-research"` in the arguments of each `lazyweb_*` tool call - for example `{"query": "pricing page", "limit": 30, "skill": "design-research"}`. This is optional analytics metadata; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every Lazyweb call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable. Include `"version": "<that-value>"` in every `lazyweb_*` call alongside `skill`.

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

Save as `$REPORT_DIR/references/current-state.png`. Use it to choose prototype
fidelity and to make the recommendation more specific, but do not create a
separate visible "Current State" section unless the screenshot is essential proof.

### 3. Identify competitors and adjacent companies

Think about two groups:
- Direct competitors - apps that solve the same problem
- Adjacent companies with great design - apps in related spaces known for excellent UX

### 4. Search Lazyweb

**Search discipline:** never repeat an identical query; results are deterministic.
Page deeper with `offset` and follow the response's `pagination.next_offset`.
Read `coverage` and `warnings` on every response. On `no_matches`/`low_coverage`,
use the closest result, strip the query to its core 2-6 word UI pattern, or note
the coverage gap in the report. On `company_not_in_library`, use a suggested
company or drop the filter.

Run 3-5 searches minimum with different angles:

```json
{"query":"<specific screen/component>","limit":30}
{"query":"<screen type>","company":"<competitor>","limit":30}
{"query":"<screen type>","category":"<category>","limit":30}
{"query":"<screen type>","platform":"desktop","limit":30}
{"query":"<screen type>","platform":"mobile","limit":30}
{"query":"<different description of same thing>","limit":30}
```

Platform routing:
- SaaS, web, desktop app, admin surface, or marketing page -> use `platform: "desktop"`
- iPhone/Android app -> use `platform: "mobile"`
- General research or cross-platform -> omit platform and judge returned images

Assess quality:
- `matchCount` 2/3 or 3/3 = strong
- `matchCount` 1/3 = weak
- `similarity` > 0.4 = good

Rules for attaching references to the report:
1. Read `visionDescription` before using ANY screenshot.
2. The screenshot MUST directly illustrate the point it supports.
3. If `visionDescription` does not match your suggestion, do not use it.
4. A report with 3 perfectly matched references beats 10 loose ones.
5. Never guess what is in a screenshot. If there is no `visionDescription`, skip it.
6. Use `visionDescription` to write accurate captions.

Mismatched references destroy user trust faster than anything else.

### 5. Search connected inspiration libraries

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

### 6. Web research and live screenshot capture

Lazyweb gives curated screenshots. Web captures give the latest competitor state.
Do both unless MCP is unavailable and the user wants a web-only fallback.

Find URLs via WebSearch:
- Search for "[topic] UX best practices [current year]"
- Search for "[topic] design patterns analysis"
- Search for "[competitor name] [screen type]"
- Search for "best [screen type] examples"

Collect 3-8 URLs. For the most useful ones, capture viewport screenshots:

```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/pricing"
  $LB screenshot "$REPORT_DIR/references/example-pricing-page.png"
fi
```

If browse capture is unavailable, include web evidence only when you can describe
it accurately from a reliable source. Do not invent a screenshot.

### 7. Prepare references

Determine the absolute report directory:

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Do not download Lazyweb database images. Use the returned `imageUrl`/`image_url`
directly in HTML. Supabase storage-backed image URLs are signed for 90 days and
intended for report embedding. If a selected Lazyweb result has no returned image
URL, omit the image and rely on `visionDescription` plus text.

For web-captured examples, save descriptive filenames such as
`stripe-pricing-page.png` or `linear-onboarding-step1.png`. Cap the selected
visual references at 30, but prefer fewer high-quality references.

## Report v2 Contract

Write directly to `.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}/report.html`.
Do not create a Markdown version.

The report should make the recommendation faster to parse than the old report.
Lead with the answer, keep copy short, and make every visible piece of evidence
earn its place. The user should not need to read a methodology essay before
knowing what to build.

### Visible section order

Render these semantic HTML sections in this order:

```text
# Design Research: {Topic}

## Goal
{One short sentence restating the target outcome.}

## Recommendation
{A stacked control view plus 2-4 image-generated prototype options when direction is not already settled; otherwise one prototype that carries the recommended direction.}

## Inspo
{Optional 2x2 reference map. Omit if the corpus is too thin or the axes would be fake.}

## Interesting Patterns
{Only high-signal cropped reference screenshots. One useful pattern is enough; do not pad.}
```

Do not render visible standalone sections named `Agent Instructions`,
`Recommendations / Next Steps`, `Key Examples`, `Patterns`, `Anti-Patterns`,
`Unique Angles`, `Findings`, or `Sources`. Provenance belongs in image `alt`
text, hidden metadata, machine-readable handoff metadata, and the compact
footer.

### Recommendation section

The recommendation is the product of the report. It is prototype-led in the
visible body:

- For broad visual-direction work, create generated bitmap prototype images and
  render them with `.prototype-img` inside `.prototype-option`. Do not rely on a
  hand-coded HTML mini mockup for visual exploration when image generation is
  available.
- Use a live HTML/CSS `.prototype` only when image generation is unavailable, the
  user explicitly asks for HTML, or the output needs to be implementation-ready
  code. Never use ASCII art or a static text-only wireframe when an image or HTML
  prototype can show the idea.
- Prefer 2-4 alternative directions when the user asks for a new design language,
  visual direction, style exploration, or a broad improvement goal. Each option
  must represent a distinct hypothesis, not superficial palette swaps.
- Still carry the decision: mark one option as `Recommended` and explain why in
  one concise line. The other options exist so the user can choose taste/risk,
  not because the agent refused to decide.
- When there are 2-4 prototype options, render `.prototype-options` as a
  horizontal snap scroller, not a vertical stack or equal-width grid. The
  recommended/default prototype should be first and take most of the available
  viewport width, with the next option peeking to signal horizontal scroll.
- If a current-state screenshot or URL was captured, render a stacked comparison:
  `Control` first, then `Prototype options` below it. Do not place control and
  prototype side by side; the narrow columns usually make one or both look
  broken.
- Encode the recommendation in the prototype's structure, hierarchy, copy, and
  controls. Product copy inside the prototype is expected; explanatory report
  copy next to the prototype is not.
- Keep explanatory copy to one concise line above or between the stacked views.
  Do not render a side column, `Rec` block, `Why` block, long recommendation
  list, or inspiration cards in this section.
- Do not render metric or evidence-summary chips under `Recommendation`, such as
  `8 selected references`, `3 prototypes`, or `A/B data locked`. Keep those
  counts in hidden metadata, a footer note, or the final handoff if needed.
- Keep chrome quiet. Labels such as `Control` and `Prototype` are enough; avoid
  heavy cards, nested cards, shadows, and container frames around screenshots
  unless a thin frame is needed for legibility.
- Do not explain fidelity in prose next to the prototype. If fidelity must be
  exposed, use hidden metadata or a tiny machine-handoff field, not visible
  report copy.

### Hypothesis-to-prompt workflow

Before building prototypes:

1. Draft 2-4 direction hypotheses from the user's goal and evidence corpus.
   Examples: `Operator memo`, `Proof wall`, `Premium editorial`, `Product-led
   demo`.
2. For each hypothesis, reason through:
   - the conversion/design thesis
   - the strongest supporting references
   - the main components it would change
   - the risk or tradeoff
3. Select the strongest default direction.
4. Generate a detailed `.build-prompt` for each prototype option. The prompt
   should be specific enough that another agent could implement the option:
   target audience, tone, layout, hierarchy, components, copy strategy, visual
   rules, references to borrow from, references to avoid, and conversion goal.
5. Feed those prompts into the image-generation step in parallel and render 2-4
   `.prototype-option` outputs with saved `.prototype-img` assets. Put the
   detailed prompts inside collapsed `<details>` elements so the visible report
   stays light.
6. Save generated prototype images under
   `$REPORT_DIR/references/prototype-{direction-slug}.png`. Leave the original
   generated-image file in place if the host saves one elsewhere.

The visible report may show compact `.hypothesis` cards or a `.hypothesis-strip`
inside `Recommendation`, but keep each hypothesis to a name, one-line thesis,
and a tiny evidence/risk label. Do not turn hypothesis reasoning into a long
essay.

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
- For Codex CLI fallback, override high-effort defaults explicitly:
  `codex exec -c model_reasoning_effort=\"medium\" --image CONTROL.png --image INSPO_A.png --image INSPO_B.png -o references/prototype-{direction}.txt \"{prompt}\"`.

Provider fallback order:

1. Use the native host image generation tool when available.
2. If native imagegen is unavailable and `codex` is on `PATH`, probe with
   `codex --help`, then spawn parallel `codex exec` jobs at medium effort with
   image/context attachments.
3. If Codex CLI cannot generate images, use a configured external image API such
   as Nano Banana or Gemini when local credentials/tooling are available.
4. If no image provider exists, render prompt-ready `.prototype-option` cards,
   mark images as `not generated`, and keep the structured `.build-prompt`
   visible/copyable.

For non-imagegen hosts such as Claude, test provider availability in that order:
native image tool, `codex --help`, then configured Nano Banana/Gemini env
vars or CLIs. If multiple external providers are available, prefer the provider
with local credentials and file-output support.

Image prompt template:

```text
CONTROL
Attachment label: CONTROL
Describe the current page/screenshot and the current conversion goal.

WHAT TO IMPROVE
State the specific weakness in the control, for example proof arrives too late,
the CTA is generic, or the page feels too playful for the desired trust level.

HOW TO IMPROVE
State the distinct hypothesis, conversion mechanism, information architecture,
primary components, and trust source. This section must make the option
structurally different from the other options.

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

Anti-collapse rules:

- Reject prototype options that only vary palette, typography, theme, or tone.
- Each option must differ from the others on at least two of: page strategy,
  conversion mechanism, information architecture, trust source, and primary
  component set.
- Good option sets include structural differences such as `Operator Memo`,
  `Proof Wall`, `Issue Library`, and `Build-in-Public Dashboard`.
- Before launching image generation, do a quick self-check: if all prompts could
  produce the same hero/form/card layout with different colors, rewrite them.

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

### Optional Inspo section

Include the `Inspo` section only when at least four comparable references can be
positioned meaningfully. It is a 2x2 map, not a gallery, and it should not look
like four boxed report cards.

Rules:
- Derive the x/y axes from the corpus, for example `restrained -> assertive`,
  `serious -> playful`, `familiar -> novel`, `low density -> high density`, or
  `utility-led -> emotion-led`.
- Plot each reference once using `.inspo-map`, `.inspo-point`, and `.inspo-img`.
- Every visible point is image-only. Do not show company names, source labels,
  explanation text, or captions inside the map. Use accurate `alt` text and
  hidden data attributes for provenance.
- Use decisive crops for long desktop/web pages. A 2x2 map should compare the
  relevant viewport or component, not shrink an entire long-scroll screenshot
  into an unreadable strip. Prefer above-the-fold crops for landing pages unless
  a lower section is the actual evidence.
- Keep map chrome minimal: axes and image tiles only. Avoid visible card
  containers, big borders, shadows, and captions.
- Points may enlarge on hover, keyboard focus, and click/tap, but the expanded
  state still shows the image rather than metadata.
- If there are fewer than four meaningful comparable references, omit `Inspo`
  and do not mention the omission in the report body.

### Interesting Patterns section

Only include patterns that actually influenced the recommendation or expose a
surprising transferable move. Quality beats quantity, but a rich corpus should
not feel thin. For normal desktop/web research, target 4-8 high-signal pattern
crops after screening the corpus; use fewer only when the corpus is genuinely
thin.

Each pattern uses `.pattern-shot` with a `.pattern-crop` image:
- Use reference screenshots from Lazyweb or web research, not the user's
  uploaded/current/control screenshot. The uploaded/current image belongs in
  `Recommendation` as `Control`, not in `Interesting Patterns`.
- Crop directly to the interesting area with enough surrounding margin to
  preserve context. Prefer actual cropped image assets when available; otherwise
  use CSS `object-fit` / `object-position` to frame the decisive area.
- Do not draw red bounding boxes, annotation squares, arrows, or numbered
  callouts. The crop itself should make the interesting area visible.
- Do not add explanatory copy under the crop. Use the pattern title to state the
  observation; keep provenance in `alt`, `title`, `data-source`, or hidden
  metadata.
- Use one pattern if only one is truly interesting; do not pad to a fixed count.
  If you found many useful references, select the strongest patterns rather than
  showing only the four map anchors.

Keep pattern crops around 320-460px wide in the default desktop layout and cap
their visual height when needed. For mobile, desktop, and long pages, use the
smallest legible crop that contains the evidence plus margin. Do not rely on
click-to-view as the only way to inspect proof.

### Evidence and confidence

- Every claim in the visible body must have nearby evidence: a prototype
  decision, an image-only 2x2 point, or a cropped pattern reference.
- Before synthesizing, screen enough references that the report does not feel
  under-evidenced. When results allow it, select 6-10 references total: four can
  anchor the optional 2x2 map, and the rest should appear as pattern crops or
  direct prototype evidence.
- Quantify prevalence where useful ("3 of 7 selected references") but do not turn
  the report into a table.
- For growth/monetization screens, use `lazyweb_ab_test_research` when available.
  If no experiment data is found, say "design-prevalence signal" in the relevant
  card/caption instead of implying measured lift.
- Label weak evidence honestly in the card or caption: `directional`,
  `single-source`, `off-category`, or `brand inferred - verify`.
- Never fabricate a reference, metric, company name, or screenshot content.

### HTML requirements

The `report.html` file should:

- Be a single HTML file with inline CSS and tiny inline JS only for card/map
  expansion; the report must still be understandable with JS disabled.
- Use the existing Lazyweb tokens:
  `--ink:#1f2328; --mut:#57606a; --line:#d0d7de; --soft:#eef4fb; --accent:#0969da`.
- Include CSS for `.prototype`, `.inspo-map`, `.inspo-point`, `.inspo-img`,
  `.pattern-shot`, `.pattern-crop`, and `.lw-foot`.
- Use absolute Lazyweb `imageUrl`/`image_url` values for Lazyweb references.
- Use relative paths (`references/filename.png`) only for current-state and
  web-captured screenshots saved locally.
- Use relative paths for generated prototype images saved under `references/`.
  Every image-generated prototype should have accurate `alt` text and a
  collapsed `.build-prompt` carrying the exact implementation brief because
  generated images may mangle small text.
- Avoid horizontal page overflow. On narrow screens, keep the prototype fluid
  and reduce the 2x2 image points and pattern crops.
- For current-state redesigns, stack `.control` and `.prototype-options`; do not
  use a fixed two-column control/prototype grid.
- Include CSS for `.hypothesis-strip`, `.hypothesis`, `.prototype-options`,
  `.prototype-option`, `.prototype-img`, and `.build-prompt` when the report
  includes multiple directions.
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`.

Use this component shape as the baseline and adapt details to the evidence:

```html
<section id="goal" class="goal">
  <h2>Goal</h2>
  <p>{one-sentence target outcome}</p>
</section>

<section id="recommendation" class="recommendation">
  <h2>Recommendation</h2>
  <div class="rec-stack">
    <figure class="control">
      <figcaption>Control</figcaption>
      <img src="references/current-state.png" alt="{accurate current-state description}">
    </figure>
    <p class="rec-note">Recommended: {option name}. {one-line why}</p>
    <div class="hypothesis-strip" aria-label="Design direction hypotheses">
      <article class="hypothesis is-recommended"><b>{Option A}</b><span>{one-line thesis}</span></article>
      <article class="hypothesis"><b>{Option B}</b><span>{one-line thesis}</span></article>
      <article class="hypothesis"><b>{Option C}</b><span>{one-line thesis}</span></article>
    </div>
    <div class="prototype-options">
      <figure class="prototype-option is-recommended">
        <figcaption>{Option A} <span>Recommended</span></figcaption>
        <img class="prototype-img" src="references/prototype-{option-a}.png" alt="{accurate generated prototype description}" loading="lazy">
        <p class="prototype-note">Image-generated prototype. Use the prompt below for exact implementation copy and component constraints.</p>
        <details class="build-prompt"><summary>Agent prompt</summary><p>{detailed prompt}</p></details>
      </figure>
      <figure class="prototype-option">
        <figcaption>{Option B}</figcaption>
        <img class="prototype-img" src="references/prototype-{option-b}.png" alt="{accurate generated prototype description}" loading="lazy">
        <p class="prototype-note">Image-generated prototype. Use the prompt below for exact implementation copy and component constraints.</p>
        <details class="build-prompt"><summary>Agent prompt</summary><p>{detailed prompt}</p></details>
      </figure>
    </div>
  </div>
</section>

<section id="inspo" class="inspo">
  <h2>Inspo</h2>
  <div class="inspo-map" style="--x-left:'Restrained';--x-right:'Assertive';--y-top:'Playful';--y-bottom:'Serious'">
    <button class="inspo-point" type="button" style="--x:72%;--y:31%" data-source="{provenance}">
      <img class="inspo-img" src="{imageUrl}" alt="{accurate visionDescription-based alt}" loading="lazy">
    </button>
  </div>
</section>

<section id="interesting-patterns" class="patterns">
  <h2>Interesting Patterns</h2>
  <article class="pattern-shot">
    <h3>{Pattern name}</h3>
    <div class="pattern-crop" style="--pos:center 34%">
      <img src="{imageUrl}" alt="{accurate cropped-reference description}" loading="lazy" data-source="{provenance}">
    </div>
  </article>
</section>

<footer class="lw-foot">Powered by <a href="https://www.lazyweb.com">Lazyweb</a> &mdash; turn your agent into a design researcher... for free!</footer>
```

Minimum CSS contract:

```css
:root{--ink:#1f2328;--mut:#57606a;--line:#d0d7de;--soft:#eef4fb;--accent:#0969da}
body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:#fff}
main{max-width:1120px;margin:0 auto;padding:32px 20px 48px}
h1,h2,h3,p{letter-spacing:0} h1{font-size:34px;line-height:1.1;margin:0 0 28px} h2{font-size:24px;margin:32px 0 14px} h3{font-size:16px;margin:14px 0 6px}
.goal p{font-size:20px;max-width:780px;margin:0;color:var(--ink)}
.rec-stack{display:grid;gap:16px;max-width:1040px}.control,.prototype{margin:0}.control figcaption,.prototype figcaption{margin:0 0 8px;font-size:12px;font-weight:800;text-transform:uppercase;color:var(--mut)}
.control img{display:block;width:100%;height:420px;object-fit:cover;object-position:center 42%;border:1px solid var(--line);border-radius:6px}.rec-note{max-width:860px;margin:0;font-size:16px}
.hypothesis-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.hypothesis{border:1px solid var(--line);border-radius:6px;padding:10px;background:#fff}.hypothesis b{display:block;margin-bottom:4px}.hypothesis span{display:block;color:var(--mut);font-size:13px}.hypothesis.is-recommended{border-color:var(--accent)}
.prototype-options{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 2px 10px;margin:0 -2px}.prototype-option{flex:0 0 min(920px,86vw);scroll-snap-align:start;margin:0}.prototype-option.is-recommended{flex-basis:min(980px,88vw)}.prototype-option figcaption{margin:0 0 8px;font-size:13px;font-weight:800;color:var(--ink)}.prototype-option figcaption span{color:var(--accent);font-weight:800}
.prototype-img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:6px;background:#fff}.prototype-note{font-size:12px;color:var(--mut);margin:6px 0 0}
.prototype{overflow:hidden;background:#fff}.proto-frame{min-height:360px;padding:22px;background:#fff}
.build-prompt{margin-top:8px;font-size:13px;color:var(--mut)}.build-prompt summary{cursor:pointer;font-weight:700;color:var(--ink)}
.inspo-map{position:relative;min-height:520px;background:linear-gradient(var(--line),var(--line)) 50% 0/1px 100% no-repeat,linear-gradient(90deg,var(--line),var(--line)) 0 50%/100% 1px no-repeat,#fff}
.inspo-map:before{content:var(--y-top);position:absolute;top:10px;left:50%;transform:translateX(-50%);color:var(--mut);font-size:12px}
.inspo-map:after{content:var(--y-bottom);position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:var(--mut);font-size:12px}
.inspo-point{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);width:min(220px,36vw);padding:0;border:0;border-radius:5px;background:#fff;cursor:pointer;overflow:hidden}
.inspo-point:hover,.inspo-point:focus{z-index:4;transform:translate(-50%,-50%) scale(1.18);outline:2px solid var(--accent);outline-offset:2px}
.inspo-img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top center;background:#fafbfc}
.pattern-shot{margin:16px 0 24px}.pattern-crop{width:min(440px,100%);aspect-ratio:16/10;border:1px solid var(--line);border-radius:5px;overflow:hidden;background:#fafbfc}
.pattern-crop img{display:block;width:100%;height:100%;object-fit:cover;object-position:var(--pos,center top)}
.lw-foot{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);text-align:center;font-size:13px;color:var(--mut)}
@media(max-width:760px){main{padding:24px 14px}.hypothesis-strip{grid-template-columns:1fr}.prototype-option,.prototype-option.is-recommended{flex-basis:88vw}.inspo-map{min-height:420px}.inspo-point{width:min(160px,44vw)}.pattern-crop{width:min(360px,100%)}}
```

## Comparison Eval Contract

When validating a report re-architecture, create eval artifacts under
`.lazyweb/eval-design-research-v2-{YYYY-MM-DD}/` and keep any old-skill copy
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
- Section timing where observable: `Goal`, `Recommendation`, optional `Inspo`,
  and `Interesting Patterns`
- Tool-call count by tool name, including Lazyweb MCP, web search,
  browser/capture, shell, and agent calls
- Design-reference count: total references found, references selected,
  references shown in recommendation cards, references placed in the 2x2 map,
  and screenshots cropped as interesting patterns

For quality, ask another agent in a fresh context to review only the original
prompt and anonymized report files labeled `Report A` and `Report B`. The judge
scores each report 1-5 on:
- Easy to parse
- Sharp recommendation
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
- When the corpus is weak, say so in the relevant card/caption and avoid padding.
- A report with 5 strong references beats 20 weak ones.
