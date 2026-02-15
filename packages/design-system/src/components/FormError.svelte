<script lang="ts">
import { getContext } from 'svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';

const { name, id } = $props<{ name: string; id?: string }>();

const form = getContext<FormContext>(FORM_CONTEXT_KEY);

const errors = $derived(form?.errors[name] || []);
</script>

{#if errors.length > 0}
    <p class="form-error" id={id || `${name}-error`} role="alert">
        {errors[0]}
    </p>
{/if}
