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
for (const match of allSkillText.matchAll(/\b(?:lazyweb_(?:health|search|find_similar|compare_image|list_categories|list_collections|ab_test_research|paywall_cta_research|get_workflows|get_flows|find_experiments|recent_experiments)|search_screenshots|list_filters|list_all_filters|vision_screenshots|metadata_screenshots|get_company_details|list_companies_by_categories)\b/g)) {
  assert.ok(documentedLazywebTools.has(match[0]), `skill docs mention unknown Lazyweb MCP tool: ${match[0]}`);
}

const setupPath = path.join(root, "setup");
assert.ok(existsSync(setupPath), "missing root setup script");
assert.ok(statSync(setupPath).mode & 0o111, "root setup must be executable");

for (const binName of ["lazyweb-context-detect", "lazyweb-log", "lazyweb-telemetry-flush", "lazyweb-update-check"]) {
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
  /## Report v2 Contract/,
  /## Goal/,
  /## Recommendation/,
  /## Inspo/,
  /## Interesting Patterns/,
  /Prototype fidelity rules/,
  /High fidelity/,
  /Medium fidelity/,
  /Low fidelity/,
  /\.prototype/,
  /\.inspo-map/,
  /\.inspo-point/,
  /\.inspo-img/,
  /\.pattern-shot/,
  /\.pattern-crop/,
  /\.hypothesis-strip/,
  /\.hypothesis/,
  /\.prototype-options/,
  /\.prototype-option/,
  /\.prototype-img/,
  /\.build-prompt/,
  /prototype-led/i,
  /stacked `Control` then\s+prototype options/i,
  /Do not place control and\s+prototype side\s+by side/i,
  /Hypothesis-to-prompt workflow/,
  /2-4 alternative hypotheses/,
  /detailed agent\s+prompt/i,
  /generated bitmap prototype images/i,
  /image generation is available/i,
  /HTML\/CSS only as a fallback/i,
  /2-4\s+`\.prototype-option` outputs/,
  /horizontal snap scroller/i,
  /recommended\/default prototype should be first/i,
  /take most of the available\s+viewport width/i,
  /Do not render metric or evidence-summary chips/i,
  /8 selected references/,
  /Fast parallel image generation/,
  /launch all prototype generations in\s+parallel/i,
  /medium effort/i,
  /low effort/i,
  /Normal skill execution must not run full `npm test`/,
  /Provider fallback order/,
  /native host image generation tool/i,
  /Codex CLI fallback/,
  /codex exec/,
  /model_reasoning_effort/,
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
  /conversion mechanism/,
  /information architecture/,
  /trust source/,
  /primary\s+component set/i,
  /long-scroll screenshot/i,
  /decisive crops/i,
  /6-10 references/i,
  /4-8 high-signal pattern\s+crops/i,
  /cropped reference screenshots/i,
  /uploaded\/current\/control screenshot/i,
  /Do not draw red bounding boxes/i,
  /Do not add explanatory copy under the crop/i,
  /320-460px wide/i,
  /width:min\(440px,100%\)/,
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
  assert.match(designResearchText, pattern, `design-research v2 contract missing ${pattern}`);
}

for (const forbiddenHeading of [
  /^## Agent Instructions\b/m,
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
  assert.doesNotMatch(designResearchText, forbiddenV2Pattern, `design-research v2 should keep Recommendation prototype-led, stacked when applicable, and inspo image-only: ${forbiddenV2Pattern}`);
}

const agentsGuidance = read("AGENTS.md");
assert.match(agentsGuidance, /Design-research v2 exception/, "AGENTS.md should document the design-research v2 exception");
assert.match(agentsGuidance, /\.prototype-img.*\.build-prompt.*\.prototype.*\.inspo-map.*\.inspo-point.*\.inspo-img.*\.pattern-shot.*\.pattern-crop/s, "AGENTS.md should name the design-research v2 components");
assert.match(agentsGuidance, /stacked `Control` then prototype options/, "AGENTS.md should require stacked control/prototype-options for design-research v2");
assert.match(agentsGuidance, /2-4 distinct hypotheses.*detailed agent prompt.*2-4 `\.prototype-option` outputs/s, "AGENTS.md should require hypothesis-to-prompt prototype options for broad design-research work");
assert.match(agentsGuidance, /generated bitmap prototype images.*image generation is available.*HTML\/CSS `\.prototype` only as a fallback/s, "AGENTS.md should require image-generated prototypes before HTML fallback for broad design-research work");
assert.match(agentsGuidance, /prototype options.*horizontal snap scroller.*recommended option is first.*takes most of the viewport/s, "AGENTS.md should require horizontal prototype option scrolling");
assert.match(agentsGuidance, /parallel at medium effort.*low effort.*high effort/s, "AGENTS.md should require parallel medium/low-effort image generation defaults");
assert.match(agentsGuidance, /Codex CLI.*model_reasoning_effort="medium".*Nano Banana\/Gemini/s, "AGENTS.md should document provider fallback through Codex CLI and external image APIs");
assert.match(agentsGuidance, /CONTROL.*WHAT TO IMPROVE.*HOW TO IMPROVE.*INSPIRATION.*ATTACHMENTS/s, "AGENTS.md should require the structured image prompt template");
assert.match(agentsGuidance, /INSPO A.*INSPO B/s, "AGENTS.md should require labeled control and inspiration attachments");
assert.match(agentsGuidance, /conversion mechanism.*information architecture.*not only color/s, "AGENTS.md should require anti-collapse prototype differentiation");
assert.match(agentsGuidance, /recommendation metric chips such as `8 selected references`/, "AGENTS.md should forbid recommendation metric chips");
assert.match(agentsGuidance, /crops long desktop\/web screenshots/, "AGENTS.md should require cropped long-scroll evidence in design-research v2");
assert.match(agentsGuidance, /Interesting Patterns.*larger cropped reference images.*must not use the uploaded\/current\/control picture.*must not draw red boxes or numbered callouts.*must not place explanatory copy under the crop/s, "AGENTS.md should require crop-only Interesting Patterns");
assert.match(agentsGuidance, /6-10 references.*4-8 high-signal pattern crops/s, "AGENTS.md should require a broader selected proof set when the corpus supports it");

assert.match(allSkillText, /signed for\s+90 days/i, "skill docs should state Lazyweb storage image URLs are signed for 90 days");
assert.match(allSkillText, /lazyweb_find_similar` accepts `image_url` or `image_base64`/i, "router should document lazyweb_find_similar image URL input");

console.log("Lazyweb skill-pack validation passed");
