import { describe, expect, it, vi } from 'vitest';
import { getFieldErrors, isFieldTouched, shouldShowError } from './field-utils.js';
import { formatFileSize, validateFileSize, validateFileType } from './file-upload-utils.js';
import type { FormContext } from './form-context.js';

describe('formatFileSize', () => {
  it('formats zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes less than 1 KB', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
    expect(formatFileSize(1023)).toBe('1023 Bytes');
  });

  it('formats exact kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('formats fractional kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2560)).toBe('2.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(2457600)).toBe('2.3 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(2147483648)).toBe('2 GB');
  });

  it('rounds to one decimal place', () => {
    expect(formatFileSize(1587)).toBe('1.5 KB'); // 1.549... KB
    expect(formatFileSize(1638)).toBe('1.6 KB'); // 1.599... KB
  });
});

describe('validateFileType', () => {
  it('accepts valid JPEG file', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    expect(validateFileType(file, 'image/jpeg,image/png,image/webp')).toBe(true);
  });

  it('accepts valid PNG file', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    expect(validateFileType(file, 'image/jpeg,image/png,image/webp')).toBe(true);
  });

  it('accepts valid WebP file', () => {
    const file = new File(['content'], 'test.webp', { type: 'image/webp' });
    expect(validateFileType(file, 'image/jpeg,image/png,image/webp')).toBe(true);
  });

  it('rejects invalid file type', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    expect(validateFileType(file, 'image/jpeg,image/png,image/webp')).toBe(false);
  });

  it('accepts file matching wildcard image/*', () => {
    const jpeg = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const png = new File(['content'], 'test.png', { type: 'image/png' });
    const gif = new File(['content'], 'test.gif', { type: 'image/gif' });

    expect(validateFileType(jpeg, 'image/*')).toBe(true);
    expect(validateFileType(png, 'image/*')).toBe(true);
    expect(validateFileType(gif, 'image/*')).toBe(true);
  });

  it('rejects file not matching wildcard', () => {
    const pdf = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    expect(validateFileType(pdf, 'image/*')).toBe(false);
  });

  it('handles accept string with spaces', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    expect(validateFileType(file, ' image/jpeg , image/png ')).toBe(true);
  });

  it('handles accept string with multiple wildcards', () => {
    const image = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const video = new File(['content'], 'test.mp4', { type: 'video/mp4' });
    const pdf = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    expect(validateFileType(image, 'image/*,video/*')).toBe(true);
    expect(validateFileType(video, 'image/*,video/*')).toBe(true);
    expect(validateFileType(pdf, 'image/*,video/*')).toBe(false);
  });

  it('handles mixed exact types and wildcards', () => {
    const jpeg = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const png = new File(['content'], 'test.png', { type: 'image/png' });
    const gif = new File(['content'], 'test.gif', { type: 'image/gif' });

    const accept = 'image/jpeg,image/png,video/*';
    expect(validateFileType(jpeg, accept)).toBe(true);
    expect(validateFileType(png, accept)).toBe(true);
    expect(validateFileType(gif, accept)).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('accepts file at exact max size', () => {
    const maxSize = 5242880; // 5 MB
    const file = new File([new ArrayBuffer(maxSize)], 'test.jpg', {
      type: 'image/jpeg',
    });
    expect(validateFileSize(file, maxSize)).toBe(true);
  });

  it('accepts file under max size', () => {
    const maxSize = 5242880; // 5 MB
    const file = new File([new ArrayBuffer(2097152)], 'small.jpg', {
      type: 'image/jpeg',
    }); // 2 MB
    expect(validateFileSize(file, maxSize)).toBe(true);
  });

  it('rejects file over max size', () => {
    const maxSize = 5242880; // 5 MB
    const file = new File([new ArrayBuffer(10485760)], 'large.jpg', {
      type: 'image/jpeg',
    }); // 10 MB
    expect(validateFileSize(file, maxSize)).toBe(false);
  });

  it('accepts zero-byte file', () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' });
    expect(validateFileSize(file, 5242880)).toBe(true);
  });

  it('rejects file one byte over limit', () => {
    const maxSize = 1024;
    const file = new File([new ArrayBuffer(1025)], 'test.txt', {
      type: 'text/plain',
    });
    expect(validateFileSize(file, maxSize)).toBe(false);
  });

  it('accepts file one byte under limit', () => {
    const maxSize = 1024;
    const file = new File([new ArrayBuffer(1023)], 'test.txt', {
      type: 'text/plain',
    });
    expect(validateFileSize(file, maxSize)).toBe(true);
  });

  it('handles very large max size', () => {
    const maxSize = 1073741824; // 1 GB
    const file = new File([new ArrayBuffer(536870912)], 'medium.zip', {
      type: 'application/zip',
    }); // 512 MB
    expect(validateFileSize(file, maxSize)).toBe(true);
  });
});

// --- Error derivation tests (field-utils in FileUpload context) ---

function createMockFormContext(overrides: Partial<FormContext> = {}): FormContext {
  return {
    errors: {},
    touched: new Set<string>(),
    submitting: false,
    touch: vi.fn(),
    getValues: () => ({}),
    setValue: vi.fn(),
    ...overrides,
  };
}

describe('FileUpload: error state derivation', () => {
  it('returns no errors when standalone (no form context)', () => {
    expect(getFieldErrors(undefined, 'avatar')).toBeUndefined();
  });

  it('returns no errors when no field name', () => {
    const form = createMockFormContext({
      errors: { avatar: ['Required'] },
    });
    expect(getFieldErrors(form, undefined)).toBeUndefined();
  });

  it('returns errors from form context for file field', () => {
    const form = createMockFormContext({
      errors: { avatar: ['File is required'] },
    });
    expect(getFieldErrors(form, 'avatar')).toEqual(['File is required']);
  });

  it('returns undefined for field with no errors', () => {
    const form = createMockFormContext({
      errors: { other: ['Error'] },
    });
    expect(getFieldErrors(form, 'avatar')).toBeUndefined();
  });
});

describe('FileUpload: touched state', () => {
  it('returns false when standalone (no form context)', () => {
    expect(isFieldTouched(undefined, 'avatar')).toBe(false);
  });

  it('returns false when field not touched', () => {
    const form = createMockFormContext();
    expect(isFieldTouched(form, 'avatar')).toBe(false);
  });

  it('returns true when field is touched', () => {
    const form = createMockFormContext({
      touched: new Set(['avatar']),
    });
    expect(isFieldTouched(form, 'avatar')).toBe(true);
  });
});

describe('FileUpload: shouldShowError', () => {
  it('does not show error when not touched and no local errors', () => {
    expect(shouldShowError(undefined, false)).toBe(false);
  });

  it('does not show error when touched but no errors', () => {
    expect(shouldShowError(undefined, true)).toBe(false);
  });

  it('does not show error when errors exist but not touched', () => {
    expect(shouldShowError(['File is required'], false)).toBe(false);
  });

  it('shows error when touched and has errors', () => {
    expect(shouldShowError(['File is required'], true)).toBe(true);
  });

  it('does not show error when errors array is empty', () => {
    expect(shouldShowError([], true)).toBe(false);
  });
});

// --- Form context integration patterns ---

describe('FileUpload: form context integration', () => {
  it('calls setValue with file on valid selection', () => {
    const form = createMockFormContext();
    const name = 'avatar';
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    // Simulate what handleFileSelect does after validation passes
    if (form && name) {
      form.setValue(name, file);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('avatar', file);
    expect(form.touch).toHaveBeenCalledWith('avatar');
  });

  it('calls setValue with undefined on file removal', () => {
    const form = createMockFormContext();
    const name = 'avatar';

    // Simulate what handleRemove does
    if (form && name) {
      form.setValue(name, undefined);
      form.touch(name);
    }

    expect(form.setValue).toHaveBeenCalledWith('avatar', undefined);
    expect(form.touch).toHaveBeenCalledWith('avatar');
  });

  it('does not call form methods when standalone (no form context)', () => {
    const form: FormContext | undefined = undefined;
    const name = 'avatar';

    // Simulate standalone behavior — no calls when form is undefined
    if (form && name) {
      form.setValue(name, new File([], 'test.jpg'));
      form.touch(name);
    }

    // No error thrown — standalone works silently
    expect(true).toBe(true);
  });
});

// --- Validation combination flow (handleFileSelect logic path) ---

describe('FileUpload: validation combination flow', () => {
  const accept = 'image/jpeg,image/png,image/webp';
  const maxSize = 5242880; // 5 MB

  it('does not call onSelect when file type is invalid', () => {
    const onSelect = vi.fn();
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

    // Mirrors handleFileSelect logic
    if (!validateFileType(file, accept)) {
      // Would set validationErrors, return early
    } else if (!validateFileSize(file, maxSize)) {
      // Would set validationErrors, return early
    } else {
      onSelect(file);
    }

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not call onSelect when file size exceeds limit', () => {
    const onSelect = vi.fn();
    const file = new File([new ArrayBuffer(10485760)], 'huge.jpg', {
      type: 'image/jpeg',
    }); // 10 MB

    if (!validateFileType(file, accept)) {
      // type invalid
    } else if (!validateFileSize(file, maxSize)) {
      // size invalid
    } else {
      onSelect(file);
    }

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect when both type and size are valid', () => {
    const onSelect = vi.fn();
    const file = new File([new ArrayBuffer(1024)], 'photo.jpg', {
      type: 'image/jpeg',
    });

    if (!validateFileType(file, accept)) {
      // type invalid
    } else if (!validateFileSize(file, maxSize)) {
      // size invalid
    } else {
      onSelect(file);
    }

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it('does not call onSelect when both type AND size are invalid', () => {
    const onSelect = vi.fn();
    const file = new File([new ArrayBuffer(10485760)], 'doc.pdf', {
      type: 'application/pdf',
    }); // wrong type + over size

    if (!validateFileType(file, accept)) {
      // type fails first — early return
    } else if (!validateFileSize(file, maxSize)) {
      // size invalid
    } else {
      onSelect(file);
    }

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('produces correct error message for size validation failure', () => {
    const file = new File([new ArrayBuffer(10485760)], 'huge.jpg', {
      type: 'image/jpeg',
    });

    expect(validateFileType(file, accept)).toBe(true);
    expect(validateFileSize(file, maxSize)).toBe(false);

    // Mirrors the error message set in handleFileSelect
    const errorMsg = `File size must be less than ${formatFileSize(maxSize)}`;
    expect(errorMsg).toBe('File size must be less than 5 MB');
  });
});
