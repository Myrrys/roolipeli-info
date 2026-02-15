<script lang="ts">
import type { Snippet } from 'svelte';
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';
import Label from './Label.svelte';

interface Props {
  /** Field name for form binding and error lookup */
  name?: string;
  /** Label text */
  label?: string;
  /** Whether field is required */
  required?: boolean;
  /** Maximum character length */
  maxlength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string;
  /** Custom class name */
  class?: string;
  /** Label snippet */
  children?: Snippet;
  [key: string]: unknown;
}

let {
  name,
  label,
  required = false,
  maxlength,
  placeholder,
  value = $bindable(''),
  class: className,
  children,
  ...rest
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// If in a form, initialize value from form if not provided
if (form && name && value === '') {
  const formValues = form.getValues();
  if (formValues && formValues[name] !== undefined) {
    value = formValues[name] as string;
  }
}

// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let textareaEl = $state<HTMLTextAreaElement>();

// Sync with form context on user input
function syncToForm() {
  if (form && name) {
    form.setValue(name, value);
  }
}

// Auto-size textarea to content
$effect(() => {
  if (!textareaEl) return;
  // Trigger on value change
  value;
  textareaEl.style.height = 'auto';
  textareaEl.style.height = `${textareaEl.scrollHeight}px`;
});

// Get validation state from form context
const fieldErrors = $derived(form && name ? form.errors[name] : undefined);
const isTouched = $derived(form && name ? form.touched.has(name) : false);
const showError = $derived(isTouched && fieldErrors && fieldErrors.length > 0);

const fieldId = $derived(name ? `textarea-${name}` : undefined);
const errorId = $derived(fieldId ? `${fieldId}-error` : undefined);

const characterCount = $derived(value.length);
const showCount = $derived(maxlength !== undefined && maxlength > 0);

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  value = target.value;
  syncToForm();
}

function handleBlur() {
  if (form && name) {
    form.touch(name);
  }
}
</script>

<div class="form-group">
	{#if label || children}
		<Label for={fieldId} {required}>
			{#if children}
				{@render children()}
			{:else}
				{label}
			{/if}
		</Label>
	{/if}

	<textarea
		bind:this={textareaEl}
		id={fieldId}
		{name}
		{placeholder}
		{required}
		{maxlength}
		{value}
		class={["textarea", showError ? "error" : "", className].filter(Boolean).join(" ")}
		aria-invalid={showError ? 'true' : undefined}
		aria-describedby={fieldId ? errorId : undefined}
		oninput={handleInput}
		onblur={handleBlur}
		{...rest}
	></textarea>

	{#if showCount}
		<div class="char-count" aria-live="polite">
			{characterCount}/{maxlength}
		</div>
	{/if}

	{#if name}
		<FormError {name} id={errorId} />
	{/if}
</div>
