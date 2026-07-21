"use client";

import { createClient } from "@supabase/supabase-js";

// The anon key is safe to expose in the browser bundle — it has no elevated
// privileges on its own. Real access control happens server-side, in
// /api/upload/sign, which requires a valid session before issuing a signed URL.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
