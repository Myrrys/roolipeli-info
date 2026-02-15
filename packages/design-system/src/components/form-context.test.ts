import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  type FieldErrors,
  FORM_CONTEXT_KEY,
  type FormContext,
  mapZodIssuesToFieldErrors,
} from './form-context.js';

describe('FORM_CONTEXT_KEY', () => {
  it('is a unique Symbol', () => {
    expect(typeof FORM_CONTEXT_KEY).toBe('symbol');
    expect(FORM_CONTEXT_KEY.toString()).toBe('Symbol(kide-form)');
  });
});

describe('mapZodIssuesToFieldErrors', () => {
  it('returns empty object for empty issues array', () => {
    const result = mapZodIssuesToFieldErrors([]);
    expect(result).toEqual({});
  });

  it('maps single field error', () => {
    const schema = z.object({ name: z.string().min(3) });
    const parsed = schema.safeParse({ name: 'AB' });

    if (parsed.success) throw new Error('Expected validation to fail');

    const errors = mapZodIssuesToFieldErrors(parsed.error.issues);
    expect(errors).toHaveProperty('name');
    expect(errors.name).toHaveLength(1);
    expect(errors.name[0]).toContain('3');
  });

  it('maps multiple field errors', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });
    const parsed = schema.safeParse({ name: '', email: 'not-email' });

    if (parsed.success) throw new Error('Expected validation to fail');

    const errors = mapZodIssuesToFieldErrors(parsed.error.issues);
    expect(Object.keys(errors)).toHaveLength(2);
    expect(errors).toHaveProperty('name');
    expect(errors).toHaveProperty('email');
  });

  it('groups multiple errors on the same field', () => {
    const schema = z.object({
      password: z.string().min(8, 'Too short').regex(/[A-Z]/, 'Needs uppercase'),
    });
    const parsed = schema.safeParse({ password: 'ab' });

    if (parsed.success) throw new Error('Expected validation to fail');

    const errors = mapZodIssuesToFieldErrors(parsed.error.issues);
    expect(errors.password.length).toBeGreaterThanOrEqual(1);
    expect(errors.password[0]).toBe('Too short');
  });

  it('joins nested paths with dots', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1),
      }),
    });
    const parsed = schema.safeParse({ user: { name: '' } });

    if (parsed.success) throw new Error('Expected validation to fail');

    const errors = mapZodIssuesToFieldErrors(parsed.error.issues);
    expect(errors).toHaveProperty('user.name');
  });

  it('handles array index paths', () => {
    const schema = z.object({
      items: z.array(z.string().min(1)),
    });
    const parsed = schema.safeParse({ items: ['valid', ''] });

    if (parsed.success) throw new Error('Expected validation to fail');

    const errors = mapZodIssuesToFieldErrors(parsed.error.issues);
    expect(errors).toHaveProperty('items.1');
  });
});

describe('FormContext interface', () => {
  it('can be satisfied by a mock implementation', () => {
    const mockErrors: FieldErrors = { name: ['Required'] };
    const mockTouched = new Set<string>(['name']);

    const ctx: FormContext = {
      errors: mockErrors,
      touched: mockTouched,
      submitting: false,
      touch(name: string) {
        mockTouched.add(name);
      },
      getValues() {
        return { name: 'test' };
      },
      setValue(_name: string, _value: unknown) {
        // no-op for type check
      },
    };

    expect(ctx.errors.name).toEqual(['Required']);
    expect(ctx.touched.has('name')).toBe(true);
    expect(ctx.submitting).toBe(false);

    ctx.touch('email');
    expect(mockTouched.has('email')).toBe(true);

    expect(ctx.getValues()).toEqual({ name: 'test' });
  });
});
