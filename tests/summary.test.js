// Tests for src/summary.js — renders the GitHub Actions job summary based on
// the gitleaks SARIF report.
//
// `@actions/core.summary` is a process-wide singleton that captures
// $GITHUB_STEP_SUMMARY at first access. So we point it at one file for the
// whole suite, and clear() between tests.

const { describe, it, expect, beforeAll, beforeEach, afterAll } = require("bun:test");
const fs = require("fs");
const os = require("os");
const path = require("path");
const core = require("@actions/core");

const realReadFileSync = fs.readFileSync;
const fixturePath = path.join(__dirname, "fixtures", "results.sarif.json");
const fixtureContents = realReadFileSync(fixturePath, "utf8");

const summaryFile = path.join(os.tmpdir(), `gh-summary-test-${process.pid}.md`);

beforeAll(() => {
  fs.writeFileSync(summaryFile, "");
  process.env.GITHUB_STEP_SUMMARY = summaryFile;
  // Intercept ONLY the sarif read; pass everything else through.
  fs.readFileSync = (p, opts) => {
    if (typeof p === "string" && p.endsWith("results.sarif")) {
      return fixtureContents;
    }
    return realReadFileSync(p, opts);
  };
});

beforeEach(async () => {
  fs.writeFileSync(summaryFile, "");
  core.summary.emptyBuffer();
});

afterAll(() => {
  fs.readFileSync = realReadFileSync;
  try { fs.unlinkSync(summaryFile); } catch {}
  delete process.env.GITHUB_STEP_SUMMARY;
});

const eventJSON = {
  repository: { html_url: "https://github.com/octocat/hello-world" },
};

describe("summary.Write", () => {
  it("renders 'No leaks detected' for exit code 0", async () => {
    const summary = require("../src/summary.js");
    await summary.Write(0, eventJSON);
    const rendered = realReadFileSync(summaryFile, "utf8");
    expect(rendered).toContain("No leaks detected");
  });

  it("renders an error heading for gitleaks failure (exit 1)", async () => {
    const summary = require("../src/summary.js");
    await summary.Write(1, eventJSON);
    const rendered = realReadFileSync(summaryFile, "utf8");
    expect(rendered).toContain("Gitleaks exited with error");
    expect(rendered).toContain("Exit code [1]");
  });

  it("renders the leaks table with rule id, commit and file for exit code 2", async () => {
    const summary = require("../src/summary.js");
    await summary.Write(2, eventJSON);
    const rendered = realReadFileSync(summaryFile, "utf8");
    expect(rendered).toContain("Gitleaks detected secrets");
    expect(rendered).toContain("aws-access-token");
    expect(rendered).toContain("abc1234");
    expect(rendered).toContain("src/secrets.js");
    expect(rendered).toContain("42");
  });

  it("includes commit, secret and file URLs built from repository html_url", async () => {
    const summary = require("../src/summary.js");
    await summary.Write(2, eventJSON);
    const rendered = realReadFileSync(summaryFile, "utf8");
    expect(rendered).toContain(
      "https://github.com/octocat/hello-world/commit/abc1234567890abcdef1234567890abcdef1234"
    );
    expect(rendered).toContain(
      "https://github.com/octocat/hello-world/blob/abc1234567890abcdef1234567890abcdef1234/src/secrets.js#L42"
    );
  });

  it("renders an unexpected-exit-code heading for codes other than 0/1/2", async () => {
    const summary = require("../src/summary.js");
    await summary.Write(99, eventJSON);
    const rendered = realReadFileSync(summaryFile, "utf8");
    expect(rendered).toContain("unexpected exit code");
    expect(rendered).toContain("[99]");
  });
});
