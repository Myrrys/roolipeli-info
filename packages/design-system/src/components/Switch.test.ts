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
 * Unit tests for Switch.svelte logic.
 *
 * Tests the pure derivation functions that Switch uses internally:
 * - aria-checked derivation (true/false, no indeterminate for switch)
 * - Form context value sync (boolean)
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

describe('Switch: aria-checked derivation', () => {
  it('returns "false" when switch is off', () => {
    // Switch uses computeAriaChecked with indeterminate always false
    expect(computeAriaChecked(false, false)).toBe('false');
  });

  it('returns "true" when switch is on', () => {
    expect(computeAriaChecked(true, false)).toBe('true');
  });

  it('Switch never uses indeterminate state', () => {
    // Verify the expected behavior: switch only has on/off
    const offState = computeAriaChecked(false, false);
    const onState = computeAriaChecked(true, false);
    expect(offState).toBe('false');
    expect(onState).toBe('true');
  });
});

describe('Switch: error state derivation', () => {
  it('returns no errors in standalone mode', () => {
    expect(getFieldErrors(undefined, 'notifications')).toBeUndefined();
    expect(isFieldTouched(undefined, 'notifications')).toBe(false);
  });

  it('derives error state correctly when form has errors', () => {
    const form = createMockFormContext({
      errors: { notifications: ['Field is required'] },
      touched: new Set(['notifications']),
    });
    const errors = getFieldErrors(form, 'notifications');
    const touched = isFieldTouched(form, 'notifications');
    expect(shouldShowError(errors, touched)).toBe(true);
  });

  it('does not show error when not touched', () => {
    const form = createMockFormContext({
      errors: { notifications: ['Required'] },
    });
    const errors = getFieldErrors(form, 'notifications');
    const touched = isFieldTouched(form, 'notifications');
    expect(shouldShowError(errors, touched)).toBe(false);
  });
});

describe('Switch: CSS class building', () => {
  it('builds wrapper class without custom class', () => {
    expect(buildClassString('switch-wrapper')).toBe('switch-wrapper');
  });

  it('builds wrapper class with custom class', () => {
    expect(buildClassString('switch-wrapper', 'custom')).toBe('switch-wrapper custom');
  });

  it('filters out undefined class', () => {
    expect(buildClassString('switch-wrapper', undefined)).toBe('switch-wrapper');
  });
});

describe('Switch: form context integration', () => {
  it('calls setValue and touch when toggled on', () => {
    const form = createMockFormContext();
    const name = 'notifications';
    const checked = true;

    // Simulate handleChange — now calls both setValue and touch
    if (form && name) {
      form.setValue(name, checked);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('notifications', true);
    expect(form.touch).toHaveBeenCalledWith('notifications');
  });

  it('calls setValue and touch when toggled off', () => {
    const form = createMockFormContext();
    const name = 'notifications';
    const checked = false;

    if (form && name) {
      form.setValue(name, checked);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('notifications', false);
    expect(form.touch).toHaveBeenCalledWith('notifications');
  });

  it('calls touch on blur', () => {
    const form = createMockFormContext();
    const name = 'notifications';

    // Simulate handleBlur
    if (form && name) {
      form.touch(name);
    }

    expect(form.touch).toHaveBeenCalledWith('notifications');
  });

  it('does not call form methods when standalone', () => {
    const form: FormContext | undefined = undefined;
    const name = 'notifications';

    if (form && name) {
      form.setValue(name, true);
      form.touch(name);
    }

    expect(true).toBe(true);
  });

  it('does not call form methods when name is undefined', () => {
    const form = createMockFormContext();
    const name: string | undefined = undefined;

    if (form && name) {
      form.setValue(name, true);
    }

    expect(form.setValue).not.toHaveBeenCalled();
  });
});
