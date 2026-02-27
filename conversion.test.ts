import { describe, it, expect, vi } from 'vitest';
import { calculateTokenCost } from '../src/lib/pricing';
import { isConversionSupported, ALLOWED_MIME_TYPES } from '../src/lib/storage';

// Unit test the key logic used in the conversion endpoint

describe('isConversionSupported', () => {
  it('allows png to jpg', () => {
    expect(isConversionSupported('image/png', 'image/jpeg')).toBe(true);
  });

  it('allows txt to pdf', () => {
    expect(isConversionSupported('text/plain', 'application/pdf')).toBe(true);
  });

  it('allows pdf to txt', () => {
    expect(isConversionSupported('application/pdf', 'text/plain')).toBe(true);
  });

  it('disallows pdf to jpg', () => {
    expect(isConversionSupported('application/pdf', 'image/jpeg')).toBe(false);
  });

  it('disallows unknown mime types', () => {
    expect(isConversionSupported('video/mp4', 'audio/mpeg')).toBe(false);
  });

  it('disallows same format to same format', () => {
    expect(isConversionSupported('image/png', 'image/png')).toBe(false);
  });
});

describe('ALLOWED_MIME_TYPES whitelist', () => {
  it('contains expected types', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    expect(ALLOWED_MIME_TYPES).toContain('text/plain');
  });

  it('does not contain dangerous types', () => {
    expect(ALLOWED_MIME_TYPES).not.toContain('application/javascript');
    expect(ALLOWED_MIME_TYPES).not.toContain('text/html');
    expect(ALLOWED_MIME_TYPES).not.toContain('application/x-sh');
  });
});

describe('token cost for conversion endpoint', () => {
  it('image conversion 50MB should cost more than 1MB', () => {
    const small = calculateTokenCost(1 * 1024 * 1024, 'image/png', 'image/jpeg');
    const large = calculateTokenCost(50 * 1024 * 1024, 'image/png', 'image/jpeg');
    expect(large).toBeGreaterThan(small);
  });

  it('document conversion costs 2x image for same file', () => {
    const fileSize = 1024 * 1024; // 1MB
    const imageCost = calculateTokenCost(fileSize, 'image/png', 'image/jpeg');
    const docCost = calculateTokenCost(fileSize, 'text/plain', 'application/pdf');
    expect(docCost).toBe(imageCost * 2);
  });
});
