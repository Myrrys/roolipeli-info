/**
 * Generates a URL-friendly slug from a string.
 * - Converts to lowercase
 * - Removes diacritics
 * - Replaces non-alphanumeric chars with dashes
 * - Trims dashes
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose combined chars
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces/symbols with dash
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes
}

/**
 * Sets up auto-generation of slug from a name input field.
 * Only updates the slug if the user hasn't manually edited it (checked via dataset.touched).
 */
export function setupAutoSlug(nameSelector: string, slugSelector: string) {
  const nameInput = document.querySelector(nameSelector) as HTMLInputElement;
  const slugInput = document.querySelector(slugSelector) as HTMLInputElement;

  if (!nameInput || !slugInput) return;

  nameInput.addEventListener('input', () => {
    if (!slugInput.value || slugInput.dataset.touched !== 'true') {
      slugInput.value = generateSlug(nameInput.value);
    }
  });

  slugInput.addEventListener('input', () => {
    slugInput.dataset.touched = 'true';
  });
}
