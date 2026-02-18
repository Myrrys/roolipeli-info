<script lang="ts">
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';

interface Props {
  /** Form field name */
  name?: string;
  /** Label text displayed next to the checkbox */
  label: string;
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Whether the checkbox is in indeterminate state */
  indeterminate?: boolean;
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
  indeterminate = false,
  required = false,
  disabled = false,
  class: className,
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let inputEl = $state<HTMLInputElement>();

// Reactive state from form
const error = $derived(name && form ? form.errors[name] : undefined);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const hasError = $derived(isTouched && error && error.length > 0);

const ariaChecked = $derived(indeterminate ? 'mixed' : checked ? 'true' : 'false');

// Sync indeterminate property to the DOM element
$effect(() => {
  if (inputEl) {
    inputEl.indeterminate = indeterminate;
  }
});

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

<div class={["checkbox-wrapper", className].filter(Boolean).join(" ")}>
	<label>
		<input
			bind:this={inputEl}
			type="checkbox"
			class={["checkbox", hasError ? "error" : ""].filter(Boolean).join(" ")}
			{name}
			{required}
			{disabled}
			{checked}
			onchange={handleChange}
			onblur={handleBlur}
			aria-checked={ariaChecked}
			aria-invalid={hasError ? "true" : undefined}
			aria-describedby={name ? `${name}-error` : undefined}
		/>
		<span class="checkbox-label">{label}</span>
	</label>
	{#if name}
		<FormError {name} />
	{/if}
</div>
