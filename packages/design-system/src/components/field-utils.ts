/**
 * Field utility functions — extracted equivalents of inline logic in Svelte components.
 *
 * Svelte 5 components (Checkbox, Select, Switch, RadioGroup) use `$derived()` runes
 * with inline expressions for reactive state. These pure functions mirror that logic
 * so it can be unit-tested without the Svelte runtime.
 *
 * If you change the inline logic in a component, update the matching function here
 * (and vice versa) to keep tests aligned with real behavior.
 */
import type { FormContext } from './form-context.js';

/**
 * Compute the aria-checked attribute value for a checkbox.
 * Returns 'mixed' for indeterminate, 'true'/'false' otherwise.
 */
export function computeAriaChecked(
  checked: boolean,
  indeterminate: boolean,
): 'true' | 'false' | 'mixed' {
  if (indeterminate) return 'mixed';
  return checked ? 'true' : 'false';
}

/**
 * Get error messages for a field from form context.
 * Returns undefined if no form context or no field name.
 */
export function getFieldErrors(
  form: FormContext | undefined,
  name: string | undefined,
): string[] | undefined {
  if (!name || !form) return undefined;
  return form.errors[name];
}

/**
 * Check if a field has been touched in form context.
 */
export function isFieldTouched(form: FormContext | undefined, name: string | undefined): boolean {
  if (!name || !form) return false;
  return form.touched.has(name);
}

/**
 * Determine if a field should display its error state.
 * Only shows errors for touched fields with non-empty error arrays.
 */
export function shouldShowError(errors: string[] | undefined, isTouched: boolean): boolean {
  return isTouched && !!errors && errors.length > 0;
}

/**
 * Initialize a field value from form context if the field has no current value.
 * Returns the form value if available, otherwise the current value.
 */
export function initializeFromForm<T>(
  form: FormContext | undefined,
  name: string | undefined,
  currentValue: T,
  emptyValue: T,
): T {
  if (!form || !name || currentValue !== emptyValue) return currentValue;
  const formValues = form.getValues();
  if (formValues && formValues[name] !== undefined) {
    return formValues[name] as T;
  }
  return currentValue;
}

/**
 * Build a CSS class string from an array of class names, filtering out falsy values.
 */
export function buildClassString(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Compute the CSS class for radio group options based on orientation.
 */
export function radioGroupOptionsClass(orientation: 'vertical' | 'horizontal'): string {
  const base = 'radio-group__options';
  if (orientation === 'horizontal') {
    return `${base} ${base}--horizontal`;
  }
  return base;
}
