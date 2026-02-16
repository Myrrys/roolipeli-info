import type { FieldErrors } from './form-context.js';

/**
 * Extract validation errors for a specific array item.
 * Matches error keys like "creators.0.role" for name="creators", index=0.
 * Returns a record mapping sub-field names to their error arrays.
 */
export function getItemErrors(
  errors: FieldErrors,
  name: string,
  index: number,
): Record<string, string[]> {
  const prefix = `${name}.${index}.`;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(errors)) {
    if (key.startsWith(prefix)) {
      const field = key.slice(prefix.length);
      result[field] = messages;
    }
  }
  return result;
}

/**
 * Extract array-level validation errors (not per-item).
 * Matches errors keyed exactly by the array name, e.g., errors["creators"].
 */
export function getArrayErrors(errors: FieldErrors, name: string): string[] {
  return errors[name] ?? [];
}

/**
 * Format per-item errors into a flat array of readable messages.
 * E.g., { role: ["Required"] } → ["role: Required"]
 */
export function formatItemErrors(itemErrors: Record<string, string[]>): string[] {
  const messages: string[] = [];
  for (const [field, errs] of Object.entries(itemErrors)) {
    for (const err of errs) {
      messages.push(`${field}: ${err}`);
    }
  }
  return messages;
}

/**
 * Determine whether a new item can be added to the array.
 * Returns false when disabled or when the array has reached the max count.
 */
export function canAddItem(
  itemsLength: number,
  max: number | undefined,
  disabled: boolean,
): boolean {
  if (disabled) return false;
  return max === undefined || itemsLength < max;
}

/**
 * Determine whether an item can be removed from the array.
 * Returns false when disabled or when the array is at the minimum count.
 */
export function canRemoveItem(itemsLength: number, min: number, disabled: boolean): boolean {
  if (disabled) return false;
  return itemsLength > min;
}

/**
 * Create a new array item by shallow-copying the defaults.
 * Returns an empty object if no defaults provided.
 */
export function createNewItem(
  itemDefault: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return { ...(itemDefault ?? {}) };
}

/**
 * Remove an item from an array by index, returning a new array.
 * Returns the original array if the index is out of bounds.
 */
export function removeItem(
  items: Record<string, unknown>[],
  index: number,
): Record<string, unknown>[] {
  if (index < 0 || index >= items.length) return items;
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

/**
 * Initialize array items from form context values.
 * Returns a shallow copy of each item to avoid shared references.
 */
export function initializeItems(
  formValues: Record<string, unknown> | undefined,
  name: string,
): Record<string, unknown>[] {
  if (!formValues) return [];
  const value = formValues[name];
  if (!Array.isArray(value)) return [];
  return (value as Record<string, unknown>[]).map((item) => ({ ...item }));
}
