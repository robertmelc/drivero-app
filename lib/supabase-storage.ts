import { createClient } from "@supabase/supabase-js";

// Server-side only — uses the service role key, so this file must never be imported
// from a Client Component. It bypasses Storage RLS, which is fine here because every
// call already goes through requireSession() in the API route first.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const BUCKET = "handover-photos";

/**
 * Old direct-upload path — kept for reference/small files, but Vercel's ~4.5MB
 * serverless payload limit makes this unreliable for real camera photos.
 * The handover form now uses createSignedUploadUrl() below instead.
 */
export async function uploadPhoto(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const path = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Nahrání fotky selhalo: ${error.message}`);
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generates a short-lived signed URL the browser can upload directly to —
 * the file bytes never pass through our Vercel function, so Vercel's payload
 * size limit never applies.
 */
export async function createSignedUploadUrl(fileName: string, bucket: string = BUCKET) {
  const path = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw new Error(`Nepodařilo se připravit nahrání: ${error.message}`);

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicUrlData.publicUrl,
  };
}
