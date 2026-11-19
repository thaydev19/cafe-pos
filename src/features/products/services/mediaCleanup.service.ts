// ============================================================================
// Media Storage Cleanup & Lifecycle Service
// Enterprise 7-day Grace Period Pattern for Supabase Storage (menu-items)
// ============================================================================

import { supabase } from "@/lib/supabase";
import { PRODUCT_STORAGE_BUCKET } from "./productImage.service";

export interface MediaAuditSummary {
  totalFiles: number;
  activeFiles: number;
  orphanedGracePeriod: number; // Unused, but < 7 days old
  orphanedExpired: number;     // Unused, and >= 7 days old (eligible for auto-purge)
  orphanedTotalBytes: number;
  filesToPurge: Array<{
    name: string;
    path: string;
    size: number;
    created_at: string;
    ageDays: number;
  }>;
}

export interface PurgeResult {
  purgedCount: number;
  freedBytes: number;
  errors?: string[];
}

/**
 * Extracts storage relative file path (e.g. "products/item_123.webp")
 * from a full Supabase CDN URL. Returns null for external links (Unsplash, etc.)
 */
export function extractStoragePath(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  // Match: .../menu-items/products/item_xxx.webp or .../menu-items/(...)
  const bucketMarker = `/${PRODUCT_STORAGE_BUCKET}/`;
  const idx = url.indexOf(bucketMarker);
  if (idx === -1) return null;

  const rawPath = url.substring(idx + bucketMarker.length);
  // Strip any query params (?t=...)
  return rawPath.split("?")[0].split("#")[0];
}

/**
 * 1. Queue an old/replaced image for deletion with a 7-day Grace Period.
 * Called automatically whenever:
 *  - A product updates its image to a new one
 *  - A product is deleted from the menu
 */
export async function recordOrphanedImage(oldUrl?: string | null): Promise<void> {
  if (!oldUrl) return;
  const filePath = extractStoragePath(oldUrl);
  if (!filePath) return; // Not our Supabase storage file (external URL)

  try {
    // A. Double check if any OTHER menu item is using this same image URL
    const { count, error: countErr } = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("image_url", oldUrl);

    if (countErr) {
      console.warn("[MediaCleanup] Error checking active image usage:", countErr);
    }

    // If another item still references this image, DO NOT mark for deletion
    if (count && count > 0) {
      return;
    }

    // B. Queue into storage_cleanup_queue with 7-day grace period
    const purgeAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertErr } = await supabase
      .from("storage_cleanup_queue")
      .insert([
        {
          bucket_id: PRODUCT_STORAGE_BUCKET,
          file_path: filePath,
          file_url: oldUrl,
          marked_at: new Date().toISOString(),
          purge_after: purgeAfter,
          status: "pending",
        },
      ]);

    if (insertErr) {
      // If table does not exist, log once without breaking user workflow
      console.warn("[MediaCleanup] Notice: storage_cleanup_queue table optional:", insertErr.message);
    }
  } catch (err) {
    console.warn("[MediaCleanup] Exception recording orphaned image:", err);
  }
}

/**
 * 2. Scans the storage bucket and compares with active database menu items.
 * Categorizes files into:
 *  - Active in menu
 *  - Grace period (< 7 days old)
 *  - Expired orphaned (>= 7 days old)
 */
export async function scanMediaStorage(): Promise<MediaAuditSummary> {
  const result: MediaAuditSummary = {
    totalFiles: 0,
    activeFiles: 0,
    orphanedGracePeriod: 0,
    orphanedExpired: 0,
    orphanedTotalBytes: 0,
    filesToPurge: [],
  };

  try {
    // 1. List all files under "products" folder in bucket
    const { data: storageFiles, error: listErr } = await supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .list("products", {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (listErr || !storageFiles) {
      return result;
    }

    // Filter out potential folder placeholders
    const actualFiles = storageFiles.filter((f) => f.name && !f.name.startsWith("."));
    result.totalFiles = actualFiles.length;

    // 2. Fetch all active image URLs from database
    const { data: activeItems } = await supabase
      .from("menu_items")
      .select("image_url")
      .not("image_url", "is", null);

    const activePathsSet = new Set<string>();
    activeItems?.forEach((item) => {
      const p = extractStoragePath(item.image_url);
      if (p) activePathsSet.add(p);
    });

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // 3. Classify each storage file
    actualFiles.forEach((file) => {
      const fullPath = `products/${file.name}`;
      const isUsed = activePathsSet.has(fullPath);

      if (isUsed) {
        result.activeFiles++;
      } else {
        const fileSizeBytes = file.metadata?.size || 100 * 1024; // default ~100KB
        result.orphanedTotalBytes += fileSizeBytes;

        const fileDate = file.created_at ? new Date(file.created_at).getTime() : now;
        const ageMs = now - fileDate;
        const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

        if (ageMs >= SEVEN_DAYS_MS) {
          result.orphanedExpired++;
          result.filesToPurge.push({
            name: file.name,
            path: fullPath,
            size: fileSizeBytes,
            created_at: file.created_at || new Date().toISOString(),
            ageDays,
          });
        } else {
          result.orphanedGracePeriod++;
        }
      }
    });

    return result;
  } catch (err) {
    console.error("[MediaCleanup] scanMediaStorage error:", err);
    return result;
  }
}

/**
 * 3. Purge orphaned images.
 * @param forceAll If true, purges ALL orphaned files immediately (skips grace period).
 *                 If false (default), only purges files that have exceeded the 7-day grace period.
 */
export async function purgeOrphanedMedia(forceAll: boolean = false): Promise<PurgeResult> {
  const audit = await scanMediaStorage();
  const targets = forceAll
    ? audit.filesToPurge.concat(
        // Include grace period files if forceAll is explicitly requested
        []
      )
    : audit.filesToPurge;

  // If forceAll is true, fetch all orphaned files
  let pathsToDelete: string[] = [];
  let totalBytes = 0;

  if (forceAll) {
    // Re-scan without 7-day restriction
    const { data: storageFiles } = await supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .list("products", { limit: 1000 });

    const { data: activeItems } = await supabase
      .from("menu_items")
      .select("image_url")
      .not("image_url", "is", null);

    const activePaths = new Set(
      activeItems?.map((i) => extractStoragePath(i.image_url)).filter(Boolean)
    );

    (storageFiles || []).forEach((f) => {
      if (f.name && !f.name.startsWith(".")) {
        const p = `products/${f.name}`;
        if (!activePaths.has(p)) {
          pathsToDelete.push(p);
          totalBytes += f.metadata?.size || 100 * 1024;
        }
      }
    });
  } else {
    pathsToDelete = targets.map((t) => t.path);
    totalBytes = targets.reduce((sum, t) => sum + t.size, 0);
  }

  if (pathsToDelete.length === 0) {
    return { purgedCount: 0, freedBytes: 0 };
  }

  try {
    // Supabase Storage batch remove
    const { data, error } = await supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .remove(pathsToDelete);

    if (error) throw error;

    // Update cleanup queue status if present
    try {
      await supabase
        .from("storage_cleanup_queue")
        .update({ status: "purged" })
        .in("file_path", pathsToDelete);
    } catch {
      // Ignore queue update error
    }

    return {
      purgedCount: pathsToDelete.length,
      freedBytes: totalBytes,
    };
  } catch (err: any) {
    console.error("[MediaCleanup] purge error:", err);
    return {
      purgedCount: 0,
      freedBytes: 0,
      errors: [err?.message || "Purge failed"],
    };
  }
}

/**
 * 4. Silent Background Trigger:
 * Runs silently in the background when app loads to purge expired files (> 7 days).
 * Completely fire-and-forget; never blocks UI.
 */
export function runBackgroundCleanupJob(): void {
  // Fire and forget after 3 seconds idle
  setTimeout(async () => {
    try {
      const res = await purgeOrphanedMedia(false);
      if (res.purgedCount > 0) {
        console.log(
          `[MediaCleanup] Auto-cleanup successfully purged ${res.purgedCount} expired images (${(
            res.freedBytes / 1024
          ).toFixed(1)} KB freed).`
        );
      }
    } catch {
      // Silently swallow errors in background
    }
  }, 3000);
}
