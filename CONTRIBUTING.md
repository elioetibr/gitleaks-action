# Contributing

Thanks for your interest in contributing to Gitleaks-Action!

## Quickstart

- Make changes to the files in the `src` directory.
- This project uses [Bun](https://bun.sh) as its package manager and test runner, and targets **Node.js 24** at runtime (see `.nvmrc` and `action.yml`).
- "Build" the dist using [ncc](https://github.com/vercel/ncc):
  - Use [nvm](https://github.com/nvm-sh/nvm) to select the right version of node:
  ```
  nvm use
  ```

  - Install [Bun](https://bun.sh/docs/installation) (one time):
  ```
  curl -fsSL https://bun.sh/install | bash
  ```

  - Install dependencies:

  ```bash
  bun install
  ```

  - Run the build command:

  ```bash
  bun run build
  ```

## Running tests

This project uses Bun's built-in test runner. After `bun install`:

```bash
bun test                # run the suite once
bun test --watch        # re-run on file changes
bun test --coverage     # text coverage report
```

The tests live under `tests/` and exercise the pure helpers
(`src/config.js`, `src/gitleaks.js#downloadURL`, `src/gitleaks.js#Latest`,
`src/keygen.js#ValidateKey`, `src/summary.js#Write`). For functions that
reach out to the network or filesystem, the tests patch the underlying
`https.request` / `fs.readFileSync` rather than the wrapper modules.

- You can use [act](https://github.com/nektos/act) to test Gitleaks-Action on your local machine.
  - More info to come on this later
  - We hope to create a script that runs a test suite locally using `act` at some point.

## Legal

The source code for Gitleaks-Action is made available under our [commercial license](https://github.com/gitleaks/gitleaks-action/blob/v2/COMMERCIAL-LICENSE.txt),
and the copyright is owned by Gitleaks LLC.

By submitting a Pull Request, you disavow any rights or claims to any changes
submitted to this project and assign the copyright of
those changes to Gitleaks LLC.

If you cannot or do not want to reassign those rights (your employment
contract for your employer may not allow this), you should not submit a PR.
However, you can open an issue and someone else can do the work.

This is a legal way of saying "If you submit a PR to us, that code becomes ours".
99.9% of the time that's what you intend anyways; we hope it doesn't scare you
away from contributing.

_Credit to the [Sidekiq contribution guidelines](https://github.com/mperham/sidekiq/blob/main/.github/contributing.md) for the concepts and most of the language above._
