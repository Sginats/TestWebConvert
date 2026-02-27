import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = process.env.STORAGE_DIR ?? './storage';
const INPUT_DIR = path.join(STORAGE_DIR, 'inputs');
const OUTPUT_DIR = path.join(STORAGE_DIR, 'outputs');

export function ensureStorageDirs() {
  [STORAGE_DIR, INPUT_DIR, OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function getInputPath(filename: string): string {
  ensureStorageDirs();
  return path.join(INPUT_DIR, filename);
}

export function getOutputPath(filename: string): string {
  ensureStorageDirs();
  return path.join(OUTPUT_DIR, filename);
}

export function generateStorageKey(ext: string): string {
  return `${uuidv4()}.${ext}`;
}

export async function saveInputFile(buffer: Buffer, ext: string): Promise<string> {
  ensureStorageDirs();
  const filename = generateStorageKey(ext);
  const filePath = path.join(INPUT_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return filename;
}

export async function saveOutputFile(buffer: Buffer, ext: string): Promise<string> {
  ensureStorageDirs();
  const filename = generateStorageKey(ext);
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return filename;
}

export async function readFile(filePath: string): Promise<Buffer> {
  return fs.promises.readFile(filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // ignore if file doesn't exist
  }
}

export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
  };
  return map[mime] ?? 'bin';
}

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
];

export const ALLOWED_CONVERSIONS: Record<string, string[]> = {
  'image/png': ['image/jpeg', 'image/webp'],
  'image/jpeg': ['image/png', 'image/webp'],
  'image/webp': ['image/png', 'image/jpeg'],
  'application/pdf': ['text/plain'],
  'text/plain': ['application/pdf'],
};

export function isConversionSupported(inputMime: string, outputMime: string): boolean {
  return ALLOWED_CONVERSIONS[inputMime]?.includes(outputMime) ?? false;
}
