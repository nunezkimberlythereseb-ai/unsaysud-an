/**
 * Utility for validating and compressing stall owner food photos.
 * Resizes images to max 800x600 while maintaining aspect ratio,
 * compressing as JPEG/WebP to keep the application fast and responsive.
 */

export interface CompressionResult {
  dataUrl: string;
  width: number;
  height: number;
  originalSizeKB: number;
  compressedSizeKB: number;
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 800; // max width or height
const COMPRESSION_QUALITY = 0.82; // high visual quality with small footprint

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const type = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isSupportedType = SUPPORTED_TYPES.includes(type) || ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');

  if (!isSupportedType) {
    return { 
      valid: false, 
      error: 'Please upload a JPG, JPEG, PNG, or WEBP image.' 
    };
  }

  // 15MB absolute upper safety limit before compression
  if (file.size > 15 * 1024 * 1024) {
    return { 
      valid: false, 
      error: 'Image file is too large (maximum 15MB before compression).' 
    };
  }

  return { valid: true };
}

export function compressImageFile(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const originalSizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scale
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context could not be created.'));
        }

        // Fill background with white for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw and smoothly resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG for universal browser compatibility
        const outputFormat = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, COMPRESSION_QUALITY);
        
        // Approximate base64 size in KB
        const compressedSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          originalSizeKB,
          compressedSizeKB
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsDataURL(file);
  });
}
