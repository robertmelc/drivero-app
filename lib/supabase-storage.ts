import { createClient } from "@supabase/supabase-js";

// Server-side only — uses the service role key, so this file must never be imported
// from a Client Component. It bypasses Storage RLS, which is fine here because every
// call already goes through requireSession() in the API route first.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const BUCKET = "handover-photos";

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
