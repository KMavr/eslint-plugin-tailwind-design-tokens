import { describe, it, expect } from 'vitest';
import type { Linter } from 'eslint';
import plugin from '../src/index';

/**
 * Spec for src/index.ts — the plugin entry point.
 *
 * Exposes both rules under the plugin object, sets meta (name + version), and
 * provides two recommended configs:
 *   - `recommended`       legacy (.eslintrc) shape: { plugins: [...], rules }
 *   - `flat/recommended`  flat-config array referencing the plugin object
 *
 * Rules are referenced by their namespaced ids `tailwind-design-tokens/<rule>`.
 */

const NAMESPACE = 'tailwind-design-tokens';
const expectedRules = {
  [`${NAMESPACE}/no-hardcoded-colors`]: 'error',
  [`${NAMESPACE}/no-default-palette`]: 'error',
};

describe('plugin entry', () => {
  it('should expose both rules as rule modules', () => {
    expect(Object.keys(plugin.rules ?? {})).toEqual(
      expect.arrayContaining(['no-hardcoded-colors', 'no-default-palette']),
    );
    expect(plugin.rules?.['no-hardcoded-colors'].meta?.messages).toBeDefined();
    expect(plugin.rules?.['no-default-palette'].meta?.messages).toBeDefined();
  });

  it('should set meta name and a string version', () => {
    expect(plugin.meta?.name).toBe('eslint-plugin-tailwind-design-tokens');
    expect(typeof plugin.meta?.version).toBe('string');
  });

  it('should expose a legacy recommended config referencing the rules', () => {
    const recommended = plugin.configs?.recommended as Linter.LegacyConfig;
    expect(recommended.plugins).toContain(NAMESPACE);
    expect(recommended.rules).toEqual(expectedRules);
  });

  it('should expose a flat recommended config referencing the plugin and rules', () => {
    const flat = plugin.configs?.['flat/recommended'] as Linter.Config[];
    expect(Array.isArray(flat)).toBe(true);
    expect(flat[0].plugins?.[NAMESPACE]).toBe(plugin);
    expect(flat[0].rules).toEqual(expectedRules);
  });
});
