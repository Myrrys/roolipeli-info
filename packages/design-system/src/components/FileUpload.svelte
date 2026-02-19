<script lang="ts">
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { formatFileSize, validateFileSize, validateFileType } from './file-upload-utils.js';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';
import Label from './Label.svelte';

/**
 * FileUpload component props
 * @property {string} name - Form field name
 * @property {string} label - Label text
 * @property {string} [accept] - Comma-separated MIME types
 * @property {number} [maxSize] - Maximum file size in bytes
 * @property {string} [value] - Existing file URL (for edit mode)
 * @property {boolean} [loading] - Show loading overlay
 * @property {boolean} [required] - Mark as required field
 * @property {boolean} [disabled] - Disable the input
 * @property {string} [class] - Additional CSS classes
 * @property {(file: File) => void} [onSelect] - Called when valid file is selected
 * @property {() => void} [onRemove] - Called when remove button is clicked
 */
interface Props {
  name: string;
  label: string;
  accept?: string;
  maxSize?: number;
  value?: string;
  loading?: boolean;
  required?: boolean;
  disabled?: boolean;
  class?: string;
  onSelect?: (file: File) => void;
  onRemove?: () => void;
}

const {
  name,
  label,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5242880,
  value = undefined,
  loading = false,
  required = false,
  disabled = false,
  class: className = '',
  onSelect,
  onRemove,
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let fileInput: HTMLInputElement | undefined = $state();
let selectedFile: File | undefined = $state();
let previewUrl: string | undefined = $state(value);
let isDragOver = $state(false);
let validationErrors: string[] = $state([]);

// Initialize from form context
let initialized = false;
$effect.pre(() => {
  if (initialized) return;
  initialized = true;
  if (form && name) {
    const formValues = form.getValues();
    if (formValues[name] && typeof formValues[name] === 'string') {
      previewUrl = formValues[name];
    }
  }
});

// Reactive error state (merge form errors + local validation errors)
const formErrors = $derived(name && form ? (form.errors[name] ?? []) : []);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const allErrors = $derived(validationErrors.length > 0 ? validationErrors : formErrors);
const hasError = $derived((isTouched || validationErrors.length > 0) && allErrors.length > 0);

// Cleanup preview URL on unmount or when changed
$effect(() => {
  return () => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };
});

function handleFileSelect(file: File): void {
  validationErrors = [];

  if (!validateFileType(file, accept)) {
    validationErrors = ['File type not accepted'];
    return;
  }

  if (!validateFileSize(file, maxSize)) {
    validationErrors = [`File size must be less than ${formatFileSize(maxSize)}`];
    return;
  }

  // Revoke old preview URL
  if (previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }

  selectedFile = file;

  // Create preview for images
  if (file.type.startsWith('image/')) {
    previewUrl = URL.createObjectURL(file);
  } else {
    previewUrl = undefined;
  }

  // Update form context
  if (form && name) {
    form.setValue(name, file);
    form.touch(name);
  }

  // Call parent callback
  onSelect?.(file);
}

function handleInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    handleFileSelect(file);
  }
}

function handleDragEnter(event: DragEvent): void {
  event.preventDefault();
  if (!disabled) {
    isDragOver = true;
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault();
  isDragOver = false;
}

function handleDrop(event: DragEvent): void {
  event.preventDefault();
  isDragOver = false;

  if (disabled) return;

  const file = event.dataTransfer?.files[0];
  if (file) {
    handleFileSelect(file);
  }
}

function handleDropzoneClick(): void {
  if (!disabled) {
    fileInput?.click();
  }
}

function handleRemove(): void {
  // Revoke preview URL
  if (previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }

  selectedFile = undefined;
  previewUrl = undefined;
  validationErrors = [];

  // Clear file input
  if (fileInput) {
    fileInput.value = '';
  }

  // Update form context
  if (form && name) {
    form.setValue(name, undefined);
    form.touch(name);
  }

  // Call parent callback
  onRemove?.();
}

const hasFile = $derived(selectedFile !== undefined || previewUrl !== undefined);
</script>

<div class="form-group {className}">
	<Label for={name} {required}>{label}</Label>

	<div class="file-upload">
		{#if !hasFile}
			<div
				class="file-upload__dropzone"
				class:file-upload__dropzone--active={isDragOver}
				class:error={hasError}
				role="button"
				tabindex={disabled ? -1 : 0}
				aria-invalid={hasError ? "true" : undefined}
				aria-describedby={name ? `${name}-error` : undefined}
				ondragenter={handleDragEnter}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
				onclick={handleDropzoneClick}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleDropzoneClick();
					}
				}}
			>
				<svg
					class="file-upload__icon"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<p class="file-upload__text">
					{#if isDragOver}
						Drop file here
					{:else}
						Drag and drop a file, or click to browse
					{/if}
				</p>
				<p class="file-upload__hint">
					Accepted: {accept.split(',').join(', ')} · Max size: {formatFileSize(maxSize)}
				</p>
			</div>
		{:else}
			<div class="file-upload__preview">
				{#if previewUrl}
					<img src={previewUrl} alt="Preview" class="file-upload__image" />
				{/if}

				<div class="file-upload__info">
					<p class="file-upload__filename">
						{selectedFile?.name || 'Existing file'}
					</p>
					{#if selectedFile}
						<p class="file-upload__filesize">
							{formatFileSize(selectedFile.size)}
						</p>
					{/if}
				</div>

				<button
					type="button"
					class="file-upload__remove"
					onclick={handleRemove}
					disabled={disabled || loading}
					aria-label="Remove file"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
		{/if}

		<input
			bind:this={fileInput}
			type="file"
			id={name}
			{name}
			{accept}
			{required}
			{disabled}
			class="file-upload__input"
			onchange={handleInputChange}
			aria-invalid={hasError ? "true" : undefined}
			aria-describedby={hasError ? `${name}-error` : undefined}
		/>

		{#if loading}
			<div class="file-upload__loading">
				<div class="file-upload__spinner"></div>
			</div>
		{/if}
	</div>

	{#if name}
		<FormError {name} errors={validationErrors.length > 0 ? validationErrors : undefined} />
	{/if}
</div>
