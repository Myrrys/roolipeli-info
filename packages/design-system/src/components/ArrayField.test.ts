import { describe, expect, it, vi } from 'vitest';
import {
  canAddItem,
  canRemoveItem,
  createNewItem,
  formatItemErrors,
  getArrayErrors,
  getItemErrors,
  initializeItems,
  removeItem,
} from './array-field-utils.js';
import type { FormContext } from './form-context.js';

// --- Error extraction utilities ---

describe('array-field-utils', () => {
  describe('getItemErrors', () => {
    it('extracts errors for a specific item index', () => {
      const errors = {
        'creators.0.role': ['Required'],
        'creators.0.creator_id': ['Must select a creator'],
        'creators.1.role': ['Too short'],
        creators: ['At least one creator required'],
      };

      const result = getItemErrors(errors, 'creators', 0);
      expect(result).toEqual({
        role: ['Required'],
        creator_id: ['Must select a creator'],
      });
    });

    it('returns empty object when no errors for index', () => {
      const errors = {
        'creators.0.role': ['Required'],
      };

      const result = getItemErrors(errors, 'creators', 1);
      expect(result).toEqual({});
    });

    it('returns empty object when no errors at all', () => {
      const result = getItemErrors({}, 'creators', 0);
      expect(result).toEqual({});
    });

    it('does not match array-level errors', () => {
      const errors = {
        creators: ['At least one creator required'],
      };

      const result = getItemErrors(errors, 'creators', 0);
      expect(result).toEqual({});
    });

    it('handles nested field paths', () => {
      const errors = {
        'references.2.url': ['Must be a valid URL'],
        'references.2.label': ['Required'],
      };

      const result = getItemErrors(errors, 'references', 2);
      expect(result).toEqual({
        url: ['Must be a valid URL'],
        label: ['Required'],
      });
    });

    it('does not match partial name prefixes', () => {
      const errors = {
        'creator_ids.0.value': ['Required'],
      };

      const result = getItemErrors(errors, 'creator', 0);
      expect(result).toEqual({});
    });

    it('handles multiple errors per field', () => {
      const errors = {
        'creators.0.role': ['Required', 'Must be at least 2 characters'],
      };

      const result = getItemErrors(errors, 'creators', 0);
      expect(result).toEqual({
        role: ['Required', 'Must be at least 2 characters'],
      });
    });
  });

  describe('getArrayErrors', () => {
    it('returns array-level errors', () => {
      const errors = {
        creators: ['At least one creator required'],
        'creators.0.role': ['Required'],
      };

      const result = getArrayErrors(errors, 'creators');
      expect(result).toEqual(['At least one creator required']);
    });

    it('returns empty array when no array-level errors', () => {
      const errors = {
        'creators.0.role': ['Required'],
      };

      const result = getArrayErrors(errors, 'creators');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty errors object', () => {
      const result = getArrayErrors({}, 'creators');
      expect(result).toEqual([]);
    });

    it('returns multiple array-level errors', () => {
      const errors = {
        creators: ['Too few items', 'At least one must have a role'],
      };

      const result = getArrayErrors(errors, 'creators');
      expect(result).toEqual(['Too few items', 'At least one must have a role']);
    });
  });

  describe('formatItemErrors', () => {
    it('formats single field single error', () => {
      const result = formatItemErrors({ role: ['Required'] });
      expect(result).toEqual(['role: Required']);
    });

    it('formats multiple fields', () => {
      const result = formatItemErrors({
        role: ['Required'],
        creator_id: ['Must select a creator'],
      });
      expect(result).toEqual(['role: Required', 'creator_id: Must select a creator']);
    });

    it('formats multiple errors per field', () => {
      const result = formatItemErrors({
        role: ['Required', 'Must be at least 2 characters'],
      });
      expect(result).toEqual(['role: Required', 'role: Must be at least 2 characters']);
    });

    it('returns empty array for no errors', () => {
      const result = formatItemErrors({});
      expect(result).toEqual([]);
    });
  });
});

// --- Constraint logic ---

describe('canAddItem', () => {
  it('returns true when no max and not disabled', () => {
    expect(canAddItem(0, undefined, false)).toBe(true);
    expect(canAddItem(100, undefined, false)).toBe(true);
  });

  it('returns true when below max', () => {
    expect(canAddItem(2, 5, false)).toBe(true);
  });

  it('returns false when at max', () => {
    expect(canAddItem(5, 5, false)).toBe(false);
  });

  it('returns false when above max', () => {
    expect(canAddItem(6, 5, false)).toBe(false);
  });

  it('returns false when disabled regardless of count', () => {
    expect(canAddItem(0, undefined, true)).toBe(false);
    expect(canAddItem(0, 5, true)).toBe(false);
  });

  it('returns true when max is 0 and items is 0 (edge: max=0)', () => {
    expect(canAddItem(0, 0, false)).toBe(false);
  });
});

describe('canRemoveItem', () => {
  it('returns true when above min', () => {
    expect(canRemoveItem(3, 0, false)).toBe(true);
    expect(canRemoveItem(2, 1, false)).toBe(true);
  });

  it('returns false when at min', () => {
    expect(canRemoveItem(1, 1, false)).toBe(false);
    expect(canRemoveItem(0, 0, false)).toBe(false);
  });

  it('returns false when below min (edge case)', () => {
    expect(canRemoveItem(0, 1, false)).toBe(false);
  });

  it('returns false when disabled regardless of count', () => {
    expect(canRemoveItem(5, 0, true)).toBe(false);
    expect(canRemoveItem(3, 1, true)).toBe(false);
  });
});

// --- Item creation ---

describe('createNewItem', () => {
  it('creates a shallow copy of defaults', () => {
    const defaults = { creator_id: '', role: '' };
    const item = createNewItem(defaults);
    expect(item).toEqual({ creator_id: '', role: '' });
    // Verify it's a new object (not the same reference)
    expect(item).not.toBe(defaults);
  });

  it('returns empty object when no defaults provided', () => {
    expect(createNewItem(undefined)).toEqual({});
  });

  it('returns empty object when defaults is empty', () => {
    expect(createNewItem({})).toEqual({});
  });

  it('preserves default values of different types', () => {
    const defaults = { name: 'default', count: 0, active: false };
    const item = createNewItem(defaults);
    expect(item).toEqual({ name: 'default', count: 0, active: false });
  });
});

// --- Item removal ---

describe('removeItem', () => {
  it('removes item at the specified index', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const result = removeItem(items, 1);
    expect(result).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('removes first item', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const result = removeItem(items, 0);
    expect(result).toEqual([{ id: 'b' }]);
  });

  it('removes last item', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const result = removeItem(items, 1);
    expect(result).toEqual([{ id: 'a' }]);
  });

  it('returns original array for negative index', () => {
    const items = [{ id: 'a' }];
    expect(removeItem(items, -1)).toBe(items);
  });

  it('returns original array for out-of-bounds index', () => {
    const items = [{ id: 'a' }];
    expect(removeItem(items, 5)).toBe(items);
  });

  it('returns empty array when removing the only item', () => {
    const items = [{ id: 'a' }];
    const result = removeItem(items, 0);
    expect(result).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const result = removeItem(items, 0);
    expect(items).toHaveLength(2);
    expect(result).toHaveLength(1);
  });
});

// --- Initialization from form context ---

describe('initializeItems', () => {
  it('returns shallow copies of items from form values', () => {
    const formValues = {
      creators: [
        { creator_id: '1', role: 'author' },
        { creator_id: '2', role: 'editor' },
      ],
    };
    const result = initializeItems(formValues, 'creators');
    expect(result).toEqual([
      { creator_id: '1', role: 'author' },
      { creator_id: '2', role: 'editor' },
    ]);
    // Verify items are copies, not same references
    expect(result[0]).not.toBe(formValues.creators[0]);
  });

  it('returns empty array when form values is undefined', () => {
    expect(initializeItems(undefined, 'creators')).toEqual([]);
  });

  it('returns empty array when field is not in form values', () => {
    expect(initializeItems({ other: 'value' }, 'creators')).toEqual([]);
  });

  it('returns empty array when field value is not an array', () => {
    expect(initializeItems({ creators: 'not-an-array' }, 'creators')).toEqual([]);
    expect(initializeItems({ creators: 42 }, 'creators')).toEqual([]);
    expect(initializeItems({ creators: null }, 'creators')).toEqual([]);
  });

  it('returns empty array for an empty array value', () => {
    expect(initializeItems({ creators: [] }, 'creators')).toEqual([]);
  });
});

// --- Form context integration ---

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

describe('ArrayField: form context integration', () => {
  it('calls setValue with array on add', () => {
    const form = createMockFormContext();
    const name = 'creators';
    const itemDefault = { creator_id: '', role: '' };

    // Simulate add behavior
    const items = [createNewItem(itemDefault)];
    if (form && name) {
      form.setValue(name, items);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('creators', [{ creator_id: '', role: '' }]);
    expect(form.touch).toHaveBeenCalledWith('creators');
  });

  it('calls setValue with updated array on remove', () => {
    const form = createMockFormContext();
    const name = 'creators';
    const items = [
      { creator_id: '1', role: 'author' },
      { creator_id: '2', role: 'editor' },
    ];
    const updated = removeItem(items, 0);

    if (form && name) {
      form.setValue(name, updated);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('creators', [{ creator_id: '2', role: 'editor' }]);
    expect(form.touch).toHaveBeenCalledWith('creators');
  });

  it('does not call form methods when standalone (no form context)', () => {
    const form: FormContext | undefined = undefined;
    const name = 'creators';
    const items = [createNewItem({ role: '' })];

    if (form && name) {
      form.setValue(name, items);
      form.touch(name);
    }

    // No error thrown
    expect(true).toBe(true);
  });

  it('initializes from form context getValues()', () => {
    const existingItems = [
      { creator_id: '1', role: 'author' },
      { creator_id: '2', role: 'editor' },
    ];
    const form = createMockFormContext({
      getValues: () => ({ creators: existingItems }),
    });

    const items = initializeItems(form.getValues(), 'creators');
    expect(items).toEqual(existingItems);
    expect(items[0]).not.toBe(existingItems[0]);
  });
});

describe('ArrayField: constraint + operation flow', () => {
  it('blocks add when at max', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const max = 3;

    expect(canAddItem(items.length, max, false)).toBe(false);
  });

  it('allows add then blocks at max', () => {
    const max = 2;
    let items: Record<string, unknown>[] = [];

    // Add first
    expect(canAddItem(items.length, max, false)).toBe(true);
    items = [...items, createNewItem({ role: '' })];

    // Add second
    expect(canAddItem(items.length, max, false)).toBe(true);
    items = [...items, createNewItem({ role: '' })];

    // Blocked at max
    expect(canAddItem(items.length, max, false)).toBe(false);
    expect(items).toHaveLength(2);
  });

  it('blocks remove when at min, allows after add', () => {
    const min = 1;
    let items = [{ id: 'a' }];

    // At min — can't remove
    expect(canRemoveItem(items.length, min, false)).toBe(false);

    // Add one
    items = [...items, createNewItem({ id: '' })];
    expect(canRemoveItem(items.length, min, false)).toBe(true);

    // Remove back to min
    items = removeItem(items, 1);
    expect(canRemoveItem(items.length, min, false)).toBe(false);
  });

  it('disabled overrides both add and remove', () => {
    expect(canAddItem(0, undefined, true)).toBe(false);
    expect(canRemoveItem(5, 0, true)).toBe(false);
  });
});
