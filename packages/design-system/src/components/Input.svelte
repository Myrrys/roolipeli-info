<script lang="ts">
import { getContext } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';
import Label from './Label.svelte';

interface InputProps extends HTMLInputAttributes {
  label: string;
  name?: string;
  value?: string | number | null;
}

let {
  label,
  name,
  value = $bindable(),
  type = 'text',
  required = false,
  disabled = false,
  class: className,
  ...rest
}: InputProps = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// If in a form, initialize value from form if not provided
if (form && name && value === undefined) {
  const formValues = form.getValues();
  if (formValues && formValues[name] !== undefined) {
    value = formValues[name] as string | number | null;
  }
}

// Reactive state from form
const error = $derived(name && form ? form.errors[name] : undefined);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const hasError = $derived(isTouched && error && error.length > 0);

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  value = target.value;

  // Sync with form
  if (form && name) {
    form.setValue(name, value);
  }
}

function handleBlur() {
  if (form && name) {
    form.touch(name);
  }
}
</script>

<div class="form-group">
    <Label for={name} {required}>{label}</Label>

    <input
        id={name}
        {name}
        {type}
        {value}
        {required}
        {disabled}
        oninput={handleInput}
        onblur={handleBlur}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={name ? `${name}-error` : undefined}
        class={["input", hasError ? "error" : "", className]
            .filter(Boolean)
            .join(" ")}
        {...rest}
    />

    {#if name}
        <FormError {name} />
    {/if}
</div>
