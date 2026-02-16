/**
 * File upload utility functions — extracted from FileUpload.svelte for unit testing.
 *
 * These functions perform validation and formatting logic for file uploads.
 * They mirror the logic used in FileUpload.svelte so they can be unit-tested
 * independently of the Svelte runtime.
 */

/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.4 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validate file type against accept string
 * @param {File} file - File to validate
 * @param {string} accept - Comma-separated MIME types
 * @returns {boolean} True if file type is accepted
 */
export function validateFileType(file: File, accept: string): boolean {
  const acceptedTypes = accept.split(',').map((type) => type.trim());
  return acceptedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(`${category}/`);
    }
    return file.type === type;
  });
}

/**
 * Validate file size against maximum
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum size in bytes
 * @returns {boolean} True if file size is within limit
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}
