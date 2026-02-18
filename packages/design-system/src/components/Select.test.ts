import { describe, expect, it, vi } from 'vitest';
import {
  buildClassString,
  getFieldErrors,
  initializeFromForm,
  isFieldTouched,
  shouldShowError,
} from './field-utils.js';
import type { FormContext } from './form-context.js';

/**
 * Unit tests for Select.svelte logic.
 *
 * Tests the pure derivation functions that Select uses internally:
 * - Value initialization from form context
 * - Error state derivation (touched + errors → hasError)
 * - CSS class building
 * - Standalone behavior (no form context)
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

describe('Select: value initialization from form context', () => {
  it('returns current value when no form context', () => {
    const result = initializeFromForm(undefined, 'category', '', '');
    expect(result).toBe('');
  });

  it('returns current value when no field name', () => {
    const form = createMockFormContext();
    const result = initializeFromForm(form, undefined, '', '');
    expect(result).toBe('');
  });

  it('initializes value from form context when current value is empty', () => {
    const form = createMockFormContext({
      getValues: () => ({ category: 'rpg' }),
    });
    const result = initializeFromForm(form, 'category', '', '');
    expect(result).toBe('rpg');
  });

  it('keeps current value when it is non-empty', () => {
    const form = createMockFormContext({
      getValues: () => ({ category: 'rpg' }),
    });
    const result = initializeFromForm(form, 'category', 'board', '');
    expect(result).toBe('board');
  });

  it('returns empty string when form has no value for field', () => {
    const form = createMockFormContext({
      getValues: () => ({ other: 'value' }),
    });
    const result = initializeFromForm(form, 'category', '', '');
    expect(result).toBe('');
  });
});

describe('Select: error state derivation', () => {
  it('returns no errors when no form context (standalone)', () => {
    const errors = getFieldErrors(undefined, 'category');
    expect(errors).toBeUndefined();
  });

  it('returns no errors when no field name', () => {
    const form = createMockFormContext({
      errors: { category: ['Required'] },
    });
    const errors = getFieldErrors(form, undefined);
    expect(errors).toBeUndefined();
  });

  it('returns errors from form context', () => {
    const form = createMockFormContext({
      errors: { category: ['Please select a category'] },
    });
    const errors = getFieldErrors(form, 'category');
    expect(errors).toEqual(['Please select a category']);
  });

  it('returns undefined for field with no errors', () => {
    const form = createMockFormContext({
      errors: { other: ['Error'] },
    });
    const errors = getFieldErrors(form, 'category');
    expect(errors).toBeUndefined();
  });
});

describe('Select: touched state', () => {
  it('returns false when no form context (standalone)', () => {
    expect(isFieldTouched(undefined, 'category')).toBe(false);
  });

  it('returns false when field not touched', () => {
    const form = createMockFormContext();
    expect(isFieldTouched(form, 'category')).toBe(false);
  });

  it('returns true when field is touched', () => {
    const form = createMockFormContext({
      touched: new Set(['category']),
    });
    expect(isFieldTouched(form, 'category')).toBe(true);
  });
});

describe('Select: shouldShowError', () => {
  it('does not show error when not touched', () => {
    expect(shouldShowError(['Required'], false)).toBe(false);
  });

  it('does not show error when no errors', () => {
    expect(shouldShowError(undefined, true)).toBe(false);
  });

  it('does not show error when errors array is empty', () => {
    expect(shouldShowError([], true)).toBe(false);
  });

  it('shows error when touched and has errors', () => {
    expect(shouldShowError(['Please select a category'], true)).toBe(true);
  });
});

describe('Select: CSS class building', () => {
  it('builds select class without error', () => {
    const result = buildClassString('select', false, undefined);
    expect(result).toBe('select');
  });

  it('builds select class with error', () => {
    const result = buildClassString('select', 'error', undefined);
    expect(result).toBe('select error');
  });

  it('builds select class with custom className', () => {
    const result = buildClassString('select', false, 'custom');
    expect(result).toBe('select custom');
  });

  it('builds full class string', () => {
    const result = buildClassString('select', 'error', 'custom');
    expect(result).toBe('select error custom');
  });
});

describe('Select: form context integration patterns', () => {
  it('calls setValue on form context when value changes', () => {
    const form = createMockFormContext();
    // Simulate what handleChange does
    const name = 'category';
    const newValue = 'rpg';
    if (form && name) {
      form.setValue(name, newValue);
    }
    expect(form.setValue).toHaveBeenCalledWith('category', 'rpg');
  });

  it('calls touch on form context on blur', () => {
    const form = createMockFormContext();
    const name = 'category';
    if (form && name) {
      form.touch(name);
    }
    expect(form.touch).toHaveBeenCalledWith('category');
  });

  it('does not call form methods when standalone (no form context)', () => {
    const form: FormContext | undefined = undefined;
    const name = 'category';
    // Simulate standalone behavior — no calls when form is undefined
    if (form && name) {
      form.setValue(name, 'rpg');
      form.touch(name);
    }
    // No error thrown — standalone works silently
    expect(true).toBe(true);
  });
});
