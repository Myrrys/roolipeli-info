<script lang="ts">
const {
  for: forId,
  required = false,
  children,
  class: className,
  ...rest
} = $props<
  {
    for?: string;
    required?: boolean;
    children: import('svelte').Snippet;
    class?: string;
  } & import('svelte/elements').HTMLLabelAttributes
>();
</script>

<label for={forId} class={["label", className].filter(Boolean).join(" ")} {...rest}>
    {@render children()}
    {#if required}
        <span class="required" aria-hidden="true">*</span>
    {/if}
</label>

<style>
    .required {
        color: var(--kide-danger);
        margin-left: var(--kide-space-1);
    }
</style>
