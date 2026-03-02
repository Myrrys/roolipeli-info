<script lang="ts">
import { PublisherFormCreateSchema } from '@roolipeli/database';
import ArrayField from '@roolipeli/design-system/components/ArrayField.svelte';
import Form from '@roolipeli/design-system/components/Form.svelte';
import Input from '@roolipeli/design-system/components/Input.svelte';
import Textarea from '@roolipeli/design-system/components/Textarea.svelte';
import { onMount, tick, untrack } from 'svelte';
import { generateSlug } from '../../lib/slug.client';
import ReferenceFormRows from './ReferenceFormRows.svelte';

/**
 * Props for the PublisherForm component.
 * All data is fetched server-side in Astro and passed as props.
 * Spec: specs/entity-references/spec.md → ROO-26
 */
interface Props {
  publisher?: {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    references?: { reference_type: string; label: string; url: string }[];
  };
  submitUrl: string;
  method?: 'POST' | 'PUT';
}

const { publisher, submitUrl, method = 'POST' }: Props = $props();

const initialValues: Record<string, unknown> = publisher
  ? {
      name: publisher.name,
      slug: publisher.slug,
      description: publisher.description ?? '',
      references: publisher.references ?? [],
    }
  : {
      name: '',
      slug: '',
      description: '',
      references: [],
    };

let errorMessage = $state('');

/**
 * Handles form submission and API call.
 * Called by Form.svelte after successful Zod validation.
 */
async function handleSubmit(data: Record<string, unknown>): Promise<void> {
  errorMessage = '';
  try {
    const res = await fetch(submitUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const result = await res.json();
      errorMessage = result.error || 'Unknown error occurred';
      return;
    }
    const successParam = method === 'POST' ? 'created' : 'updated';
    window.location.href = `/admin/publishers?success=${successParam}`;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Network error';
  }
}

// biome-ignore lint/style/useConst: Svelte $state requires let for reactivity
let nameValue = $state(publisher?.name ?? '');
let slugValue = $state(publisher?.slug ?? '');
let slugManuallyEdited = $state(!!publisher);
let lastAutoSlug = $state(publisher?.slug ?? '');

/** Auto-generate slug from name unless manually edited. */
$effect(() => {
  const name = nameValue;
  untrack(() => {
    if (!slugManuallyEdited) {
      const newSlug = generateSlug(name);
      lastAutoSlug = newSlug;
      slugValue = newSlug;
      tick().then(() => {
        const slugEl = document.querySelector<HTMLInputElement>('[name="slug"]');
        if (slugEl) slugEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  });
});

/** Detect manual slug edits by comparing to last auto-generated value. */
$effect(() => {
  const currentSlug = slugValue;
  untrack(() => {
    if (currentSlug !== lastAutoSlug) {
      slugManuallyEdited = true;
    }
  });
});

onMount(() => {
  const formEl = document.getElementById('publisher-form');
  if (formEl) formEl.dataset.initialized = 'true';
});
</script>

<div class="publisher-form">
  {#if errorMessage}
    <div class="error-banner" role="alert">{errorMessage}</div>
  {/if}

  <Form
    schema={PublisherFormCreateSchema}
    {initialValues}
    onSubmit={handleSubmit}
    id="publisher-form"
  >
    <div class="form-grid">
      <Input
        label="Name"
        name="name"
        required
        bind:value={nameValue}
      />
      <Input
        label="Slug"
        name="slug"
        required
        bind:value={slugValue}
      />
    </div>

    <Textarea label="Description" name="description" />

    <!-- References Section -->
    <div class="references-section">
      <ArrayField
        name="references"
        label="References"
        itemDefault={{ reference_type: 'official', label: '', url: '' }}
      >
        {#snippet children({ items, add, remove, canAdd, canRemove, itemErrors })}
          <ReferenceFormRows {items} {add} {remove} {canAdd} {canRemove} {itemErrors} />
        {/snippet}
      </ArrayField>
    </div>

    <div class="form-actions">
      <a href="/admin/publishers" class="btn-cancel">Cancel</a>
      <button type="submit" class="btn-save">Save Publisher</button>
    </div>
  </Form>
</div>

<style>
  .publisher-form {
    max-width: 900px;
  }

  .error-banner {
    color: var(--kide-danger);
    background: var(--kide-danger-bg);
    padding: var(--kide-space-3);
    border-radius: var(--kide-radius-sm);
    border: 1px solid var(--kide-danger);
    margin-bottom: var(--kide-space-4);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--kide-space-4);
    margin-bottom: var(--kide-space-4);
  }

  /* Array sections */
  .references-section {
    margin: var(--kide-space-6) 0;
    padding: var(--kide-space-4);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-md);
    background: var(--kide-paper);
  }

  .form-actions {
    display: flex;
    gap: var(--kide-space-3);
    justify-content: flex-end;
    margin-top: var(--kide-space-6);
  }

  .btn-cancel {
    padding: var(--kide-space-2) var(--kide-space-4);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-sm);
    text-decoration: none;
    color: var(--kide-ink-primary);
    background: var(--kide-surface);
  }

  .btn-save {
    padding: var(--kide-space-2) var(--kide-space-4);
    background: var(--kide-ice-deep);
    color: var(--kide-surface);
    border: none;
    border-radius: var(--kide-radius-sm);
    cursor: pointer;
    font-weight: 600;
  }

  .btn-save:hover {
    opacity: 0.9;
  }
</style>
