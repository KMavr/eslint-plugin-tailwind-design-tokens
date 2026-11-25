# Changelog

## [0.5.0](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/compare/eslint-plugin-tailwind-design-tokens-v0.4.0...eslint-plugin-tailwind-design-tokens-v0.5.0) (2026-11-25)


### ⚠ BREAKING CHANGES

* invalid cssFile/configFile paths or configs that throw now fail the lint run instead of silently loading no tokens. Requires Node >=22.12.

### Features

* detect v4 color utilities and v4.2 palettes in no-default-palette ([#70](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/70)) ([3022f5a](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/3022f5a0984dbda9547008cb82993bc1d2d9c5d4))


### Bug Fixes

* compute autofix ranges from raw source text ([#64](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/64), [#65](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/65)) ([3e650b4](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/3e650b44aa78316c49fd558f5483b203506d1ffe))
* parse [@theme](https://github.com/theme) blocks by brace depth, ignoring comments and nested blocks ([#67](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/67)) ([ee21b8e](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/ee21b8e6947efaeaed6f94f30ee290d107339149))
* reload configFile in a child process and deep-merge extend colors ([#70](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/70)) ([e35c421](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/e35c4211f3ed8cd130a5369a94c567a7f2cef743))
* report hex colors only in certain contexts ([#69](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/69)) ([0b1701d](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/0b1701d129169e9d1f6f86b3ea46658f9feb3862))
* skip invalid spacing negatives and honor theme namespace resets ([#70](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/70)) ([937083c](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/937083c73fd656dbcd39d0372e6df1d8a3eb7aef))
* throw on missing or failing cssFile/configFile ([#68](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/68)) ([7756cea](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/7756ceaa9053c1ad12367b9f3e0e8be624f29925))
* unwrap default export of ESM Tailwind configs ([#66](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/issues/66)) ([26fde0d](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/26fde0d3f3ae79139e997a803eb37e8952dcf26e))

## [0.4.0](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/compare/eslint-plugin-tailwind-design-tokens-v0.3.1...eslint-plugin-tailwind-design-tokens-v0.4.0) (2026-11-24)


### ⚠ BREAKING CHANGES

* requires Node 22 or later.

### Features

* add no-arbitrary-spacing rule ([afe62f3](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/afe62f33cf32fbf8a3ea4af1f67bb8a333fce948))
* load spacing tokens from [@theme](https://github.com/theme) ([3877e1c](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/3877e1c4452f1eb7cc419cfadb83e77d8fd27ad9))


### Miscellaneous Chores

* drop Node 20 support ([9cde31a](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/9cde31a855518cff02a9c88c8cccfd4e0d937218))

## [0.3.1](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/compare/eslint-plugin-tailwind-design-tokens-v0.3.0...eslint-plugin-tailwind-design-tokens-v0.3.1) (2026-11-20)


### Bug Fixes

* detect default palette classes with variant prefixes ([95231a4](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/95231a4013e582f55a68cae8ee2abcf1557219f3))
* load tokens from all [@theme](https://github.com/theme) blocks including inline/static ([e6012ce](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/e6012ce212edfc30fd930768b0347f450d9bf4d5))
* split class lists on any whitespace ([c0151ee](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/c0151eec70c907b74792029280abfdde870c9e59))

## [0.3.0](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/compare/eslint-plugin-tailwind-design-tokens-v0.2.0...eslint-plugin-tailwind-design-tokens-v0.3.0) (2026-06-03)

### Features

- autofix prefix-[#hex] arbitrary values to design-token utilities ([7e4ec85](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/7e4ec85c57f66cb8e81456053e735df9253697ae))
- cover ring-offset and axis/logical border color prefixes ([abd1897](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/abd18977f0b5b5a4e7c91555cb3dc02ed20719d3))
- suggest replacing hardcoded colors with matching design tokens. ([b9c0e66](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/b9c0e66ca5433d50281ceb1848f11052df92bafe))
- support /regex/ patterns in allow option for both rules ([7bc9d5b](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/7bc9d5bdd0b5a2ee7e0002f2d4817c88159e1b37))

### Bug Fixes

- require ESLint &gt;=9 and add an ESLint version CI matrix ([378e370](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/378e370cc5294753760e71c32c5da160034f7a97))

## [0.2.0](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/compare/eslint-plugin-tailwind-design-tokens-v0.1.0...eslint-plugin-tailwind-design-tokens-v0.2.0) (2026-06-03)

### Features

- add support for modern color functions ([dd14218](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/dd14218d744913fbbffff14527060911e11f3407))
- add support for modern color functions ([857d698](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/commit/857d6984cb7d068ad573381689b2b7fb1dbf54b5))
