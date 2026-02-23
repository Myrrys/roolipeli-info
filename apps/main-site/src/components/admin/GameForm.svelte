<script lang="ts">
import { GameFormCreateSchema, ProductLangEnum } from '@roolipeli/database';
import ArrayField from '@roolipeli/design-system/components/ArrayField.svelte';
import Combobox from '@roolipeli/design-system/components/Combobox.svelte';
import Form from '@roolipeli/design-system/components/Form.svelte';
import Input from '@roolipeli/design-system/components/Input.svelte';
import Select from '@roolipeli/design-system/components/Select.svelte';
import Textarea from '@roolipeli/design-system/components/Textarea.svelte';
import { onMount, tick, untrack } from 'svelte';
import { generateSlug } from '../../lib/slug.client';

/**
 * Props for the GameForm component.
 * All data is fetched server-side in Astro and passed as props.
 * Spec: specs/rpg-entity/spec.md → ROO-98
 */
interface Props {
  game?: {
    id?: string;
    name: string;
    slug: string;
    publisher_id?: string | null;
    description?: string | null;
    number_of_players?: string | null;
    in_language?: string | null;
    url?: string | null;
    license?: string | null;
    image_url?: string | null;
    creators?: { creator_id: string; role: string }[];
    labels?: { label_id: string }[];
    references?: { reference_type: string; label: string; url: string }[];
    basedOn?: { based_on_game_id?: string | null; based_on_url?: string | null; label: string }[];
  };
  publishers: Array<{ id: string; name: string }>;
  creators: Array<{ id: string; name: string }>;
  labels?: Array<{ id: string; label: string; wikidata_id?: string | null }>;
  allGames?: Array<{ id: string; name: string }>;
  submitUrl: string;
  method?: 'POST' | 'PUT';
}

const {
  game,
  publishers,
  creators,
  labels = [],
  allGames = [],
  submitUrl,
  method = 'POST',
}: Props = $props();

const initialValues: Record<string, unknown> = game
  ? {
      name: game.name,
      slug: game.slug,
      publisher_id: game.publisher_id ?? '',
      description: game.description ?? '',
      number_of_players: game.number_of_players ?? '',
      in_language: game.in_language ?? '',
      url: game.url ?? '',
      license: game.license ?? '',
      image_url: game.image_url ?? '',
      creators: game.creators ?? [],
      labels: game.labels ?? [],
      references: game.references ?? [],
      basedOn: game.basedOn ?? [],
    }
  : {
      name: '',
      slug: '',
      publisher_id: '',
      description: '',
      number_of_players: '',
      in_language: '',
      url: '',
      license: '',
      image_url: '',
      creators: [],
      labels: [],
      references: [],
      basedOn: [],
    };

let errorMessage = $state('');

const publisherOptions = publishers.map((p) => ({ value: p.id, label: p.name }));
const creatorOptions = creators.map((c) => ({ value: c.id, label: c.name }));
const labelOptions = labels.map((l) => ({
  value: l.id,
  label: l.wikidata_id ? `${l.label} (${l.wikidata_id})` : l.label,
}));
const gameOptions = allGames.map((g) => ({ value: g.id, label: g.name }));
const langOptions = [
  { value: '', label: '— none —' },
  ...ProductLangEnum.options.map((l) => ({ value: l, label: l })),
];
const referenceTypeOptions = [
  { value: 'official', label: 'Official' },
  { value: 'source', label: 'Source' },
  { value: 'review', label: 'Review' },
  { value: 'social', label: 'Social' },
];

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
    window.location.href = '/admin/games?success=saved';
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Network error';
  }
}

// biome-ignore lint/style/useConst: Svelte $state requires let for reactivity
let nameValue = $state(game?.name ?? '');
let slugValue = $state(game?.slug ?? '');
let slugManuallyEdited = $state(!!game);
let lastAutoSlug = $state(game?.slug ?? '');

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
  const formEl = document.getElementById('game-form');
  if (formEl) formEl.dataset.initialized = 'true';
});
</script>

<div class="game-form">
  {#if errorMessage}
    <div class="error-banner" role="alert">
      {errorMessage}
    </div>
  {/if}

  <Form
    schema={GameFormCreateSchema}
    {initialValues}
    onSubmit={handleSubmit}
    id="game-form"
    class="admin-form"
  >
    <div class="form-grid">
      <Input name="name" label="Name" required bind:value={nameValue} />
      <Input name="slug" label="Slug" required bind:value={slugValue} />
    </div>

    <div class="form-grid">
      <Combobox
        name="publisher_id"
        label="Publisher"
        options={publisherOptions}
        placeholder="Select publisher..."
      />
      <Select
        name="in_language"
        label="Language"
        options={langOptions}
      />
    </div>

    <div class="form-grid">
      <Input name="number_of_players" label="Number of Players" placeholder="e.g. 2-6" />
      <Input name="url" label="Official Website URL" type="url" placeholder="https://..." />
    </div>

    <div class="form-grid">
      <Input name="image_url" label="Image URL" type="url" placeholder="https://..." />
      <Input name="license" label="License" placeholder="e.g. CC BY 4.0" />
    </div>

    <Textarea name="description" label="Description" />

    <!-- Creators Section -->
    <div class="section">
      <ArrayField
        name="creators"
        label="Creators"
        itemDefault={{ creator_id: '', role: '' }}
      >
        {#snippet children({ items, add, remove, canAdd, canRemove })}
          <div id="creators-list">
            {#each items as item, i}
              <div class="array-row" data-array-field-item>
                <Combobox
                  name={`creators.${i}.creator_id`}
                  label=""
                  options={creatorOptions}
                  placeholder="Select Creator..."
                  bind:value={item.creator_id}
                  class="creator-select"
                />
                <input
                  class="input creator-role"
                  bind:value={item.role}
                  type="text"
                  placeholder="Role (e.g. Designer)"
                />
                <button
                  type="button"
                  class="btn-icon-remove"
                  onclick={() => remove(i)}
                  disabled={!canRemove}
                  aria-label={`Remove creator ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            class="btn-secondary"
            onclick={add}
            disabled={!canAdd}
            data-array-field-add
          >
            + Add Creator
          </button>
        {/snippet}
      </ArrayField>
    </div>

    <!-- Labels Section -->
    <div class="section">
      <ArrayField
        name="labels"
        label="Semantic Labels"
        itemDefault={{ label_id: '' }}
      >
        {#snippet children({ items, add, remove, canAdd, canRemove })}
          <div id="labels-list">
            {#each items as item, i}
              <div class="array-row" data-array-field-item>
                <Combobox
                  name={`labels.${i}.label_id`}
                  label=""
                  options={labelOptions}
                  placeholder="Select Label..."
                  bind:value={item.label_id}
                  class="label-select"
                />
                <button
                  type="button"
                  class="btn-icon-remove"
                  onclick={() => remove(i)}
                  disabled={!canRemove}
                  aria-label={`Remove label ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            class="btn-secondary"
            onclick={add}
            disabled={!canAdd}
            data-array-field-add
          >
            + Add Label
          </button>
        {/snippet}
      </ArrayField>
    </div>

    <!-- References Section -->
    <div class="section">
      <ArrayField
        name="references"
        label="References"
        itemDefault={{ reference_type: 'official', label: '', url: '' }}
      >
        {#snippet children({ items, add, remove, canAdd, canRemove })}
          <div id="references-list">
            {#each items as item, i}
              <div class="array-row" data-array-field-item>
                <select class="reference-type-select" bind:value={item.reference_type}>
                  {#each referenceTypeOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
                <input
                  class="input reference-label"
                  bind:value={item.label}
                  type="text"
                  placeholder="Label (e.g. Website)"
                />
                <input
                  class="input reference-url"
                  bind:value={item.url}
                  type="url"
                  placeholder="URL"
                />
                <button
                  type="button"
                  class="btn-icon-remove"
                  onclick={() => remove(i)}
                  disabled={!canRemove}
                  aria-label={`Remove reference ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            class="btn-secondary"
            onclick={add}
            disabled={!canAdd}
            data-array-field-add
          >
            + Add Reference
          </button>
        {/snippet}
      </ArrayField>
    </div>

    <!-- Based On Section -->
    <div class="section">
      <ArrayField
        name="basedOn"
        label="Based On"
        itemDefault={{ based_on_game_id: null, based_on_url: null, label: '', _sourceType: 'game' }}
      >
        {#snippet children({ items, add, remove, canAdd, canRemove })}
          <div id="based-on-list">
            {#each items as item, i}
              <div class="based-on-row" data-array-field-item>
                <select
                  class="source-type-select"
                  bind:value={item._sourceType}
                  onchange={() => {
                    if (item._sourceType === 'game') {
                      item.based_on_url = null;
                    } else {
                      item.based_on_game_id = null;
                    }
                  }}
                >
                  <option value="game">Internal Game</option>
                  <option value="url">External URL</option>
                </select>
                {#if item._sourceType === 'url'}
                  <input
                    class="input based-on-url"
                    bind:value={item.based_on_url}
                    type="url"
                    placeholder="External URL"
                  />
                {:else}
                  <Combobox
                    name={`basedOn.${i}.based_on_game_id`}
                    label=""
                    options={gameOptions}
                    placeholder="Select game..."
                    bind:value={item.based_on_game_id}
                    class="based-on-game-select"
                  />
                {/if}
                <input
                  class="input based-on-label"
                  bind:value={item.label}
                  type="text"
                  placeholder="Display name (e.g. Mörk Borg)"
                />
                <button
                  type="button"
                  class="btn-icon-remove"
                  onclick={() => remove(i)}
                  disabled={!canRemove}
                  aria-label={`Remove based-on ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            class="btn-secondary"
            onclick={add}
            disabled={!canAdd}
            data-array-field-add
          >
            + Add Based On
          </button>
        {/snippet}
      </ArrayField>
    </div>

    <div class="form-actions">
      <a href="/admin/games" class="btn-cancel">Cancel</a>
      <button type="submit" class="btn-save">Save Game</button>
    </div>
  </Form>
</div>

<style>
  .game-form {
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

  .section {
    margin: var(--kide-space-6) 0;
    padding: var(--kide-space-4);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-md);
    background: var(--kide-paper);
  }

  .array-row,
  .based-on-row {
    display: flex;
    gap: var(--kide-space-2);
    margin-bottom: var(--kide-space-2);
    align-items: center;
  }

  .reference-type-select,
  .source-type-select {
    padding: var(--kide-space-1) var(--kide-space-2);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-sm);
    font-family: inherit;
    font-size: 1rem;
    background: var(--kide-surface);
    height: var(--kide-control-height-md);
    flex: 1;
  }

  :global(.creator-select),
  :global(.based-on-game-select) {
    flex: 2;
  }

  :global(.label-select) {
    flex: 1;
  }

  .creator-role {
    flex: 1;
  }

  .reference-label {
    flex: 2;
  }

  .reference-url {
    flex: 3;
  }

  .based-on-url {
    flex: 2;
  }

  .based-on-label {
    flex: 2;
  }

  .btn-secondary {
    background: transparent;
    border: 1px dashed var(--kide-border-subtle);
    color: var(--kide-ice-deep);
    padding: var(--kide-space-2) var(--kide-space-4);
    cursor: pointer;
    border-radius: var(--kide-radius-sm);
    font-size: 0.9rem;
    margin-top: var(--kide-space-2);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--kide-ice-light);
    border-color: var(--kide-ice-mid);
    color: var(--kide-ice-deep);
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon-remove {
    background: var(--kide-danger-bg);
    color: var(--kide-danger);
    border: none;
    width: 40px;
    min-width: 40px;
    height: var(--kide-control-height-md);
    cursor: pointer;
    border-radius: var(--kide-radius-sm);
    font-size: 1.25rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-icon-remove:hover:not(:disabled) {
    background: var(--kide-danger);
    color: var(--kide-surface);
  }

  .btn-icon-remove:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    gap: var(--kide-space-4);
    justify-content: flex-end;
    margin-top: var(--kide-space-6);
    padding-top: var(--kide-space-4);
    border-top: 1px solid var(--kide-border-subtle);
  }

  .btn-cancel {
    padding: var(--kide-space-2) var(--kide-space-4);
    background: var(--kide-surface);
    color: var(--kide-ink-primary);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-sm);
    text-decoration: none;
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-cancel:hover {
    border-color: var(--kide-ice-mid);
  }

  .btn-save {
    padding: var(--kide-space-2) var(--kide-space-4);
    background: var(--kide-ice-deep);
    color: var(--kide-surface);
    border: 1px solid var(--kide-ice-deep);
    border-radius: var(--kide-radius-sm);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
  }

  .btn-save:hover:not(:disabled) {
    background: var(--kide-ice-mid);
    border-color: var(--kide-ice-mid);
  }

  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
