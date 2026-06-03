// This file deliberately contains violations so `npx eslint .` has something to report.
// Run it and compare against the "Expected output" section in ../README.md.

// ✗ Flagged by both rules.
export function BadButton() {
  return (
    <button
      // no-default-palette:  text-red-500 is a stock palette class
      // no-hardcoded-colors: #0a0a0a is the v4 token `ink` -> bg-[#0a0a0a] is auto-fixable to bg-ink
      className="bg-[#0a0a0a] text-red-500"
      style={{
        backgroundColor: '#f5f5f5', // -> v3 token `surface`
        borderColor: '#2563eb', // -> v4 token `primary`
      }}>
      Save
    </button>
  );
}

// ✓ Clean — design-system tokens only, no hardcoded colors, no stock palette.
export function GoodButton() {
  return (
    <button className="bg-ink text-primary" style={{ borderColor: 'var(--color-primary)' }}>
      Save
    </button>
  );
}
