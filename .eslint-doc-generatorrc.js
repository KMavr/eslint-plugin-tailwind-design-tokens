/** @type {import('eslint-doc-generator').GenerateOptions} */
module.exports = {
  configEmoji: [['recommended', '✅']],
  ignoreConfig: ['flat/recommended'],
};

// NOTE: doc:check uses git-diff, not --check. eslint-doc-generator and Prettier disagree on emoji-column layout
