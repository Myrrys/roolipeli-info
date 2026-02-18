import type { ZodIssue } from 'zod';

/** Unique context key for Kide forms */
export const FORM_CONTEXT_KEY = Symbol('kide-form');

/** Per-field error messages, keyed by field name (dot-path for nested) */
export type FieldErrors = Record<string, string[]>;

/** Context provided by Form.svelte to all child fields */
export interface FormContext {
  /** Current field errors from last validation run. Reactive ($state). */
  readonly errors: FieldErrors;
  /** Set of field names the user has interacted with. Reactive ($state). */
  readonly touched: Set<string>;
  /** True while the onSubmit callback is executing. Reactive ($state). */
  readonly submitting: boolean;
  /** Mark a field as touched (called by child on blur). */
  touch(name: string): void;
  /** Get current form values as a plain object. */
  getValues(): Record<string, unknown>;
  /** Programmatically set a field value. */
  setValue(name: string, value: unknown): void;
}

/**
 * Maps Zod validation issues to per-field error arrays.
 * Pure function, safe to unit test without Svelte runtime.
 */
export function mapZodIssuesToFieldErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return errors;
}
