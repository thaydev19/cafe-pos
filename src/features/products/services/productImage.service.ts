// ============================================================================
// Product Image Upload & Storage Service for Supabase
// Integrates client-side image compression + Supabase Storage bucket
// ============================================================================

import { supabase } from "@/lib/supabase";
import { compressImage, CompressionResult } from "@/utils/imageCompressor";

export const PRODUCT_STORAGE_BUCKET = "menu-items";

export interface UploadImageResponse {
  url: string;
  isSupabaseStorage: boolean;
  compression: CompressionResult;
  error?: string;
}

/**
 * Compresses an image file from smartphone or computer,
 * then uploads it to the Supabase Storage bucket 'menu-items'.
 * Gracefully falls back to high-quality compressed Base64 Data URL if the bucket
 * is not yet initialized, ensuring user workflow is never blocked.
 */
export async function uploadProductImage(file: File): Promise<UploadImageResponse> {
  // 1. Client-side compression (converts multi-megabyte photo down to ~80-120KB WebP)
  const compression = await compressImage(file, {
    maxDimension: 1000,
    quality: 0.85,
    mimeType: "image/webp",
  });

  // 2. Generate unique safe path
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `item_${timestamp}_${randomSuffix}.webp`;
  const filePath = `products/${fileName}`;

  try {
    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .upload(filePath, compression.blob, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (error) {
      console.warn("[ProductImageService] Supabase upload error:", error);
      return {
        url: compression.dataUrl,
        isSupabaseStorage: false,
        compression,
        error: error.message,
      };
    }

    // 4. Retrieve public CDN URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      isSupabaseStorage: true,
      compression,
    };
  } catch (err: any) {
    console.warn("[ProductImageService] Upload exception:", err);
    return {
      url: compression.dataUrl,
      isSupabaseStorage: false,
      compression,
      error: err?.message || "Storage error",
    };
  }
}
