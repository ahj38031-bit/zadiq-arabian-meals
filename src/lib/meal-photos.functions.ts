import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "meal-photos";
const keyZ = z.string().regex(/^[0-9a-f-]{36}\.(jpg|png|webp)$/);

// Photos are stored under unguessable random keys; the app has no cloud accounts yet,
// so the key itself (kept in the user's local meal history) is the access token.
export const uploadMealPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    imageData: z.string().max(8_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const m = /^data:image\/(jpeg|png|webp);base64,(.*)$/s.exec(data.imageData)!;
    const mime = `image/${m[1]}`;
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const key = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(key, bytes, { contentType: mime, upsert: false });
    if (error) { console.error("[photo upload]", error.message); throw new Error("upload_failed"); }
    return { key };
  });

export const getMealPhotoUrl = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ key: keyZ }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(data.key, 60 * 60 * 6);
    if (error || !signed) return { url: null };
    return { url: signed.signedUrl };
  });

export const deleteMealPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ key: keyZ }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(BUCKET).remove([data.key]);
    return { ok: true };
  });
