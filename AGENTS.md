# Agent Guidelines

## Semantic Versioning and Conventional Commits

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically publish releases based on conventional commit messages. Agents must follow semver correctly:

- **Breaking changes require a major version bump.** Any change that could break existing users of this GitHub Action (e.g., changing the Node.js runtime version in `action.yml`, removing/renaming inputs, changing default behavior) must use a `BREAKING CHANGE:` footer or `!` suffix in the commit message (e.g., `fix!: update runtime to node20`). This triggers a major version bump (v1.x.x → v2.0.0).
- Changes to inputs, outputs, or the `action.yml` `runs` configuration are the public API of this action. Treat them with the same care as a library's public API.
- Internal changes (dependencies, toolchain, CI workflows, tests) that don't affect the action's behavior from a user's perspective are not breaking changes.

## Project Structure

This is a GitHub Action written in TypeScript. The bundled output in `dist/` is what runs when users reference the action. The CI pipeline automatically rebuilds and commits `dist/` on PRs if it changes.
