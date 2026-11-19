// ============================================================================
// Client-Side Smart Image Compressor for POS Product Photos
// Handles large smartphone camera photos (5MB - 30MB+)
// Compresses down to ~80KB - 150KB while retaining crisp retina quality
// ============================================================================

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses an image File using HTML5 Canvas in the browser.
 * Preserves high visual fidelity while reducing file weight by 80-95%.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const maxDim = options.maxDimension || 1000;
  const quality = options.quality ?? 0.85;
  const preferredMime = options.mimeType || "image/webp";

  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      reject(new Error("ໄຟລ໌ທີ່ເລືອກບໍ່ແມ່ນຮູບພາບ (File is not an image)"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: width, naturalHeight: height } = img;

      // Calculate proportional dimensions
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      // Ensure minimum dimensions
      width = Math.max(1, width);
      height = Math.max(1, height);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) {
        reject(new Error("ບໍ່ສາມາດສ້າງ Canvas context ໄດ້"));
        return;
      }

      // Crisp rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Determine supported export format
      const targetMime = preferredMime;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to jpeg if webp export failed
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  reject(new Error("ການບີບອັດຮູບພາບຜິດພາດ (Compression failed)"));
                  return;
                }
                finish(fallbackBlob, "image/jpeg", ".jpg");
              },
              "image/jpeg",
              quality
            );
            return;
          }
          finish(blob, targetMime, targetMime === "image/webp" ? ".webp" : ".jpg");
        },
        targetMime,
        quality
      );

      function finish(blob: Blob, mime: string, ext: string) {
        const dataUrl = canvas.toDataURL(mime, quality);
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        const compressedFile = new File([blob], `${cleanName}${ext}`, {
          type: mime,
          lastModified: Date.now(),
        });

        const originalSize = file.size;
        const compressedSize = blob.size;
        const reduction = originalSize > 0
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;

        resolve({
          file: compressedFile,
          blob,
          dataUrl,
          width,
          height,
          originalSize,
          compressedSize,
          reductionPercentage: reduction,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ບໍ່ສາມາດອ່ານໄຟລ໌ຮູບພາບໄດ້ (Cannot decode image)"));
    };

    img.src = objectUrl;
  });
}
