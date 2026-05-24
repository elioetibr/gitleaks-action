// Tests for src/gitleaks.js
// Written test-first: capture intended behavior of pure helpers and orchestration.

const { describe, it, expect, mock, beforeEach, afterEach } = require("bun:test");

describe("gitleaks module", () => {
  describe("exports", () => {
    it("exposes the EXIT_CODE_LEAKS_DETECTED constant equal to 2", () => {
      const gitleaks = require("../src/gitleaks.js");
      expect(gitleaks.EXIT_CODE_LEAKS_DETECTED).toBe(2);
    });

    it("exposes Scan, ScanPullRequest, Install, Latest, and downloadURL", () => {
      const gitleaks = require("../src/gitleaks.js");
      expect(typeof gitleaks.Scan).toBe("function");
      expect(typeof gitleaks.ScanPullRequest).toBe("function");
      expect(typeof gitleaks.Install).toBe("function");
      expect(typeof gitleaks.Latest).toBe("function");
      // downloadURL is currently private — TDD: make it exported & testable.
      expect(typeof gitleaks.downloadURL).toBe("function");
    });
  });

  describe("downloadURL", () => {
    let downloadURL;
    beforeEach(() => {
      downloadURL = require("../src/gitleaks.js").downloadURL;
    });

    it("builds linux tar.gz URLs with the requested version", () => {
      const url = downloadURL("linux", "x64", "8.24.3");
      expect(url).toBe(
        "https://github.com/zricethezav/gitleaks/releases/download/v8.24.3/gitleaks_8.24.3_linux_x64.tar.gz"
      );
    });

    it("builds darwin arm64 tar.gz URLs", () => {
      const url = downloadURL("darwin", "arm64", "8.24.3");
      expect(url).toBe(
        "https://github.com/zricethezav/gitleaks/releases/download/v8.24.3/gitleaks_8.24.3_darwin_arm64.tar.gz"
      );
    });

    it("maps node's 'win32' platform name to 'windows' in the URL", () => {
      const url = downloadURL("win32", "x64", "8.24.3");
      expect(url).toContain("_windows_x64.");
      expect(url).not.toContain("_win32_");
    });
  });

  describe("Latest", () => {
    it("strips the leading 'v' from the upstream release tag name", async () => {
      const { Latest } = require("../src/gitleaks.js");
      const fakeOctokit = {
        rest: {
          repos: {
            getLatestRelease: async ({ owner, repo }) => {
              expect(owner).toBe("zricethezav");
              expect(repo).toBe("gitleaks");
              return { data: { tag_name: "v8.99.1" } };
            },
          },
        },
      };
      const result = await Latest(fakeOctokit);
      expect(result).toBe("8.99.1");
    });

    it("returns the tag as-is if it has no 'v' prefix", async () => {
      const { Latest } = require("../src/gitleaks.js");
      const fakeOctokit = {
        rest: {
          repos: {
            getLatestRelease: async () => ({ data: { tag_name: "8.50.0" } }),
          },
        },
      };
      expect(await Latest(fakeOctokit)).toBe("8.50.0");
    });
  });
});
