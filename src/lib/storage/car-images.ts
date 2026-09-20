import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { getAdminLocale } from "@/lib/admin/i18n";
import { getDictionaryFor } from "@/i18n/dictionaries";

export const CAR_IMAGE_BUCKET = "car-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type UploadResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; error: string };

/**
 * Validates a client-provided file and uploads it to the 'car-images' bucket
 * with the service role. Validation mirrors the bucket policy (image MIME
 * types only, ≤ 5MB) and is enforced here regardless of what the browser sent.
 *
 * Returns the storage path + public URL to persist in `car_images.image_url`.
 */
export async function uploadCarImage(
  file: File,
  folder = "vehicles",
): Promise<UploadResult> {
  const m = (await getDictionaryFor(await getAdminLocale())).admin.messages;

  if (file instanceof File === false) {
    return { ok: false, error: m.invalidFileUpload };
  }

  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return {
      ok: false,
      error: m.imageTypeNotAllowed,
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: m.emptyFile };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: m.fileTooLarge };
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const path = `${folder}/${Date.now()}-${safeName || `image.${extension}`}`;

  const supabase = await createServerClient();
  const { error } = await supabase.storage.from(CAR_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("uploadCarImage error:", error.message);
    return { ok: false, error: m.imageUploadFailed };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CAR_IMAGE_BUCKET).getPublicUrl(path);

  return { ok: true, path, publicUrl };
}