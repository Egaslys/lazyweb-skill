import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

// Extract the REPORT_CONTRACT python gate from the skill so the fixture tests
// exercise the exact code agents run before publishing.
const skill = readFileSync(path.join(root, "skills/lazyweb-deep-design-research/SKILL.md"), "utf8");
const gateMatch = skill.match(/<<'REPORT_CONTRACT_EOF'\n([\s\S]*?)\nREPORT_CONTRACT_EOF/);
assert.ok(gateMatch, "REPORT_CONTRACT gate not found in SKILL.md");
const gatePy = gateMatch[1];

const template = readFileSync(path.join(root, "skills/lazyweb-deep-design-research/report-template.html"), "utf8");

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

test("gate: in-progress leftovers in a final report fail (skeleton machinery removed, guard stays)", () => {
  let filled = template
    .replace(/\s*data-ex="[^"]*"/g, "")
    .replace(/https:\/\/picsum\.photos\/seed\/([a-z0-9-]+)\/(\d+)\/(\d+)/g, "references/$1.png")
    .replace(/<!--~[\s\S]*?~-->/g, "");
  for (const [leftover, label] of [
    ['<div class="genbar">generating</div>', "genbar"],
    ['<div class="pending-ref">pending</div>', "pending-ref"],
    ['<meta http-equiv="refresh" content="60">', "meta refresh"],
    ['<meta name="lazyweb-report-state" content="skeleton">', "state tag"],
  ]) {
    const res = runGate(filled.replace("</main>", leftover + "</main>"));
    assert.equal(res.ok, false, `${label} must fail the gate`);
    assert.match(res.out, /in-progress leftovers/, `${label} flagged as in-progress leftover`);
  }
  const clean = runGate(filled);
  assert.equal(clean.ok, true, "clean final report still passes");
});
