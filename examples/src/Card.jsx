// This file deliberately contains spacing violations so `npx eslint .` has something to report.
// Run it and compare against the "Expected output" section in ../README.md.

// ✗ Flagged by no-arbitrary-spacing.
export function BadCard() {
  return (
    // p-[16px]    -> p-4 (auto-fix)
    // mt-[2rem]   -> mt-8 (auto-fix)
    // gap-[24px]  -> gap-6 or gap-card (--spacing-card: 24px), offered as suggestions
    // w-[37.5px]  -> off the scale, reported without a fix
    <div className="flex p-[16px] mt-[2rem] gap-[24px] w-[37.5px]">Card</div>
  );
}

// ✓ Clean — on-scale classes, a named spacing token, and an exempt calc() value.
export function GoodCard() {
  return <div className="flex p-4 mt-8 gap-card w-[calc(100%-1rem)]">Card</div>;
}
