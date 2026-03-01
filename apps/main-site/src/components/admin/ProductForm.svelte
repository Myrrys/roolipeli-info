<script lang="ts">
import { ProductFormCreateSchema, ProductLangEnum, ProductTypeEnum } from '@roolipeli/database';
import ArrayField from '@roolipeli/design-system/components/ArrayField.svelte';
import Combobox from '@roolipeli/design-system/components/Combobox.svelte';
import FileUpload from '@roolipeli/design-system/components/FileUpload.svelte';
import Form from '@roolipeli/design-system/components/Form.svelte';
import Input from '@roolipeli/design-system/components/Input.svelte';
import Select from '@roolipeli/design-system/components/Select.svelte';
import Textarea from '@roolipeli/design-system/components/Textarea.svelte';
import { onMount, tick, untrack } from 'svelte';
import { generateSlug } from '../../lib/slug.client';
import ReferenceFormRows from './ReferenceFormRows.svelte';

/**
 * Props for the ProductForm component.
 * All data is fetched server-side in Astro and passed as props.
 */
interface Props {
  product?: {
    id?: string;
    title: string;
    slug: string;
    publisher_id?: string | null;
    game_id?: string | null;
    product_type: string;
    year?: number | null;
    isbn?: string | null;
    description?: string | null;
    lang: string;
    cover_image_path?: string | null;
    creators?: { creator_id: string; role: string }[];
    labels?: { label_id: string }[];
    references?: {
      reference_type: string;
      label: string;
      url: string;
    }[];
    isbns?: { isbn: string; label: string | null }[];
  };
  publishers: Array<{ id: string; name: string }>;
  creators: Array<{ id: string; name: string }>;
  games?: Array<{ id: string; name: string }>;
  labels?: Array<{
    id: string;
    label: string;
    wikidata_id?: string | null;
  }>;
  submitUrl: string;
  method?: 'POST' | 'PUT';
  coverUrl?: string;
}

const {
  product,
  publishers,
  creators,
  labels = [],
  games = [],
  submitUrl,
  method = 'POST',
  coverUrl,
}: Props = $props();

// Form initial values — flat structure matching ProductFormCreateSchema
const initialValues: Record<string, unknown> = product
  ? {
      title: product.title,
      slug: product.slug,
      publisher_id: product.publisher_id ?? '',
      game_id: product.game_id ?? '',
      product_type: product.product_type,
      year: product.year ?? null,
      description: product.description ?? '',
      lang: product.lang,
      creators: product.creators ?? [],
      labels: product.labels ?? [],
      references: product.references ?? [],
      isbns: product.isbns ?? [],
    }
  : {
      title: '',
      slug: '',
      publisher_id: '',
      game_id: '',
      product_type: 'Other',
      year: null,
      description: '',
      lang: 'fi',
      creators: [],
      labels: [],
      references: [],
      isbns: [],
    };

// Cover image state (managed outside Zod schema)
// biome-ignore lint/style/useConst: Svelte $state requires let for reassignment in template
let coverFile = $state<File | null>(null);
// biome-ignore lint/style/useConst: Svelte $state requires let for reassignment in template
let shouldRemoveCover = $state(false);
let coverLoading = $state(false);
let errorMessage = $state('');

// Existing cover URL for FileUpload preview
const existingCoverUrl = $derived.by(() => {
  if (shouldRemoveCover) return undefined;
  return coverUrl;
});

// Dropdown options
const publisherOptions = publishers.map((p) => ({
  value: p.id,
  label: p.name,
}));
const creatorOptions = creators.map((c) => ({
  value: c.id,
  label: c.name,
}));
const labelOptions = labels.map((l) => ({
  value: l.id,
  label: l.wikidata_id ? `${l.label} (${l.wikidata_id})` : l.label,
}));
const gameOptions = games.map((g) => ({
  value: g.id,
  label: g.name,
}));
const productTypeOptions = ProductTypeEnum.options.map((t) => ({
  value: t,
  label: t,
}));
const langOptions = ProductLangEnum.options.map((l) => ({
  value: l,
  label: l,
}));
/**
 * Handles form submission with cover image upload and API call.
 * Called by Form.svelte after successful Zod validation.
 */
async function handleSubmit(data: Record<string, unknown>): Promise<void> {
  errorMessage = '';

  // Extract product ID from URL for cover operations
  const productIdMatch = submitUrl.match(/\/products\/([^/]+)$/);
  const existingProductId = productIdMatch?.[1];

  try {
    // EDIT MODE: Handle cover operations, then submit form data
    if (method === 'PUT' && existingProductId) {
      coverLoading = true;

      // Remove cover if requested
      if (shouldRemoveCover && product?.cover_image_path) {
        const delRes = await fetch(`/api/admin/products/${existingProductId}/cover`, {
          method: 'DELETE',
        });
        if (!delRes.ok) {
          const result = await delRes.json();
          errorMessage = `Failed to remove cover: ${result.error || 'Unknown error'}`;
          coverLoading = false;
          return;
        }
      }

      // Upload new cover
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        const upRes = await fetch(`/api/admin/products/${existingProductId}/cover`, {
          method: 'POST',
          body: formData,
        });
        if (!upRes.ok) {
          const result = await upRes.json();
          errorMessage = `Upload failed: ${result.error || 'Unknown error'}`;
          coverLoading = false;
          return;
        }
      }

      coverLoading = false;

      // Build payload WITHOUT cover_image_path (managed by cover API)
      const payload = { ...data };

      // Submit to API
      const res = await fetch(submitUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        errorMessage = result.error || 'Unknown error occurred';
        return;
      }

      // Redirect on success
      window.location.href = '/admin/products?success=saved';
    }
    // CREATE MODE: Submit form data first, then upload cover
    else if (method === 'POST') {
      // Build payload WITHOUT cover_image_path
      const payload = { ...data };

      // Submit to API
      const res = await fetch(submitUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        errorMessage = result.error || 'Unknown error occurred';
        return;
      }

      const result = await res.json();

      // Upload cover after getting product ID
      if (coverFile && result.id) {
        coverLoading = true;
        const formData = new FormData();
        formData.append('file', coverFile);
        const upRes = await fetch(`/api/admin/products/${result.id}/cover`, {
          method: 'POST',
          body: formData,
        });
        if (!upRes.ok) {
          const upResult = await upRes.json();
          errorMessage = `Product saved but cover upload failed: ${upResult.error || 'Unknown error'}`;
          coverLoading = false;
          return;
        }
        coverLoading = false;
      }

      // Redirect on success
      window.location.href = '/admin/products?success=saved';
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    errorMessage = message;
    coverLoading = false;
  }
}

// Auto-slug: reactive Svelte state
// biome-ignore lint/style/useConst: Svelte $state requires let for reactivity
let titleValue = $state(product?.title ?? '');
let slugValue = $state(product?.slug ?? '');
let slugManuallyEdited = $state(!!product);
let lastAutoSlug = $state(product?.slug ?? '');

/** Auto-generate slug from title unless manually edited. */
$effect(() => {
  const title = titleValue;
  untrack(() => {
    if (!slugManuallyEdited) {
      const newSlug = generateSlug(title);
      lastAutoSlug = newSlug;
      slugValue = newSlug;
      // After Svelte renders the new slug value, sync with Form context
      // via Input.svelte's handleInput (which calls form.setValue internally)
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
  // Signal initialization for E2E tests
  const formEl = document.getElementById('product-form');
  if (formEl) formEl.dataset.initialized = 'true';
});
</script>

<div class="product-form">
	{#if errorMessage}
		<div class="error-banner" role="alert">
			{errorMessage}
		</div>
	{/if}

	<Form
		schema={ProductFormCreateSchema}
		{initialValues}
		onSubmit={handleSubmit}
		id="product-form"
		class="admin-form"
	>
		<div class="form-grid">
			<Input name="title" label="Title" required bind:value={titleValue} />
			<Input name="slug" label="Slug" required bind:value={slugValue} />
		</div>

		<!-- Cover Image (outside Zod schema) -->
		<div class="form-group">
			<FileUpload
				name="cover-upload"
				label="Cover Image"
				value={existingCoverUrl}
				loading={coverLoading}
				onSelect={(file) => {
					coverFile = file;
					shouldRemoveCover = false;
				}}
				onRemove={() => {
					coverFile = null;
					shouldRemoveCover = true;
				}}
			/>
		</div>

		<div class="form-grid">
			<Combobox
				name="publisher_id"
				label="Publisher"
				options={publisherOptions}
				placeholder="Select publisher..."
			/>
			<Select
				name="product_type"
				label="Type"
				options={productTypeOptions}
				required
			/>
		</div>

		<div class="form-grid">
			<Combobox
				name="game_id"
				label="Game"
				options={gameOptions}
				placeholder="Select game..."
			/>
		</div>

		<div class="form-grid">
			<Input name="year" label="Year" type="number" />
			<Select
				name="lang"
				label="Language"
				options={langOptions}
				required
			/>
		</div>

		<Textarea name="description" label="Description" />

		<!-- ISBNs Section -->
		<div class="isbns-section">
			<ArrayField
				name="isbns"
				label="ISBNs"
				itemDefault={{ isbn: '', label: '' }}
			>
				{#snippet children({ items, add, remove, canAdd, canRemove })}
					<div id="isbns-list">
						{#each items as item, i}
							<div class="isbn-row" data-array-field-item>
								<input
									class="input isbn-input"
									bind:value={item.isbn}
									placeholder="ISBN (e.g. 978-...)"
								/>
								<input
									class="input isbn-label"
									bind:value={item.label}
									placeholder="Label (e.g. PDF)"
								/>
								<button
									type="button"
									class="btn-icon-remove"
									onclick={() => remove(i)}
									disabled={!canRemove}
									aria-label={`Remove ISBN ${i + 1}`}
								>
									&times;
								</button>
							</div>
						{/each}
					</div>
					<button
						type="button"
						id="add-isbn-btn"
						class="btn-secondary"
						onclick={add}
						disabled={!canAdd}
						data-array-field-add
					>
						+ Add ISBN
					</button>
				{/snippet}
			</ArrayField>
		</div>

		<!-- Creators Section -->
		<div class="creators-section">
			<ArrayField
				name="creators"
				label="Creators"
				itemDefault={{ creator_id: '', role: '' }}
			>
				{#snippet children({ items, add, remove, canAdd, canRemove })}
					<div id="creators-list">
						{#each items as item, i}
							<div class="creator-row" data-array-field-item>
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
									placeholder="Role (e.g. Author)"
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
						id="add-creator-btn"
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
		<div class="labels-section">
			<ArrayField
				name="labels"
				label="Semantic Labels"
				itemDefault={{ label_id: '' }}
			>
				{#snippet children({ items, add, remove, canAdd, canRemove })}
					<div id="labels-list">
						{#each items as item, i}
							<div class="label-row" data-array-field-item>
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
						id="add-label-btn"
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
			<a href="/admin/products" class="btn-cancel">Cancel</a>
			<button type="submit" class="btn-save">Save Product</button>
		</div>
	</Form>
</div>

<style>
	.product-form {
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

	.form-group {
		margin-bottom: var(--kide-space-4);
	}

	h3 {
		margin-top: 0;
		margin-bottom: var(--kide-space-4);
		font-size: 1.1rem;
		font-weight: 600;
	}

	/* Array sections */
	.isbns-section,
	.creators-section,
	.labels-section,
	.references-section {
		margin: var(--kide-space-6) 0;
		padding: var(--kide-space-4);
		border: 1px solid var(--kide-border-subtle);
		border-radius: var(--kide-radius-md);
		background: var(--kide-paper);
	}

	/* Array rows */
	.creator-row,
	.label-row,
	.isbn-row {
		display: flex;
		gap: var(--kide-space-2);
		margin-bottom: var(--kide-space-2);
		align-items: center;
	}

	:global(.creator-select) {
		flex: 2;
	}

	:global(.label-select) {
		flex: 1;
	}

	.creator-role {
		flex: 1;
	}

	.isbn-input {
		flex: 2;
	}

	.isbn-label {
		flex: 1;
	}

	/* Buttons */
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

	/* Form actions */
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
