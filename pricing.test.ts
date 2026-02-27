import { describe, it, expect } from 'vitest';
import { calculateTokenCost, getConversionCategory } from '../src/lib/pricing';

describe('getConversionCategory', () => {
  it('returns image for image->image', () => {
    expect(getConversionCategory('image/png', 'image/jpeg')).toBe('image');
    expect(getConversionCategory('image/jpeg', 'image/webp')).toBe('image');
  });

  it('returns document for pdf/txt conversions', () => {
    expect(getConversionCategory('application/pdf', 'text/plain')).toBe('document');
    expect(getConversionCategory('text/plain', 'application/pdf')).toBe('document');
  });
});

describe('calculateTokenCost', () => {
  it('returns base cost of 3 for tiny image conversions (100KB)', () => {
    // 100KB = 0.097MB, ceil(0.097/5)=1, base=2+1=3, x1 = 3
    const cost = calculateTokenCost(1024 * 100, 'image/png', 'image/jpeg');
    expect(cost).toBe(3);
  });

  it('document conversion multiplier is x2', () => {
    // tiny file: ceil(0/5)=0, base=2+0... but ceil(0.01/5)=1, so 2+1=3, x2 = 6
    const cost = calculateTokenCost(1024 * 10, 'text/plain', 'application/pdf'); // 10KB
    // 0.0095MB, ceil(0.0095/5)=1, base=3, x2=6
    expect(cost).toBe(6);
  });

  it('scales with file size', () => {
    const cost5mb = calculateTokenCost(5 * 1024 * 1024, 'image/png', 'image/jpeg');
    const cost10mb = calculateTokenCost(10 * 1024 * 1024, 'image/png', 'image/jpeg');
    expect(cost10mb).toBeGreaterThan(cost5mb);
  });

  it('never returns less than 1', () => {
    const cost = calculateTokenCost(0, 'image/png', 'image/jpeg');
    expect(cost).toBeGreaterThanOrEqual(1);
  });

  it('5MB file image: sizeBonus=1, base=3, x1=3', () => {
    const cost = calculateTokenCost(5 * 1024 * 1024, 'image/png', 'image/jpeg');
    // 5MB exactly: ceil(5/5)=1, base=2+1=3, x1=3
    expect(cost).toBe(3);
  });

  it('6MB file image: sizeBonus=2, base=4, x1=4', () => {
    const cost = calculateTokenCost(6 * 1024 * 1024, 'image/png', 'image/jpeg');
    // 6MB: ceil(6/5)=2, base=2+2=4, x1=4
    expect(cost).toBe(4);
  });

  it('6MB file document: x2 multiplier', () => {
    const cost = calculateTokenCost(6 * 1024 * 1024, 'text/plain', 'application/pdf');
    // ceil(6/5)=2, base=4, x2=8
    expect(cost).toBe(8);
  });
});
