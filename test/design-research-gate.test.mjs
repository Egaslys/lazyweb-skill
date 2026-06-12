import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

// Extract the REPORT_CONTRACT python gate from the skill so the fixture tests
// exercise the exact code agents run before publishing.
const skill = readFileSync(path.join(root, "skills/lazyweb-design-research/SKILL.md"), "utf8");
const gateMatch = skill.match(/<<'REPORT_CONTRACT_EOF'\n([\s\S]*?)\nREPORT_CONTRACT_EOF/);
assert.ok(gateMatch, "REPORT_CONTRACT gate not found in SKILL.md");
const gatePy = gateMatch[1];

const template = readFileSync(path.join(root, "skills/lazyweb-design-research/report-template.html"), "utf8");

function runGate(html) {
  const dir = mkdtempSync(path.join(tmpdir(), "lw-gate-"));
  const htmlPath = path.join(dir, "report.html");
  const pyPath = path.join(dir, "gate.py");
  writeFileSync(htmlPath, html);
  writeFileSync(pyPath, gatePy);
  try {
    const out = execFileSync("python3", [pyPath, htmlPath], { encoding: "utf8" });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, out: `${err.stdout || ""}${err.stderr || ""}` };
  }
}

test("gate FAILS on the raw template (example content must not publish)", () => {
  const res = runGate(template);
  assert.equal(res.ok, false, "raw template should fail the gate");
  assert.match(res.out, /unfilled template example content/);
});

test("gate PASSES on a properly filled report", () => {
  let filled = template
    .replace(/\s*data-ex="[^"]*"/g, "")
    .replace(/https:\/\/picsum\.photos\/seed\/([a-z0-9-]+)\/(\d+)\/(\d+)/g, "references/$1.png")
    .replace(/<!--~[\s\S]*?~-->/g, "");
  const res = runGate(filled);
  assert.equal(res.ok, true, `filled report should pass, got: ${res.out}`);
  assert.match(res.out, /REPORT_CONTRACT_OK/);
});

test("gate FAILS when removed Patterns markup reappears", () => {
  let filled = template
    .replace(/\s*data-ex="[^"]*"/g, "")
    .replace(/https:\/\/picsum\.photos\/seed\/([a-z0-9-]+)\/(\d+)\/(\d+)/g, "references/$1.png")
    .replace(/<!--~[\s\S]*?~-->/g, "")
    .replace("</main>", '<section class="patterns"><h2>Interesting Patterns</h2><article class="pattern-shot"></article></section></main>');
  const res = runGate(filled);
  assert.equal(res.ok, false, "patterns markup should fail the gate");
  assert.match(res.out, /removed patterns section/);
});

const SKELETON_FIXTURE = `<!doctype html><html><head>
<meta name="lazyweb-report-state" content="skeleton">
<meta http-equiv="refresh" content="60">
<title>t</title></head><body><main>
<h1>Design Research: T</h1>
<div class="genbar"><span class="pulse"></span><span><b>This report is generating.</b></span>
<span class="eta">usually ready in 5-12 min · started 21:42 PST</span></div>
<section class="goal"><h2>Goal</h2><p>g</p></section>
<div class="compare">
<figure class="cmp control"><figcaption>Control</figcaption><div class="cmp-frame"><img src="references/current-state.png" alt="c"></div></figure>
<figure class="cmp is-recommended"><figcaption>Recommended — generating</figcaption><div class="cmp-frame"><div class="pending-ref"><span class="spin"></span><p class="pt">3 redesign bets are being generated</p></div></div></figure>
</div></main></body></html>`;

test("gate skeleton mode: valid skeleton passes", () => {
  const res = runGate(SKELETON_FIXTURE);
  assert.equal(res.ok, true, res.out);
});

test("gate skeleton mode: skeleton without genbar/timestamp fails", () => {
  const res = runGate(SKELETON_FIXTURE.replace(/started 21:42 PST/, "soon"));
  assert.equal(res.ok, false);
  assert.match(res.out, /Generating banner/);
});

test("gate full mode: skeleton leftovers in a final report fail", () => {
  let filled = template
    .replace(/\s*data-ex="[^"]*"/g, "")
    .replace(/https:\/\/picsum\.photos\/seed\/([a-z0-9-]+)\/(\d+)\/(\d+)/g, "references/$1.png")
    .replace(/<!--~[\s\S]*?~-->/g, "")
    .replace("</main>", '<div class="genbar">leftover</div></main>');
  const res = runGate(filled);
  assert.equal(res.ok, false);
  assert.match(res.out, /skeleton leftovers/);
});
