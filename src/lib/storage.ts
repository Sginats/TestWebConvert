import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isS3Enabled = !!(
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_ENDPOINT &&
  process.env.R2_BUCKET
);

const s3Client = isS3Enabled
  ? new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET = process.env.R2_BUCKET;

const STORAGE_DIR = process.env.STORAGE_DIR ?? './storage';
const INPUT_DIR = path.join(STORAGE_DIR, 'inputs');
const OUTPUT_DIR = path.join(STORAGE_DIR, 'outputs');

export function ensureStorageDirs() {
  if (isS3Enabled) return;
  [STORAGE_DIR, INPUT_DIR, OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function generateStorageKey(ext: string): string {
  return `${uuidv4()}.${ext}`;
}

export async function saveInputFile(buffer: Buffer, ext: string): Promise<string> {
  const filename = generateStorageKey(ext);
  if (isS3Enabled && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `inputs/${filename}`,
        Body: buffer,
      }),
    );
    return filename;
  } else {
    ensureStorageDirs();
    const filePath = path.join(INPUT_DIR, filename);
    await fs.promises.writeFile(filePath, buffer);
    return filename;
  }
}

export async function saveOutputFile(buffer: Buffer, ext: string): Promise<string> {
  const filename = generateStorageKey(ext);
  if (isS3Enabled && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `outputs/${filename}`,
        Body: buffer,
      }),
    );
    return filename;
  } else {
    ensureStorageDirs();
    const filePath = path.join(OUTPUT_DIR, filename);
    await fs.promises.writeFile(filePath, buffer);
    return filename;
  }
}

export async function readFile(key: string, type: 'inputs' | 'outputs'): Promise<Buffer> {
  if (isS3Enabled && s3Client) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `${type}/${key}`,
      }),
    );
    const bytes = await response.Body?.transformToByteArray();
    return Buffer.from(bytes!);
  } else {
    const dir = type === 'inputs' ? INPUT_DIR : OUTPUT_DIR;
    return fs.promises.readFile(path.join(dir, key));
  }
}

export async function getDownloadUrl(key: string): Promise<string> {
  if (isS3Enabled && s3Client) {
    return getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `outputs/${key}`,
      }),
      { expiresIn: 3600 },
    );
  } else {
    return `/api/download/local/${key}`; // We need a new route for local download if we use URLs
  }
}

export async function deleteFile(key: string, type: 'inputs' | 'outputs'): Promise<void> {
  try {
    if (isS3Enabled && s3Client) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: `${type}/${key}`,
        }),
      );
    } else {
      const dir = type === 'inputs' ? INPUT_DIR : OUTPUT_DIR;
      await fs.promises.unlink(path.join(dir, key));
    }
  } catch {
    // ignore
  }
}

export function getInputPath(filename: string): string {
  // Deprecated for S3, but keep for compatibility if needed. 
  // Should use readFile(filename, 'inputs') instead.
  return path.join(INPUT_DIR, filename);
}

export function getOutputPath(filename: string): string {
  return path.join(OUTPUT_DIR, filename);
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
