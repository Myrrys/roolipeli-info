<script lang="ts">
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';

interface Props {
  /** Form field name */
  name?: string;
  /** Label text displayed next to the switch */
  label: string;
  /** Whether the switch is on */
  checked?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Custom class name */
  class?: string;
}

let {
  name,
  label,
  checked = $bindable(false),
  required = false,
  disabled = false,
  class: className,
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// Reactive state from form
const error = $derived(name && form ? form.errors[name] : undefined);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const hasError = $derived(isTouched && error && error.length > 0);

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  checked = target.checked;

  if (form && name) {
    form.setValue(name, checked);
    form.touch(name);
  }
}

function handleBlur() {
  if (form && name) {
    form.touch(name);
  }
}
</script>

<div class={["switch-wrapper", className].filter(Boolean).join(" ")}>
	<label>
		<input
			type="checkbox"
			role="switch"
			class="switch"
			{name}
			{required}
			{disabled}
			{checked}
			onchange={handleChange}
			onblur={handleBlur}
			aria-checked={checked ? 'true' : 'false'}
			aria-invalid={hasError ? "true" : undefined}
			aria-describedby={name ? `${name}-error` : undefined}
		/>
		<span class="switch-label">{label}</span>
	</label>
	{#if name}
		<FormError {name} />
	{/if}
</div>
