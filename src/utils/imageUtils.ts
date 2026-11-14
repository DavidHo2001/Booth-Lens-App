import ImageResizer from '@bam.tech/react-native-image-resizer';

export type UploadImageFile = {
  uri: string;
  type: string;
  name: string;
};

export async function getImageSizeInBytes(uri: string): Promise<number | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return null;
  }
}

export async function findOversizedImages(
  images: UploadImageFile[],
  maxBytes: number,
): Promise<Array<{name: string; sizeBytes: number}>> {
  const oversized: Array<{name: string; sizeBytes: number}> = [];
  for (const image of images) {
    const size = await getImageSizeInBytes(image.uri);
    if (size !== null && size > maxBytes) {
      oversized.push({name: image.name, sizeBytes: size});
    }
  }
  return oversized;
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const QUALITY_STEPS = [85, 75, 65, 55, 45, 35];
const DIMENSION_STEPS = [1600, 1280, 1024, 900, 800, 720];

function normalizeUri(pathOrUri: string): string {
  return pathOrUri.startsWith('file://') ? pathOrUri : `file://${pathOrUri}`;
}

function withJpgFileName(name: string): string {
  if (/\.(jpg|jpeg)$/i.test(name)) {
    return name;
  }
  return `${name.replace(/\.[^.]+$/, '')}.jpg`;
}

export async function compressImageToUnderLimit(
  image: UploadImageFile,
  maxBytes: number,
): Promise<{file: UploadImageFile; sizeBytes: number | null}> {
  const originalSize = await getImageSizeInBytes(image.uri);
  if (originalSize !== null && originalSize <= maxBytes) {
    return {file: image, sizeBytes: originalSize};
  }

  let candidateFile = image;
  let candidateSize = originalSize;

  for (const dimension of DIMENSION_STEPS) {
    for (const quality of QUALITY_STEPS) {
      try {
        const resized = await ImageResizer.createResizedImage(
          candidateFile.uri,
          dimension,
          dimension,
          'JPEG',
          quality,
          0,
          undefined,
          false,
          {mode: 'contain', onlyScaleDown: true},
        );

        const uri = normalizeUri(resized.uri || resized.path);
        const compressedFile: UploadImageFile = {
          uri,
          type: 'image/jpeg',
          name: withJpgFileName(image.name),
        };

        const size = resized.size ?? (await getImageSizeInBytes(uri));
        candidateFile = compressedFile;
        candidateSize = size;
        if (size !== null && size <= maxBytes) {
          return {file: compressedFile, sizeBytes: size};
        }
      } catch {
        // Continue trying with smaller quality/dimensions.
      }
    }
  }

  return {file: candidateFile, sizeBytes: candidateSize};
}

export async function compressImagesToUnderLimit(
  images: UploadImageFile[],
  maxBytes: number,
): Promise<{
  files: UploadImageFile[];
  failed: Array<{name: string; sizeBytes: number | null}>;
}> {
  const files: UploadImageFile[] = [];
  const failed: Array<{name: string; sizeBytes: number | null}> = [];
  
  for (const image of images) {
    const compressed = await compressImageToUnderLimit(image, maxBytes);
    files.push(compressed.file);
    if (compressed.sizeBytes === null || compressed.sizeBytes > maxBytes) {
      failed.push({name: image.name, sizeBytes: compressed.sizeBytes});
    }
  }

  return {files, failed};
}
