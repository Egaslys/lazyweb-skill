import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

const visibleModeSkillDirs = [
  "skills/lazyweb-design-research",
  "skills/lazyweb-quick-references",
  "skills/lazyweb-design-improve",
  "skills/lazyweb-design-brainstorm",
  "skills/lazyweb-paywall-optimization",
  "skills/lazyweb-ab-test-research"
];

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
for (const match of allSkillText.matchAll(/\b(?:lazyweb_(?:health|search|find_similar|compare_image|list_categories|list_collections|ab_test_research|get_workflows|get_flows|find_experiments|recent_experiments)|search_screenshots|list_filters|list_all_filters|vision_screenshots|metadata_screenshots|get_company_details|list_companies_by_categories)\b/g)) {
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

assert.match(allSkillText, /signed for\s+90 days/i, "skill docs should state Lazyweb storage image URLs are signed for 90 days");
assert.match(allSkillText, /lazyweb_find_similar` accepts `image_url` or `image_base64`/i, "router should document lazyweb_find_similar image URL input");

console.log("Lazyweb skill-pack validation passed");
