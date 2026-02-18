<script lang="ts">
import { getContext } from 'svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';

/**
 * FormError component displays validation error messages for form fields.
 * Can be used standalone (with `errors` prop) or within Form context (with `name` prop).
 *
 * @example
 * ```svelte
 * <!-- Standalone mode -->
 * <FormError errors={["Too short", "Needs uppercase"]} id="password-error" />
 *
 * <!-- Context mode -->
 * <FormError name="email" />
 * ```
 */

interface Props {
  /** Field name to look up errors from Form context. Optional when using standalone mode with `errors` prop. */
  name?: string;
  /** ID for the first error element (for aria-describedby linking). */
  id?: string;
  /** Explicit error messages. Overrides context-derived errors. */
  errors?: string[];
}

const { name, id, errors: errorsProp }: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

/**
 * Resolved error messages from either explicit prop or Form context.
 */
const errors = $derived(errorsProp ?? (name ? (form?.errors[name] ?? []) : []));

/**
 * Generates ID for error element. Uses provided ID for first error, generates for subsequent.
 */
function getErrorId(index: number): string | undefined {
  if (index === 0) {
    return id ?? (name ? `${name}-error` : undefined);
  }
  return id ? `${id}-${index}` : name ? `${name}-error-${index}` : undefined;
}
</script>

{#each errors as error, index}
	<p class="form-error" id={getErrorId(index)} role="alert">
		{error}
	</p>
{/each}
