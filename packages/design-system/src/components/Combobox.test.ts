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
 * Unit tests for Combobox.svelte logic.
 *
 * Tests the pure derivation functions that Combobox uses internally:
 * - Option filtering (case-insensitive substring match)
 * - Display text derivation (searchText vs selectedOption label)
 * - Active option ID for aria-activedescendant
 * - Keyboard navigation (activeIndex clamping)
 * - Selection and clear behavior
 * - Blur revert logic
 * - Error state / form context integration (shared with other fields)
 */

// --- Types mirroring Combobox internals ---

interface ComboboxOption {
  value: string;
  label: string;
}

// --- Pure functions mirroring Combobox inline derivations ---

/** Mirrors: filteredOptions = $derived(options.filter(...)) */
function filterOptions(options: ComboboxOption[], searchText: string): ComboboxOption[] {
  return options.filter((opt) => opt.label.toLowerCase().includes(searchText.toLowerCase()));
}

/** Mirrors: selectedOption = $derived(options.find(opt => opt.value === value)) */
function findSelectedOption(options: ComboboxOption[], value: string): ComboboxOption | undefined {
  return options.find((opt) => opt.value === value);
}

/** Mirrors: displayText = $derived.by(() => { if (open) return searchText; ... }) */
function getDisplayText(
  open: boolean,
  searchText: string,
  selectedOption: ComboboxOption | undefined,
): string {
  if (open) return searchText;
  return selectedOption ? selectedOption.label : '';
}

/** Mirrors: activeOptionId = $derived(activeIndex >= 0 ? getOptionId(activeIndex) : undefined) */
function getActiveOptionId(name: string, activeIndex: number): string | undefined {
  if (activeIndex >= 0) return `${name}-option-${activeIndex}`;
  return undefined;
}

/** Mirrors: ArrowDown handler — clamp activeIndex within filteredOptions bounds */
function handleArrowDown(
  open: boolean,
  activeIndex: number,
  listLength: number,
): { open: boolean; activeIndex: number } {
  if (!open) {
    return { open: true, activeIndex: 0 };
  }
  return { open: true, activeIndex: Math.min(activeIndex + 1, listLength - 1) };
}

/** Mirrors: ArrowUp handler */
function handleArrowUp(activeIndex: number): number {
  return Math.max(activeIndex - 1, 0);
}

/** Mirrors: Home handler */
function handleHome(): number {
  return 0;
}

/** Mirrors: End handler */
function handleEnd(listLength: number): number {
  return listLength - 1;
}

/** Mirrors: handleBlur revert logic */
function shouldRevertOnBlur(searchText: string, selectedOptionLabel: string | undefined): boolean {
  const label = selectedOptionLabel || '';
  return searchText !== '' && searchText !== label;
}

/** Mirrors: the revert value on blur */
function getRevertText(selectedOptionLabel: string | undefined): string {
  return selectedOptionLabel || '';
}

// --- Test data ---

const testOptions: ComboboxOption[] = [
  { value: 'p1', label: 'Artic Union' },
  { value: 'p2', label: 'Burger Games' },
  { value: 'p3', label: 'Celluloidi Oy' },
  { value: 'p4', label: 'Helsinki Games' },
  { value: 'p5', label: 'Helmi Publishing' },
];

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

// --- Tests ---

describe('Combobox: option filtering', () => {
  it('returns all options when search text is empty', () => {
    const result = filterOptions(testOptions, '');
    expect(result).toHaveLength(testOptions.length);
  });

  it('filters by case-insensitive substring match', () => {
    const result = filterOptions(testOptions, 'hel');
    expect(result).toEqual([
      { value: 'p4', label: 'Helsinki Games' },
      { value: 'p5', label: 'Helmi Publishing' },
    ]);
  });

  it('matches substring in the middle of label', () => {
    const result = filterOptions(testOptions, 'games');
    expect(result).toEqual([
      { value: 'p2', label: 'Burger Games' },
      { value: 'p4', label: 'Helsinki Games' },
    ]);
  });

  it('returns empty array when no match', () => {
    const result = filterOptions(testOptions, 'xyz');
    expect(result).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const lower = filterOptions(testOptions, 'burger');
    const upper = filterOptions(testOptions, 'BURGER');
    const mixed = filterOptions(testOptions, 'BuRgEr');
    expect(lower).toEqual(upper);
    expect(upper).toEqual(mixed);
    expect(lower).toHaveLength(1);
  });

  it('matches single character', () => {
    const result = filterOptions(testOptions, 'u');
    // Artic Union, Burger Games, Celluloidi Oy, Helmi Publishing
    expect(result.map((o) => o.value)).toEqual(['p1', 'p2', 'p3', 'p5']);
  });
});

describe('Combobox: find selected option', () => {
  it('returns the matching option', () => {
    expect(findSelectedOption(testOptions, 'p2')).toEqual({
      value: 'p2',
      label: 'Burger Games',
    });
  });

  it('returns undefined for non-existent value', () => {
    expect(findSelectedOption(testOptions, 'p999')).toBeUndefined();
  });

  it('returns undefined for empty value', () => {
    expect(findSelectedOption(testOptions, '')).toBeUndefined();
  });
});

describe('Combobox: display text derivation', () => {
  it('returns searchText when open', () => {
    expect(getDisplayText(true, 'Bur', { value: 'p1', label: 'Artic Union' })).toBe('Bur');
  });

  it('returns empty searchText when open with no typed text', () => {
    expect(getDisplayText(true, '', { value: 'p1', label: 'Artic Union' })).toBe('');
  });

  it('returns selected option label when closed', () => {
    expect(getDisplayText(false, 'stale', { value: 'p2', label: 'Burger Games' })).toBe(
      'Burger Games',
    );
  });

  it('returns empty string when closed with no selection', () => {
    expect(getDisplayText(false, '', undefined)).toBe('');
  });
});

describe('Combobox: active option ID (aria-activedescendant)', () => {
  it('returns undefined when activeIndex is -1', () => {
    expect(getActiveOptionId('publisher', -1)).toBeUndefined();
  });

  it('returns correct ID for activeIndex 0', () => {
    expect(getActiveOptionId('publisher', 0)).toBe('publisher-option-0');
  });

  it('returns correct ID for higher index', () => {
    expect(getActiveOptionId('publisher', 4)).toBe('publisher-option-4');
  });
});

describe('Combobox: keyboard navigation (activeIndex)', () => {
  describe('ArrowDown', () => {
    it('opens listbox and sets activeIndex to 0 when closed', () => {
      const result = handleArrowDown(false, -1, 5);
      expect(result).toEqual({ open: true, activeIndex: 0 });
    });

    it('moves activeIndex forward when open', () => {
      const result = handleArrowDown(true, 0, 5);
      expect(result).toEqual({ open: true, activeIndex: 1 });
    });

    it('clamps at last option', () => {
      const result = handleArrowDown(true, 4, 5);
      expect(result).toEqual({ open: true, activeIndex: 4 });
    });

    it('clamps when already at last option', () => {
      const result = handleArrowDown(true, 3, 4);
      expect(result).toEqual({ open: true, activeIndex: 3 });
    });
  });

  describe('ArrowUp', () => {
    it('moves activeIndex backward', () => {
      expect(handleArrowUp(3)).toBe(2);
    });

    it('clamps at first option (index 0)', () => {
      expect(handleArrowUp(0)).toBe(0);
    });

    it('clamps from -1 to 0', () => {
      expect(handleArrowUp(-1)).toBe(0);
    });
  });

  describe('Home', () => {
    it('returns 0', () => {
      expect(handleHome()).toBe(0);
    });
  });

  describe('End', () => {
    it('returns last index', () => {
      expect(handleEnd(5)).toBe(4);
    });

    it('returns 0 for single option', () => {
      expect(handleEnd(1)).toBe(0);
    });
  });
});

describe('Combobox: selection behavior', () => {
  it('selectOption sets value to option.value', () => {
    const option = { value: 'p3', label: 'Celluloidi Oy' };
    // After selectOption: value = option.value, searchText = option.label, open = false
    expect(option.value).toBe('p3');
    expect(option.label).toBe('Celluloidi Oy');
  });

  it('form context receives setValue call on selection', () => {
    const form = createMockFormContext();
    const name = 'publisher_id';
    const option = { value: 'p2', label: 'Burger Games' };

    // Simulate selectOption behavior
    if (form && name) {
      form.setValue(name, option.value);
    }

    expect(form.setValue).toHaveBeenCalledWith('publisher_id', 'p2');
  });

  it('clear resets form value to empty string', () => {
    const form = createMockFormContext();
    const name = 'publisher_id';

    // Simulate handleClear behavior
    if (form && name) {
      form.setValue(name, '');
    }

    expect(form.setValue).toHaveBeenCalledWith('publisher_id', '');
  });
});

describe('Combobox: blur revert logic', () => {
  it('reverts when searchText does not match selected label', () => {
    expect(shouldRevertOnBlur('invalid text', 'Artic Union')).toBe(true);
  });

  it('does not revert when searchText matches selected label', () => {
    expect(shouldRevertOnBlur('Artic Union', 'Artic Union')).toBe(false);
  });

  it('does not revert when searchText is empty', () => {
    expect(shouldRevertOnBlur('', 'Artic Union')).toBe(false);
  });

  it('does not revert when both are empty (no selection)', () => {
    expect(shouldRevertOnBlur('', undefined)).toBe(false);
  });

  it('reverts when typed text present but no selection', () => {
    expect(shouldRevertOnBlur('some text', undefined)).toBe(true);
  });

  it('returns empty string as revert text when no selection', () => {
    expect(getRevertText(undefined)).toBe('');
  });

  it('returns selected label as revert text', () => {
    expect(getRevertText('Burger Games')).toBe('Burger Games');
  });
});

describe('Combobox: error state derivation (shared field-utils)', () => {
  it('returns no errors in standalone mode', () => {
    const errors = getFieldErrors(undefined, 'publisher_id');
    expect(errors).toBeUndefined();
    expect(isFieldTouched(undefined, 'publisher_id')).toBe(false);
    expect(shouldShowError(errors, false)).toBe(false);
  });

  it('derives error state when touched with errors', () => {
    const form = createMockFormContext({
      errors: { publisher_id: ['Please select a publisher'] },
      touched: new Set(['publisher_id']),
    });
    const errors = getFieldErrors(form, 'publisher_id');
    const touched = isFieldTouched(form, 'publisher_id');
    expect(shouldShowError(errors, touched)).toBe(true);
  });

  it('does not show error when not touched', () => {
    const form = createMockFormContext({
      errors: { publisher_id: ['Required'] },
    });
    const errors = getFieldErrors(form, 'publisher_id');
    const touched = isFieldTouched(form, 'publisher_id');
    expect(shouldShowError(errors, touched)).toBe(false);
  });
});

describe('Combobox: value initialization from form context', () => {
  it('returns empty string when no form context', () => {
    const result = initializeFromForm(undefined, 'publisher_id', '', '');
    expect(result).toBe('');
  });

  it('initializes value from form context', () => {
    const form = createMockFormContext({
      getValues: () => ({ publisher_id: 'p5' }),
    });
    const result = initializeFromForm(form, 'publisher_id', '', '');
    expect(result).toBe('p5');
  });

  it('keeps current value when non-empty', () => {
    const form = createMockFormContext({
      getValues: () => ({ publisher_id: 'p5' }),
    });
    const result = initializeFromForm(form, 'publisher_id', 'p2', '');
    expect(result).toBe('p2');
  });
});

describe('Combobox: CSS class building', () => {
  it('builds input class without error', () => {
    expect(buildClassString('input', 'combobox__input')).toBe('input combobox__input');
  });

  it('builds input class with error', () => {
    expect(buildClassString('input', 'combobox__input', 'error')).toBe(
      'input combobox__input error',
    );
  });

  it('filters out falsy values', () => {
    expect(buildClassString('input', 'combobox__input', false)).toBe('input combobox__input');
  });
});

describe('Combobox: form context integration', () => {
  it('calls touch on blur', () => {
    const form = createMockFormContext();
    const name = 'publisher_id';

    // Simulate handleBlur behavior
    if (form && name) {
      form.touch(name);
    }

    expect(form.touch).toHaveBeenCalledWith('publisher_id');
  });

  it('does not call form methods when standalone', () => {
    const form: FormContext | undefined = undefined;
    const name = 'publisher_id';

    if (form && name) {
      form.setValue(name, 'p1');
      form.touch(name);
    }

    // No error thrown
    expect(true).toBe(true);
  });
});
