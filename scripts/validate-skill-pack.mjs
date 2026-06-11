import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

// Discover mode skills by iterating skills/*/ instead of a hardcoded list.
// A hardcoded list is the exact trap that left lazyweb-paywall-cta and
// lazyweb-signup-optimization unvalidated (and undocumented) after 0.4.0:
// a new mode must be picked up by adding its directory, nothing else.
const visibleModeSkillDirs = readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(path.join(root, "skills", entry.name, "SKILL.md")))
  .map((entry) => `skills/${entry.name}`)
  .sort();

assert.ok(visibleModeSkillDirs.length > 0, "no mode skills found under skills/");

const removedPluginPaths = [
  "plugins",
  "lazyweb",
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json"
];

const documentedLazywebTools = new Set([
  "lazyweb_health",
  "lazyweb_search",
  "lazyweb_find_similar",
  "lazyweb_compare_image",
  "lazyweb_list_categories",
  "lazyweb_list_collections",
  "lazyweb_ab_test_research",
  "lazyweb_paywall_cta_research",
  "lazyweb_get_workflows",
  "lazyweb_get_flows",
  "lazyweb_find_experiments",
  "lazyweb_recent_experiments",
  "search_screenshots",
  "list_filters",
  "list_all_filters",
  "vision_screenshots",
  "metadata_screenshots",
  "get_company_details",
  "list_companies_by_categories"
]);

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertSkillFile(relativePath, expectedName) {
  const text = read(relativePath);
  assert.match(text, /^---\n[\s\S]+?\n---\n/, `${relativePath} missing YAML frontmatter`);
  assert.match(text, new RegExp(`^name:\\s*${expectedName}\\s*$`, "m"), `${relativePath} wrong name`);
  assert.match(text, /^description:\s*(\||>|.+)$/m, `${relativePath} missing description`);
  return text;
}

for (const removedPath of removedPluginPaths) {
  assert.equal(existsSync(path.join(root, removedPath)), false, `${removedPath} should not exist in standalone skill pack`);
}

assert.ok(existsSync(path.join(root, "SKILL.md")), "missing root SKILL.md");
for (const dir of visibleModeSkillDirs) {
  assert.ok(existsSync(path.join(root, dir, "SKILL.md")), `missing ${dir}/SKILL.md`);
}

const router = assertSkillFile("SKILL.md", "lazyweb");
for (const mode of visibleModeSkillDirs) {
  assert.match(router, new RegExp(`${mode}/SKILL\\.md`), `router must point to ${mode}/SKILL.md`);
}
for (const removedMode of ["lazyweb-welcome", "lazyweb-feedback", "lazyweb-flows", "lazyweb-add-inspo-source", "lazyweb-remove-inspo-source"]) {
  assert.doesNotMatch(router, new RegExp(removedMode), `router must not route to removed mode ${removedMode}`);
}
assert.match(router, /curl -fsSL https:\/\/www\.lazyweb\.com\/install\.sh \| bash/);

for (const dir of visibleModeSkillDirs) {
  const name = path.basename(dir);
  const text = assertSkillFile(`${dir}/SKILL.md`, name);
  assert.match(text, /lazyweb_health/, `${dir} should verify MCP health`);
  assert.match(text, /https:\/\/www\.lazyweb\.com\/install\.sh/, `${dir} should point to standalone installer`);
}

const allSkillText = ["SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]
  .map((relativePath) => read(relativePath))
  .join("\n");
const allInstructionText = ["README.md", "AGENTS.md", "CLAUDE.md", "SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]
  .map((relativePath) => read(relativePath))
  .join("\n");
for (const match of allSkillText.matchAll(/\b(?:lazyweb_(?:health|search|find_similar|compare_image|list_categories|list_collections|ab_test_research|paywall_cta_research|get_workflows|get_flows|find_experiments|recent_experiments)|search_screenshots|list_filters|list_all_filters|vision_screenshots|metadata_screenshots|get_company_details|list_companies_by_categories)\b/g)) {
  assert.ok(documentedLazywebTools.has(match[0]), `skill docs mention unknown Lazyweb MCP tool: ${match[0]}`);
}

for (const stalePattern of [
  /Design-research v2 exception/i,
  /do not place them side by side/i,
  /Do not reintroduce a visible standalone Agent Instructions block/i,
  /v2 prototype\/inspo\/pattern-crop/i,
  /\.hypothesis-strip/,
  /\.pattern-crop/
]) {
  assert.doesNotMatch(allInstructionText, stalePattern, `stale design-research v2 guidance must not reappear: ${stalePattern}`);
}

const setupPath = path.join(root, "setup");
assert.ok(existsSync(setupPath), "missing root setup script");
assert.ok(statSync(setupPath).mode & 0o111, "root setup must be executable");

for (const binName of ["lazyweb-context-detect", "lazyweb-log", "lazyweb-telemetry-flush", "lazyweb-update", "lazyweb-update-check"]) {
  const binPath = path.join(root, "bin", binName);
  assert.ok(existsSync(binPath), `missing bin/${binName}`);
  assert.ok(statSync(binPath).mode & 0o111, `bin/${binName} must be executable`);
}

// Every discovered mode skill must be documented in the README "Visible
// Skills" table, so the docs can't drift from disk the way they did before
// (paywall-cta and signup-optimization were on disk but absent from README).
const readmeText = read("README.md");
for (const dir of visibleModeSkillDirs) {
  const slashCommand = `/${path.basename(dir)}`;
  assert.match(readmeText, new RegExp(slashCommand.replace(/[-/]/g, "\\$&")), `README.md missing ${slashCommand} in the Visible Skills table`);
}

const pluginInstallPattern = /codex plugin marketplace|claude plugin install|lazyweb@lazyweb|plugins\/lazyweb|\.codex-plugin|\.claude-plugin/;
for (const relativePath of ["README.md", "setup", "SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]) {
  const text = read(relativePath);
  assert.doesNotMatch(text, pluginInstallPattern, `${relativePath} still mentions plugin install paths`);
}

const staleScreenshotContractPatterns = [
  /\{"screenshot_id"/,
  /\bscreenshotId\b/,
  /\bscreenshotIds\b/,
  /known Lazyweb screenshot ID/i,
  /BASE\+control\.path/,
  /BASE\+variant\.path/,
  /control\/variant\.image_url do NOT exist/i,
  /Build the URL yourself/i
];
for (const relativePath of ["README.md", "SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]) {
  const text = read(relativePath);
  for (const pattern of staleScreenshotContractPatterns) {
    assert.doesNotMatch(text, pattern, `${relativePath} has stale screenshot URL/ID guidance: ${pattern}`);
  }
}

const designResearchText = read("skills/lazyweb-design-research/SKILL.md");
for (const pattern of [
  /## Report v3 Contract/,
  /## Goal/,
  /## Recommendation/,
  /## Inspo/,
  /## Interesting Patterns/,
  /Prototype fidelity rules/,
  /High fidelity/,
  /Medium fidelity/,
  /Low fidelity/,
  /\.compare/,
  /\.cmp-frame/,
  /\.option-deck/,
  /\.inspo-map/,
  /\.inspo-point/,
  /\.inspo-img/,
  /\.pattern-shot/,
  /\.annotated/,
  /\.bbox/,
  /\.prototype-option/,
  /\.prototype-img/,
  /\.proto-full/,
  /\.opt-points/,
  /\.build-prompt/,
  /side-by-side compare/i,
  /Control on the left, the recommended\s+prototype on the right/,
  /height-locked frames/i,
  /variant switcher/i,
  /options carousel/i,
  /## Agent Instructions/,
  /\.agent-instructions/,
  /\.ai-block/,
  /\.corpus/,
  /\.scalebar/,
  /\.vnav/,
  /\.cluster-label/,
  /\.patterns-grid/,
  /\.rec-intro/,
  /\.why-h/,
  /Report rescale \+ lightbox/,
  /Creativity engine/,
  /Bet archetypes/,
  /Safe bet/,
  /Bold bet/,
  /Wild card/,
  /planning-meeting test/i,
  /reasonableness test/i,
  /prevalence ceiling/i,
  /Divergence between options/,
  /Hypothesis-to-prototype workflow/,
  /2-4 bets/,
  /detailed `\.build-prompt`/i,
  /generated bitmap prototype images/i,
  /image generation is available/i,
  /HTML\/CSS only as a fallback/i,
  /same-size `\.prototype-option` card/i,
  /horizontal snap scroller/i,
  /recommended first/i,
  /never as standalone metric chips/i,
  /8 selected references/,
  /Fast parallel image generation/,
  /launch all prototype generations in\s+parallel/i,
  /medium effort/i,
  /low effort/i,
  /Normal skill execution must not run full `npm test`/,
  /REPORT_CONTRACT_OK/,
  /REPORT_CONTRACT_FAILED/,
  /option-tabs/,
  /option-panel/,
  /Reference Evidence/,
  /Source Notes/,
  /Never publish a `lazyweb-design-research` report that fails this gate/,
  /Provider fallback order/,
  /native host image generation tool/i,
  /Do not use Codex CLI for image generation/i,
  /Nano Banana/,
  /Gemini/,
  /CONTROL/,
  /WHAT TO IMPROVE/,
  /HOW TO IMPROVE/,
  /INSPIRATION/,
  /ATTACHMENTS/,
  /INSPO A/,
  /INSPO B/,
  /Anti-collapse rules/,
  /persuasion mechanism/,
  /information architecture/,
  /trust source/,
  /primary\s+component set/i,
  /Long-scroll pages/i,
  /decisive region/i,
  /8-16 points/i,
  /5-9 patterns/i,
  /viewport-window reference screenshots/i,
  /CSS bounding-box callouts/i,
  /not the user's\s+control screenshot/i,
  /image-only/i,
  /## Comparison Eval Contract/,
  /metrics\.json/,
  /Total elapsed time/,
  /Per-step timing/,
  /Tool-call count/,
  /Design-reference count/,
  /fresh context/i,
  /Easy to parse/,
  /Sharp recommendation/,
  /Trust in process\/evidence/
]) {
  assert.match(designResearchText, pattern, `design-research v3 contract missing ${pattern}`);
}

for (const forbiddenHeading of [
  /^## Recommendations \/ Next Steps\b/m,
  /^## Key Examples\b/m,
  /^## Patterns\b/m,
  /^## Anti-Patterns\b/m,
  /^## Unique Angles\b/m,
  /^## Findings\b/m,
  /^## Sources\b/m
]) {
  assert.doesNotMatch(designResearchText, forbiddenHeading, `design-research should not reintroduce old visible report heading ${forbiddenHeading}`);
}
for (const forbiddenV2Pattern of [
  /\.inspo-card/,
  /\.rec-copy/,
  /\.anno-shot/,
  /\.anno-box/,
  /<h3>Rec<\/h3>/,
  /<h3>Why<\/h3>/
]) {
  assert.doesNotMatch(designResearchText, forbiddenV2Pattern, `design-research v3 should keep Recommendation side-by-side, option-led, and inspo image-only: ${forbiddenV2Pattern}`);
}

for (const guidanceFile of ["AGENTS.md", "CLAUDE.md"]) {
  const guidance = read(guidanceFile);
  assert.match(guidance, /report v3/, `${guidanceFile} should document the design-research v3 exception`);
  assert.match(guidance, /\.compare.*\.option-deck.*\.pattern-shot.*\.annotated.*\.bbox/s, `${guidanceFile} should name the design-research v3 components`);
  assert.match(guidance, /side-by-side `\.compare`.*Control × Recommended.*height-locked frames.*variant switcher/s, `${guidanceFile} should require side-by-side control/recommendation comparison for design-research v3`);
  assert.match(guidance, /ranking is carried by order \+ a `Recommended` flag/, `${guidanceFile} should require order plus Recommended flag for design-research ranking`);
  assert.match(guidance, /\.pattern-shot`\/`\.annotated` viewport-window figures with `\.bbox` overlays/, `${guidanceFile} should require annotated viewport-window patterns`);
  assert.match(guidance, /CSS gotcha/, `${guidanceFile} should carry the font-shorthand CSS gotcha`);
}

// The invalid `font: ... inherit` shorthand is silently dropped by browsers;
// the prose mention ends with a backtick, real CSS ends with ; or } — only the
// latter is forbidden. Scoped to design-research for now: the other skills'
// CSS contracts still carry the legacy bug (tracked for a separate fix) —
// broaden to allSkillText once they are cleaned.
assert.doesNotMatch(designResearchText, /font:[^;{}`]*\binherit\s*[;}]/, "design-research CSS contract must not use `inherit` inside the font shorthand (browsers drop the declaration)");

assert.match(allSkillText, /signed for\s+365 days/i, "skill docs should state Lazyweb storage image URLs are signed for 365 days");
assert.doesNotMatch(allSkillText, /signed for\s+90 days/i, "stale 90-day signing claim must not reappear in skill docs");
assert.doesNotMatch(read("README.md"), /signed for\s+90 days/i, "stale 90-day signing claim must not reappear in README.md");
assert.match(allSkillText, /lazyweb_find_similar` accepts `image_url` or `image_base64`/i, "router should document lazyweb_find_similar image URL input");

console.log("Lazyweb skill-pack validation passed");
