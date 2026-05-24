// Test setup — runs before any test file.
// Ensures env vars commonly read at module load time don't blow up imports.
process.env.GITHUB_TOKEN ??= "test-token";
process.env.GITHUB_API_URL ??= "https://api.github.com";
process.env.HOME ??= "/tmp";
