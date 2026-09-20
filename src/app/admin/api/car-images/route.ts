import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/authorization";
import { adminMessages } from "@/lib/admin/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { uploadCarImage } from "@/lib/storage/car-images";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * Multipart upload endpoint for vehicle images (POST).
 *
 * Accepts a `carId` field plus one or more `files` fields. Each file is
 * validated and uploaded to the 'car-images' bucket, then attached to the
 * vehicle as a `car_images` row with the next available `sort_order`. Returns
 * the created rows (aligned with the input file order) so the client can apply
 * the final ordering afterwards via `adminSaveCarImages`.
 *
 * A Route Handler is used instead of a Server Action because image uploads can
 * exceed Server Actions' 1MB body limit.
 */
export async function POST(request: NextRequest) {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return json({ ok: false, error: m.accessRequired }, 401);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return json({ ok: false, error: m.invalidFormBody }, 400);

  const carId = String(form.get("carId") ?? "").trim();
  if (!carId) return json({ ok: false, error: m.vehicleIdRequired }, 400);

  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return json({ ok: false, error: m.noImageFiles }, 400);
  }

  const supabase = await createServerClient();

  const { data: car } = await supabase
    .from("cars")
    .select("id")
    .eq("id", carId)
    .maybeSingle();
  if (!car) return json({ ok: false, error: m.vehicleNotFound }, 404);

  const { data: maxRow } = await supabase
    .from("car_images")
    .select("sort_order")
    .eq("car_id", carId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const base = (maxRow?.[0]?.sort_order ?? -1) + 1;

  const images: Array<{ id: string; image_url: string; sort_order: number }> = [];
  for (let i = 0; i < files.length; i++) {
    const upload = await uploadCarImage(files[i], `vehicles/${carId}`);
    if (!upload.ok) {
      return json({ ok: false, error: upload.error, fileIndex: i }, 400);
    }

    const { data, error } = await supabase
      .from("car_images")
      .insert({
        car_id: carId,
        image_url: upload.publicUrl,
        sort_order: base + i,
      })
      .select("id, image_url, sort_order")
      .single();

    if (error) {
      console.error("car-images route insert error:", error.message);
      return json(
        { ok: false, error: m.imageSaveFailed },
        500,
      );
    }

    images.push(data);
  }

  revalidatePath("/", "layout");
  return json({ ok: true, images });
}