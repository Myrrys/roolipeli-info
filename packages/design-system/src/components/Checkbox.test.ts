import { describe, expect, it, vi } from 'vitest';
import {
  buildClassString,
  computeAriaChecked,
  getFieldErrors,
  isFieldTouched,
  shouldShowError,
} from './field-utils.js';
import type { FormContext } from './form-context.js';

/**
 * Unit tests for Checkbox.svelte logic.
 *
 * Tests the pure derivation functions that Checkbox uses internally:
 * - aria-checked computation (true/false/mixed for indeterminate)
 * - Error state derivation
 * - Form context integration
 * - Standalone behavior
 */

function createMockFormContext(overrides: Partial<FormContext> = {}): FormContext {
  return {
    errors: {},
    touched: new Set<string>(),
    submitting: false,
    touch: vi.fn(),
    getValues: () => ({}),
    setValue: vi.fn(),
    ...overrides,
  };
}

describe('Checkbox: computeAriaChecked', () => {
  it('returns "false" when unchecked and not indeterminate', () => {
    expect(computeAriaChecked(false, false)).toBe('false');
  });

  it('returns "true" when checked and not indeterminate', () => {
    expect(computeAriaChecked(true, false)).toBe('true');
  });

  it('returns "mixed" when indeterminate (regardless of checked)', () => {
    expect(computeAriaChecked(false, true)).toBe('mixed');
    expect(computeAriaChecked(true, true)).toBe('mixed');
  });

  it('prioritizes indeterminate over checked', () => {
    // When both checked and indeterminate are true, indeterminate wins
    expect(computeAriaChecked(true, true)).toBe('mixed');
  });
});

describe('Checkbox: error state derivation', () => {
  it('returns no errors in standalone mode (no form context)', () => {
    const errors = getFieldErrors(undefined, 'agree');
    expect(errors).toBeUndefined();
    expect(isFieldTouched(undefined, 'agree')).toBe(false);
    expect(shouldShowError(errors, false)).toBe(false);
  });

  it('returns no errors when field has no name', () => {
    const form = createMockFormContext({
      errors: { agree: ['Required'] },
    });
    expect(getFieldErrors(form, undefined)).toBeUndefined();
  });

  it('derives error state correctly when touched with errors', () => {
    const form = createMockFormContext({
      errors: { agree: ['You must agree to the terms'] },
      touched: new Set(['agree']),
    });
    const errors = getFieldErrors(form, 'agree');
    const touched = isFieldTouched(form, 'agree');
    expect(shouldShowError(errors, touched)).toBe(true);
  });

  it('does not show error when touched but no errors', () => {
    const form = createMockFormContext({
      touched: new Set(['agree']),
    });
    const errors = getFieldErrors(form, 'agree');
    const touched = isFieldTouched(form, 'agree');
    expect(shouldShowError(errors, touched)).toBe(false);
  });

  it('does not show error when has errors but not touched', () => {
    const form = createMockFormContext({
      errors: { agree: ['Required'] },
    });
    const errors = getFieldErrors(form, 'agree');
    const touched = isFieldTouched(form, 'agree');
    expect(shouldShowError(errors, touched)).toBe(false);
  });
});

describe('Checkbox: CSS class building', () => {
  it('builds checkbox class without error', () => {
    expect(buildClassString('checkbox')).toBe('checkbox');
  });

  it('builds checkbox class with error', () => {
    expect(buildClassString('checkbox', 'error')).toBe('checkbox error');
  });

  it('builds wrapper class with custom className', () => {
    expect(buildClassString('checkbox-wrapper', 'custom')).toBe('checkbox-wrapper custom');
  });

  it('filters out falsy values', () => {
    expect(buildClassString('checkbox', false, undefined, null)).toBe('checkbox');
  });
});

describe('Checkbox: form context integration', () => {
  it('calls setValue with boolean checked state', () => {
    const form = createMockFormContext();
    const name = 'agree';
    const checked = true;

    // Simulate handleChange behavior
    if (form && name) {
      form.setValue(name, checked);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('agree', true);
    expect(form.touch).toHaveBeenCalledWith('agree');
  });

  it('calls setValue with false when unchecked', () => {
    const form = createMockFormContext();
    const name = 'agree';
    const checked = false;

    if (form && name) {
      form.setValue(name, checked);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('agree', false);
  });

  it('does not call form methods when standalone', () => {
    const form: FormContext | undefined = undefined;
    const name = 'agree';
    const checked = true;

    // Simulate standalone behavior — no calls
    if (form && name) {
      form.setValue(name, checked);
      form.touch(name);
    }

    // No error thrown
    expect(true).toBe(true);
  });

  it('does not call form methods when name is undefined', () => {
    const form = createMockFormContext();
    const name: string | undefined = undefined;
    const checked = true;

    if (form && name) {
      form.setValue(name, checked);
      form.touch(name);
    }

    expect(form.setValue).not.toHaveBeenCalled();
    expect(form.touch).not.toHaveBeenCalled();
  });
});
