import sharp from 'sharp';

export interface ImageConversionOptions {
  resizeWidth?: number;
  resizeHeight?: number;
}

export async function convertImage(
  inputBuffer: Buffer,
  outputMime: string,
  options: ImageConversionOptions = {},
): Promise<Buffer> {
  let pipeline = sharp(inputBuffer);

  if (options.resizeWidth || options.resizeHeight) {
    pipeline = pipeline.resize(options.resizeWidth ?? null, options.resizeHeight ?? null, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  switch (outputMime) {
    case 'image/jpeg':
      return pipeline.jpeg({ quality: 90 }).toBuffer();
    case 'image/png':
      return pipeline.png({ compressionLevel: 8 }).toBuffer();
    case 'image/webp':
      return pipeline.webp({ quality: 90 }).toBuffer();
    default:
      throw new Error(`Unsupported output image type: ${outputMime}`);
  }
}
