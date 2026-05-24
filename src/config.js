// Pure helpers extracted from index.js so they can be tested in isolation.
// Keep this module side-effect free: no I/O, no process.exit, no module-load
// time reads from process.env.

const SUPPORTED_EVENTS = [
  "push",
  "pull_request",
  "workflow_dispatch",
  "schedule",
];

function isSupportedEvent(eventType) {
  return SUPPORTED_EVENTS.includes(eventType);
}

// GitHub Action env flags follow a "default-on unless explicitly disabled"
// pattern. parseBoolFlag normalizes the three falsy spellings users can write
// in YAML (omit, "false", "0") into a real boolean.
function parseBoolFlag(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (value === "false" || value === "0" || value === false) return false;
  return true;
}

// Scheduled runs (`on: schedule`) don't include the repository block in the
// event payload that other event types do. We synthesize it from the env vars
// GitHub Actions provides, and return the bare repo name separately so the
// caller can decide whether to overwrite GITHUB_REPOSITORY.
function resolveScheduleEvent(eventJSON, env) {
  const owner = env.GITHUB_REPOSITORY_OWNER;
  const fullName = env.GITHUB_REPOSITORY;
  const repoName = fullName.replace(`${owner}/`, "");
  return {
    eventJSON: {
      ...eventJSON,
      repository: {
        owner: { login: owner },
        full_name: fullName,
      },
    },
    repoName,
    githubUsername: owner,
  };
}

function resolveGithubUsername(eventType, eventJSON, env) {
  if (eventType === "schedule") return env.GITHUB_REPOSITORY_OWNER;
  return eventJSON.repository.owner.login;
}

module.exports = {
  SUPPORTED_EVENTS,
  isSupportedEvent,
  parseBoolFlag,
  resolveScheduleEvent,
  resolveGithubUsername,
};
