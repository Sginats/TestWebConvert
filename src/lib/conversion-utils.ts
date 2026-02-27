// Client-side copy of pricing logic for UI estimation

export function calculateTokenCost(
  fileSizeBytes: number,
  inputMime: string,
  outputMime: string,
): number {
  const fileMB = fileSizeBytes / (1024 * 1024);
  const sizeBonus = Math.ceil(fileMB / 5);
  const baseCost = 2 + sizeBonus;

  const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];
  const isImageConversion =
    imageTypes.includes(inputMime) && imageTypes.includes(outputMime);

  const multiplier = isImageConversion ? 1 : 2;
  return Math.max(1, Math.round(baseCost * multiplier));
}

export const ALLOWED_CONVERSIONS: Record<string, string[]> = {
  'image/png': ['image/jpeg', 'image/webp'],
  'image/jpeg': ['image/png', 'image/webp'],
  'image/webp': ['image/png', 'image/jpeg'],
  'application/pdf': ['text/plain'],
  'text/plain': ['application/pdf'],
};
