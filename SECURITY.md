# Security Policy

## Supported versions

`eslint-plugin-tailwind-design-tokens` is pre-1.0. Only the latest published release receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub:
[Report a vulnerability](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/security/advisories/new).

Include the affected version, what you did, and what you expected versus what happened. You can
expect an acknowledgement within a few days. Confirmed issues are fixed in a new release and
credited in the advisory unless you prefer otherwise.

## Scope

The plugin reads the CSS file you configure with `cssFile` and does not use the network. When you set
`configFile`, it loads that Tailwind config in a separate Node process, so it executes that file and
anything it imports. Only point it at configs you trust, as you would when running Tailwind itself.
Reports about unsafe parsing of the CSS or config, path handling, or the release pipeline are in scope.

Every release is published from CI with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations.
