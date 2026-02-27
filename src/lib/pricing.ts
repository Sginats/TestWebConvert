export type ConversionCategory = 'image' | 'document' | 'audio';

const MULTIPLIERS: Record<ConversionCategory, number> = {
  image: 1,
  document: 2,
  audio: 3,
};

export function getConversionCategory(inputMime: string, outputMime: string): ConversionCategory {
  const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
  const documentTypes = ['application/pdf', 'text/plain'];
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'];

  if (imageTypes.includes(inputMime) && imageTypes.includes(outputMime)) return 'image';
  if (documentTypes.includes(inputMime) && documentTypes.includes(outputMime)) return 'document';
  if (audioTypes.includes(inputMime) && audioTypes.includes(outputMime)) return 'audio';

  // mixed - treat as document
  return 'document';
}

export function calculateTokenCost(
  fileSizeBytes: number,
  inputMime: string,
  outputMime: string,
): number {
  const fileMB = fileSizeBytes / (1024 * 1024);
  const sizeBonus = Math.ceil(fileMB / 5);
  const baseCost = 2 + sizeBonus;
  const category = getConversionCategory(inputMime, outputMime);
  const multiplier = MULTIPLIERS[category];
  return Math.max(1, Math.round(baseCost * multiplier));
}

export const TOKEN_PACKS = [
  { id: 'pack_50', tokens: 50, amountCents: 499, label: '50 Tokens', price: '€4.99' },
  { id: 'pack_200', tokens: 200, amountCents: 1499, label: '200 Tokens', price: '€14.99' },
  { id: 'pack_500', tokens: 500, amountCents: 2999, label: '500 Tokens', price: '€29.99' },
] as const;

export type PackId = 'pack_50' | 'pack_200' | 'pack_500';

export function getPackById(packId: string) {
  return TOKEN_PACKS.find((p) => p.id === packId) ?? null;
}
