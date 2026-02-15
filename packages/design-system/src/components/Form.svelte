<script lang="ts">
import { setContext, tick } from 'svelte';
import type { ZodType } from 'zod';
import {
  type FieldErrors,
  FORM_CONTEXT_KEY,
  type FormContext,
  mapZodIssuesToFieldErrors,
} from './form-context.js';

const {
  schema,
  initialValues = {},
  onSubmit,
  children,
  ...rest
} = $props<
  {
    schema: ZodType;
    initialValues?: Record<string, unknown>;
    onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
    children: import('svelte').Snippet;
  } & import('svelte/elements').HTMLFormAttributes
>();

// Form state — flat Record for MVP, Zod handles nested path validation
const values: Record<string, unknown> = $state({ ...initialValues });
let errors = $state<FieldErrors>({});
const touched = $state(new Set<string>());
let submitting = $state(false);

const context: FormContext = {
  get errors() {
    return errors;
  },
  get touched() {
    return touched;
  },
  get submitting() {
    return submitting;
  },
  touch(name) {
    if (!touched.has(name)) {
      touched.add(name);
    }
  },
  getValues() {
    return $state.snapshot(values);
  },
  setValue(name, value) {
    values[name] = value;
  },
};

setContext(FORM_CONTEXT_KEY, context);

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (submitting) return;

  submitting = true;
  errors = {};

  // Validate
  const result = schema.safeParse(values);

  if (!result.success) {
    errors = mapZodIssuesToFieldErrors(result.error.issues);

    // Focus first invalid
    await tick();
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      // Try to find element by name
      const el = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement;
      el?.focus();
    }

    submitting = false;
    return;
  }

  // Submit
  try {
    await onSubmit(result.data);
  } catch (err) {
    console.error('Form submission error:', err);
  } finally {
    submitting = false;
  }
}
</script>

<form onsubmit={handleSubmit} novalidate {...rest}>
  {@render children()}
</form>
