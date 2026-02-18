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

// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let formEl = $state<HTMLFormElement>();

// Automatically disable submit buttons while submitting (Spec: Gherkin scenario 4)
$effect(() => {
  if (!formEl) return;
  const buttons = formEl.querySelectorAll<HTMLButtonElement>('[type="submit"]');
  for (const btn of buttons) {
    btn.disabled = submitting;
  }
});

function handleReset(e: Event) {
  e.preventDefault();
  // Reset internal state to initial values
  for (const key of Object.keys(values)) {
    delete values[key];
  }
  Object.assign(values, { ...initialValues });
  errors = {};
  touched.clear();
  submitting = false;
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (submitting) return;

  submitting = true;
  errors = {};

  // Validate
  const result = schema.safeParse(values);

  if (!result.success) {
    errors = mapZodIssuesToFieldErrors(result.error.issues);

    // Mark all errored fields as touched so inputs show error state immediately
    for (const name of Object.keys(errors)) {
      touched.add(name);
    }

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
  } finally {
    submitting = false;
  }
}
</script>

<form onsubmit={handleSubmit} onreset={handleReset} novalidate {...rest} bind:this={formEl}>
  {@render children()}
</form>
