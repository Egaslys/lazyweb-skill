import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("packages and routes generic A/B test research skill", () => {
  assert.ok(
    existsSync(path.join(root, "plugins/lazyweb/internal-skills/lazyweb-ab-test-research/SKILL.md")),
    "missing routed lazyweb-ab-test-research mode",
  );
  const router = read("plugins/lazyweb/skills/lazyweb/SKILL.md");
  assert.match(router, /lazyweb-ab-test-research/);
  assert.match(router, /A\/B tests, experiments, growth hypotheses, monetization strategy/);
});

test("packages and routes welcome and feedback skills", () => {
  assert.ok(
    existsSync(path.join(root, "plugins/lazyweb/internal-skills/lazyweb-welcome/SKILL.md")),
    "missing routed lazyweb-welcome mode",
  );
  assert.ok(
    existsSync(path.join(root, "plugins/lazyweb/internal-skills/lazyweb-feedback/SKILL.md")),
    "missing routed lazyweb-feedback mode",
  );
  const router = read("plugins/lazyweb/skills/lazyweb/SKILL.md");
  assert.match(router, /lazyweb-welcome/);
  assert.match(router, /lazyweb-feedback/);
  assert.match(router, /Bare `\/lazyweb` or `\/lazyweb:lazyweb` with no task.*lazyweb-welcome/s);
  assert.match(router, /internal-skills/);
});

test("publishes exactly one Lazyweb slash skill", () => {
  const publicSkillDirs = readdirSync(path.join(root, "plugins/lazyweb/skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(publicSkillDirs, ["lazyweb"]);
  const router = read("plugins/lazyweb/skills/lazyweb/SKILL.md");
  assert.match(router, /^name:\s*lazyweb\s*$/m);
  assert.doesNotMatch(router, /directly invocable/);
});

const publicAbTestArgs = [
  "target_screen_description",
  "product",
  "category",
  "conversion_goal",
  "constraints",
  "operation",
  "experiment_ids",
  "include_images",
  "target_image_url",
  "limit",
  "analysis_experiment_limit",
  "visual_inspection_budget",
];

const backendFindExperimentFilters = [
  "query",
  "company",
  "category",
  "screen_type",
  "platform",
  "company_ids",
  "canonical_ids",
  "since_iso",
  "limit",
  "app_store_rank_max",
  "app_store_overall_rank_max",
  "app_store_category_rank_max",
  "high_design_bar",
];

const backendRecentExperimentFilters = [
  "limit",
  "company",
  "category",
  "platform",
  "company_ids",
  "app_store_rank_max",
  "app_store_overall_rank_max",
  "app_store_category_rank_max",
  "high_design_bar",
];

function assertMentionsAll(text, values, label) {
  for (const value of values) {
    assert.match(text, new RegExp(value), `${label} should mention ${value}`);
  }
}

test("validation separates public gateway tools from backend/internal tools", () => {
  const validation = read("scripts/validate-plugin.mjs");
  assert.match(validation, /publicGatewayTools/);
  assert.match(validation, /documentedLazywebTools/);
  assert.match(validation, /live MCP missing public gateway tool/);
  assert.doesNotMatch(validation, /live MCP missing compatibility tool/);
  assert.match(validation, /"lazyweb_list_categories"/);
  assert.match(validation, /"lazyweb_list_collections"/);
  assert.match(validation, /"lazyweb_find_experiments"/);
  assert.match(validation, /"lazyweb_recent_experiments"/);
  assert.match(validation, /"lazyweb_ab_test_research"/);
});

test("README splits current public gateway from backend/internal experiment tools", () => {
  const readme = read("README.md");
  assert.match(readme, /### Current public gateway/);
  assert.match(readme, /### Backend\/internal experiment tools/);
  const gatewayStart = readme.indexOf("### Current public gateway");
  const internalStart = readme.indexOf("### Backend/internal experiment tools");
  assert.ok(gatewayStart >= 0 && internalStart > gatewayStart, "README should order gateway before internal tools");
  const gatewaySection = readme.slice(gatewayStart, internalStart);
  const internalSection = readme.slice(internalStart);
  assert.match(gatewaySection, /lazyweb_ab_test_research/);
  assert.match(gatewaySection, /lazyweb_list_categories/);
  assert.match(gatewaySection, /lazyweb_list_collections/);
  assert.doesNotMatch(gatewaySection, /lazyweb_find_experiments/);
  assert.doesNotMatch(gatewaySection, /lazyweb_recent_experiments/);
  assert.match(internalSection, /lazyweb_find_experiments/);
  assert.match(internalSection, /lazyweb_recent_experiments/);
  assert.match(internalSection, /list_companies_by_categories/);
  assert.match(readme, /"?high_design_bar"?:\s*true/);
  assert.match(readme, /companies\.high_design_bar\s*=\s*true/);
  assert.match(readme, /Do not pass those fields to the\s+public gateway unless the live tool schema includes them/);
});

test("README documents the full A/B public and backend filter matrix", () => {
  const readme = read("README.md");
  assertMentionsAll(readme, publicAbTestArgs, "README public A/B gateway args");
  assertMentionsAll(readme, backendFindExperimentFilters, "README backend find-experiments filters");
  assertMentionsAll(readme, backendRecentExperimentFilters, "README backend recent-experiments filters");
});

test("README documents first-run welcome, free screenshots, paid A/B, and feedback", () => {
  const readme = read("README.md");
  assert.match(readme, /\/lazyweb:lazyweb/);
  assert.match(readme, /welcome mode/i);
  assert.match(readme, /Only the router above should appear in slash completion/);
  assert.match(readme, /Free access includes screenshot search/);
  assert.match(readme, /only paid feature/i);
  assert.match(readme, /\$49\/month/);
  assert.match(readme, /over 20k.*A\/B tests/i);
  assert.match(readme, /what actually works/);
  assert.match(readme, /https:\/\/dashboard\.stripe\.com\/acct_1RXB5lLhlPE8lk98\/payment-links\/plink_1Tf3bXLhlPE8lk98Guda4IRf/);
  assert.match(readme, /https:\/\/www\.lazyweb\.com\/research\.md/);
  assert.match(readme, /lazyweb feedback/);
});

test("A/B research skill documents limited data and interesting learning default", () => {
  const skill = read("plugins/lazyweb/internal-skills/lazyweb-ab-test-research/SKILL.md");
  assert.match(skill, /_experiments.*limited screenshot-diff evidence set/s);
  assert.match(skill, /interesting_learning.*false/s);
  assert.match(skill, /high_design_bar/);
});

test("A/B research skill documents the full public and backend filter matrix", () => {
  const skill = read("plugins/lazyweb/internal-skills/lazyweb-ab-test-research/SKILL.md");
  assert.match(skill, /current public paid gateway/);
  assert.match(skill, /Backend\/Internal Experiment Tools/);
  assert.match(skill, /Do not pass `interesting_learning` or `high_design_bar` to the public\s+gateway unless the live tool schema includes those fields/);
  assertMentionsAll(skill, publicAbTestArgs, "A/B skill public gateway args");
  assertMentionsAll(skill, backendFindExperimentFilters, "A/B skill backend find-experiments filters");
  assertMentionsAll(skill, backendRecentExperimentFilters, "A/B skill backend recent-experiments filters");
});

test("design skills all mention high design bar filtering", () => {
  const files = [
    "plugins/lazyweb/internal-skills/lazyweb-design-improve/SKILL.md",
    "plugins/lazyweb/internal-skills/lazyweb-design-research/SKILL.md",
    "plugins/lazyweb/internal-skills/lazyweb-quick-references/SKILL.md",
    "plugins/lazyweb/internal-skills/lazyweb-design-brainstorm/SKILL.md",
    "plugins/lazyweb/internal-skills/lazyweb-ab-test-research/SKILL.md",
  ];
  for (const file of files) {
    assert.match(read(file), /high_design_bar/, `${file} should mention high_design_bar`);
  }
});

test("x_paywall_design skill is not packaged", () => {
  assert.equal(existsSync(path.join(root, "plugins/lazyweb/skills/x_paywall_design_research")), false);
  assert.equal(existsSync(path.join(root, "plugins/lazyweb/skills/x_paywall_design")), false);
});
