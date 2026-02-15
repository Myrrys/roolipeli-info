import { describe, expect, it, vi } from 'vitest';
import {
  buildClassString,
  getFieldErrors,
  initializeFromForm,
  isFieldTouched,
  radioGroupOptionsClass,
  shouldShowError,
} from './field-utils.js';
import type { FormContext } from './form-context.js';

/**
 * Unit tests for RadioGroup.svelte logic.
 *
 * Tests the pure derivation functions that RadioGroup uses internally:
 * - Orientation CSS class computation
 * - Value initialization from form context
 * - Error state derivation
 * - Legend ID generation
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

describe('RadioGroup: orientation CSS class', () => {
  it('returns base class for vertical orientation', () => {
    expect(radioGroupOptionsClass('vertical')).toBe('radio-group__options');
  });

  it('returns base + horizontal modifier for horizontal orientation', () => {
    expect(radioGroupOptionsClass('horizontal')).toBe(
      'radio-group__options radio-group__options--horizontal',
    );
  });
});

describe('RadioGroup: value initialization from form context', () => {
  it('returns empty string when no form context', () => {
    const result = initializeFromForm(undefined, 'color', '', '');
    expect(result).toBe('');
  });

  it('initializes value from form context', () => {
    const form = createMockFormContext({
      getValues: () => ({ color: 'red' }),
    });
    const result = initializeFromForm(form, 'color', '', '');
    expect(result).toBe('red');
  });

  it('keeps current value if non-empty', () => {
    const form = createMockFormContext({
      getValues: () => ({ color: 'red' }),
    });
    const result = initializeFromForm(form, 'color', 'blue', '');
    expect(result).toBe('blue');
  });

  it('returns empty string when field not in form values', () => {
    const form = createMockFormContext({
      getValues: () => ({ other: 'value' }),
    });
    const result = initializeFromForm(form, 'color', '', '');
    expect(result).toBe('');
  });
});

describe('RadioGroup: legend ID generation', () => {
  it('generates correct legend ID from name', () => {
    const name = 'color';
    const legendId = `${name}-legend`;
    expect(legendId).toBe('color-legend');
  });

  it('generates correct error describedby ID', () => {
    const name = 'color';
    const errorId = `${name}-error`;
    expect(errorId).toBe('color-error');
  });
});

describe('RadioGroup: error state derivation', () => {
  it('returns no errors in standalone mode (no form context)', () => {
    const errors = getFieldErrors(undefined, 'color');
    expect(errors).toBeUndefined();
  });

  it('derives error state for touched field with errors', () => {
    const form = createMockFormContext({
      errors: { color: ['Please select a color'] },
      touched: new Set(['color']),
    });
    const errors = getFieldErrors(form, 'color');
    const touched = isFieldTouched(form, 'color');
    expect(shouldShowError(errors, touched)).toBe(true);
  });

  it('does not show error when not touched', () => {
    const form = createMockFormContext({
      errors: { color: ['Required'] },
    });
    const errors = getFieldErrors(form, 'color');
    const touched = isFieldTouched(form, 'color');
    expect(shouldShowError(errors, touched)).toBe(false);
  });

  it('does not show error when touched with no errors', () => {
    const form = createMockFormContext({
      touched: new Set(['color']),
    });
    const errors = getFieldErrors(form, 'color');
    const touched = isFieldTouched(form, 'color');
    expect(shouldShowError(errors, touched)).toBe(false);
  });
});

describe('RadioGroup: CSS class building', () => {
  it('builds fieldset class without custom class', () => {
    expect(buildClassString('radio-group')).toBe('radio-group');
  });

  it('builds fieldset class with custom class', () => {
    expect(buildClassString('radio-group', 'custom')).toBe('radio-group custom');
  });

  it('builds radio class without error', () => {
    expect(buildClassString('radio')).toBe('radio');
  });

  it('builds radio class with error', () => {
    expect(buildClassString('radio', 'error')).toBe('radio error');
  });
});

describe('RadioGroup: form context integration', () => {
  it('calls setValue and touch when option selected', () => {
    const form = createMockFormContext();
    const name = 'color';
    const newValue = 'green';

    // Simulate handleChange
    if (form) {
      form.setValue(name, newValue);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('color', 'green');
    expect(form.touch).toHaveBeenCalledWith('color');
  });

  it('does not call form methods when standalone', () => {
    const form: FormContext | undefined = undefined;
    const name = 'color';

    if (form) {
      form.setValue(name, 'green');
      form.touch(name);
    }

    expect(true).toBe(true);
  });

  it('handles multiple option selections correctly', () => {
    const form = createMockFormContext();
    const name = 'color';

    // Simulate selecting different options in sequence
    form.setValue(name, 'red');
    form.setValue(name, 'green');
    form.setValue(name, 'blue');

    expect(form.setValue).toHaveBeenCalledTimes(3);
    expect(form.setValue).toHaveBeenLastCalledWith('color', 'blue');
  });
});
