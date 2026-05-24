// Tests for src/config.js — pure helpers extracted from index.js.
// These exist so we can test event-type wiring and env-flag parsing without
// having to boot the full GitHub Action runtime.

const { describe, it, expect } = require("bun:test");

describe("config.parseBoolFlag", () => {
  let parseBoolFlag;
  it("module exposes parseBoolFlag", () => {
    parseBoolFlag = require("../src/config.js").parseBoolFlag;
    expect(typeof parseBoolFlag).toBe("function");
  });

  it("treats undefined / empty as the default value", () => {
    const { parseBoolFlag } = require("../src/config.js");
    expect(parseBoolFlag(undefined, true)).toBe(true);
    expect(parseBoolFlag("", true)).toBe(true);
    expect(parseBoolFlag(undefined, false)).toBe(false);
  });

  it("treats the strings 'false' and '0' as false", () => {
    const { parseBoolFlag } = require("../src/config.js");
    expect(parseBoolFlag("false", true)).toBe(false);
    expect(parseBoolFlag("0", true)).toBe(false);
  });

  it("treats any other non-empty value as true", () => {
    const { parseBoolFlag } = require("../src/config.js");
    expect(parseBoolFlag("true", false)).toBe(true);
    expect(parseBoolFlag("1", false)).toBe(true);
    expect(parseBoolFlag("yes", false)).toBe(true);
  });
});

describe("config.SUPPORTED_EVENTS", () => {
  it("contains the four supported GitHub event types", () => {
    const { SUPPORTED_EVENTS } = require("../src/config.js");
    expect(SUPPORTED_EVENTS).toEqual([
      "push",
      "pull_request",
      "workflow_dispatch",
      "schedule",
    ]);
  });
});

describe("config.resolveScheduleEvent", () => {
  it("synthesizes a repository object from env for 'schedule' events", () => {
    const { resolveScheduleEvent } = require("../src/config.js");
    const env = {
      GITHUB_REPOSITORY_OWNER: "octocat",
      GITHUB_REPOSITORY: "octocat/hello-world",
    };
    const eventJSON = {};
    const { eventJSON: out, repoName, githubUsername } = resolveScheduleEvent(
      eventJSON,
      env
    );
    expect(githubUsername).toBe("octocat");
    expect(out.repository.owner.login).toBe("octocat");
    expect(out.repository.full_name).toBe("octocat/hello-world");
    expect(repoName).toBe("hello-world");
  });

  it("does not mutate the original env object", () => {
    const { resolveScheduleEvent } = require("../src/config.js");
    const env = {
      GITHUB_REPOSITORY_OWNER: "octocat",
      GITHUB_REPOSITORY: "octocat/hello-world",
    };
    const snapshot = { ...env };
    resolveScheduleEvent({}, env);
    expect(env).toEqual(snapshot);
  });
});

describe("config.resolveGithubUsername", () => {
  it("returns owner.login for non-schedule events", () => {
    const { resolveGithubUsername } = require("../src/config.js");
    const username = resolveGithubUsername(
      "push",
      { repository: { owner: { login: "alice" } } },
      {}
    );
    expect(username).toBe("alice");
  });

  it("returns GITHUB_REPOSITORY_OWNER for schedule events", () => {
    const { resolveGithubUsername } = require("../src/config.js");
    const username = resolveGithubUsername(
      "schedule",
      {},
      { GITHUB_REPOSITORY_OWNER: "bob" }
    );
    expect(username).toBe("bob");
  });
});

describe("config.isSupportedEvent", () => {
  it("returns true for known events", () => {
    const { isSupportedEvent } = require("../src/config.js");
    expect(isSupportedEvent("push")).toBe(true);
    expect(isSupportedEvent("pull_request")).toBe(true);
    expect(isSupportedEvent("workflow_dispatch")).toBe(true);
    expect(isSupportedEvent("schedule")).toBe(true);
  });
  it("returns false for unknown events", () => {
    const { isSupportedEvent } = require("../src/config.js");
    expect(isSupportedEvent("issue_comment")).toBe(false);
    expect(isSupportedEvent("")).toBe(false);
    expect(isSupportedEvent(undefined)).toBe(false);
  });
});
