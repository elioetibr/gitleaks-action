// Tests for src/keygen.js — license validation against keygen.sh.
// Strategy: monkey-patch https.request before requiring keygen, so doRequest()
// resolves with whatever payload the test stages.

const { describe, it, expect, beforeEach, afterEach } = require("bun:test");
const https = require("https");

let pendingResponses = [];
let capturedRequests = [];
const realRequest = https.request;

function fakeRequest(options, callback) {
  capturedRequests.push({ options });
  const res = {
    _listeners: {},
    setEncoding() {},
    on(event, handler) {
      this._listeners[event] = handler;
    },
  };
  setImmediate(() => {
    callback(res);
    const next = pendingResponses.shift() ?? {};
    res._listeners.data?.(JSON.stringify(next));
    res._listeners.end?.();
  });
  return {
    on() {},
    write(body) {
      capturedRequests[capturedRequests.length - 1].body = body;
    },
    end() {},
  };
}

// Patch BEFORE requiring keygen so keygen.js captures the patched function.
https.request = fakeRequest;
process.env.GITLEAKS_LICENSE = "test-license-key";
const keygen = require("../src/keygen.js");

describe("keygen.ValidateKey", () => {
  beforeEach(() => {
    pendingResponses = [];
    capturedRequests = [];
    https.request = fakeRequest;
    process.env.GITLEAKS_LICENSE = "test-license-key";
  });

  afterEach(() => {
    https.request = realRequest;
  });

  const baseEventJSON = {
    repository: { full_name: "octocat/hello-world" },
  };

  it("returns silently when the license is VALID for the repo", async () => {
    pendingResponses.push({ meta: { constant: "VALID" } });
    const result = await keygen.ValidateKey(baseEventJSON);
    expect(result).toBeUndefined();
    expect(capturedRequests).toHaveLength(1);
    const body = JSON.parse(capturedRequests[0].body);
    expect(body.meta.key).toBe("test-license-key");
    expect(body.meta.scope.fingerprint).toBe("octocat/hello-world");
  });

  it("sends correct keygen.sh API path and content-type header", async () => {
    pendingResponses.push({ meta: { constant: "VALID" } });
    await keygen.ValidateKey(baseEventJSON);
    const req = capturedRequests[0];
    expect(req.options.hostname).toBe("api.keygen.sh");
    expect(req.options.method).toBe("POST");
    expect(req.options.path).toMatch(/^\/v1\/accounts\/.+\/licenses\/actions\/validate-key$/);
    expect(req.options.headers["Content-Type"]).toBe("application/vnd.api+json");
  });

  it("activates the repo when license is unscoped (NO_MACHINES)", async () => {
    pendingResponses.push({
      meta: { constant: "NO_MACHINES" },
      data: { id: "lic-123" },
    });
    pendingResponses.push({
      status: 201,
      data: { attributes: { name: "octocat/hello-world" } },
    });
    const result = await keygen.ValidateKey(baseEventJSON);
    expect(result).toBe(201);
    expect(capturedRequests).toHaveLength(2);
    expect(capturedRequests[1].options.headers.Authorization).toBe(
      "License test-license-key"
    );
  });

  it("activates the repo when license has FINGERPRINT_SCOPE_MISMATCH", async () => {
    pendingResponses.push({
      meta: { constant: "FINGERPRINT_SCOPE_MISMATCH" },
      data: { id: "lic-456" },
    });
    pendingResponses.push({
      status: 201,
      data: { attributes: { name: "octocat/hello-world" } },
    });
    const result = await keygen.ValidateKey(baseEventJSON);
    expect(result).toBe(201);
  });

  it("exits the process when license has TOO_MANY_MACHINES", async () => {
    pendingResponses.push({
      meta: { constant: "TOO_MANY_MACHINES" },
      data: { attributes: { maxMachines: 1 } },
    });
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => {
      exitCode = code;
      throw new Error("__EXIT__");
    };
    try {
      await keygen.ValidateKey(baseEventJSON).catch(() => {});
    } finally {
      process.exit = originalExit;
    }
    expect(exitCode).toBe(1);
  });

  it("exits the process on an unknown validation constant", async () => {
    pendingResponses.push({ meta: { constant: "TOTALLY_BOGUS_STATUS" } });
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => {
      exitCode = code;
      throw new Error("__EXIT__");
    };
    try {
      await keygen.ValidateKey(baseEventJSON).catch(() => {});
    } finally {
      process.exit = originalExit;
    }
    expect(exitCode).toBe(1);
  });
});
